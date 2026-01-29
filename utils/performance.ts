
import type { ServiceEvent, TeamMember, AttendanceStats, PerformanceAlert } from '../types.ts';

/**
 * Robust date normalization for Firebase, ISO strings, and native Date objects.
 */
export const ensureDate = (input: any): Date => {
    if (!input) return new Date(0);
    
    // 1. Handle native Date objects
    if (Object.prototype.toString.call(input) === '[object Date]') {
        return isNaN(input.getTime()) ? new Date(0) : input;
    }
    
    // 2. Handle Firestore Timestamps {seconds, nanoseconds}
    if (typeof input === 'object' && 'seconds' in input && typeof input.seconds === 'number') {
        return new Date(input.seconds * 1000);
    }
    
    // 3. Handle ISO strings or numeric timestamps
    const d = new Date(input);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * Calculates detailed attendance statistics including on-time streaks.
 * Accountability focus: Only factors in services that were NOT declined.
 */
export const calculateAttendanceStats = (member: TeamMember, allEvents: ServiceEvent[]): AttendanceStats => {
    const now = new Date();
    
    const pastAssignments = (allEvents || [])
        .filter(event => {
            const eventDate = ensureDate(event.endDate || event.date);
            return eventDate.getTime() < now.getTime() && eventDate.getTime() !== 0;
        })
        .filter(event => {
            const myAssignment = event.assignments.find(a => a.memberId === member.id || a.traineeId === member.id);
            // ONLY count services that weren't explicitly declined
            return myAssignment && myAssignment.status !== 'declined';
        })
        .sort((a, b) => ensureDate(b.date).getTime() - ensureDate(a.date).getTime());

    const stats = {
        totalAssignments: pastAssignments.length,
        onTime: 0,
        early: 0,
        late: 0,
        noShow: 0,
        currentStreak: 0
    };

    let streakActive = true;

    pastAssignments.forEach((event) => {
        const checkIn = (member.checkIns || []).find(ci => ci.eventId === event.id);
        if (checkIn) {
            const checkInTime = ensureDate(checkIn.checkInTime).getTime();
            const callTime = ensureDate(event.callTime).getTime();
            
            if (checkInTime === 0 || callTime === 0) return;
            
            const diffMinutes = (checkInTime - callTime) / (1000 * 60);

            if (diffMinutes <= 5) {
                if (diffMinutes < -5) stats.early++;
                else stats.onTime++;
                if (streakActive) stats.currentStreak++;
            } else {
                stats.late++;
                streakActive = false;
            }
        } else {
            stats.noShow++;
            streakActive = false;
        }
    });
    
    const totalCheckedIn = stats.onTime + stats.early + stats.late;
    const onTimePercentage = totalCheckedIn > 0 ? ((stats.onTime + stats.early) / totalCheckedIn) * 100 : 100;

    let reliabilityScore = 100;
    if (stats.totalAssignments > 0) {
        const weightedSuccess = stats.onTime + stats.early + (stats.late * 0.5);
        reliabilityScore = (weightedSuccess / stats.totalAssignments) * 100;
    }

    return { ...stats, onTimePercentage, reliabilityScore };
};

/**
 * Detects performance issues like consistent lateness or no-shows.
 */
export const detectPerformanceIssues = (stats: AttendanceStats): PerformanceAlert[] => {
    const alerts: PerformanceAlert[] = [];
    const totalCheckedIn = stats.onTime + stats.early + stats.late;
    
    if (totalCheckedIn >= 3 && (stats.late / totalCheckedIn) > 0.3) {
         alerts.push({
            type: 'lateness',
            level: stats.late > 5 ? 'critical' : 'warning',
            message: `Punctuality alert: You've been late for ${stats.late} of your recent check-ins.`
        });
    }

    if (stats.noShow >= 2) {
        alerts.push({
            type: 'no-shows',
            level: stats.noShow > 3 ? 'critical' : 'warning',
            message: `Accountability alert: ${stats.noShow} no-shows detected. Please coordinate with your lead if you cannot attend.`
        });
    }

    return alerts;
};
