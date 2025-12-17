import type { ServiceEvent, TeamMember, AttendanceStats, PerformanceAlert } from '../types.ts';

/**
 * Calculates detailed attendance statistics for a single team member.
 * Logic: (OnTime + Early + (Late * 0.5)) / Total Past Assignments
 */
export const calculateAttendanceStats = (member: TeamMember, allEvents: ServiceEvent[]): AttendanceStats => {
    const now = new Date();
    const pastAssignments = allEvents
        .filter(event => new Date(event.date).getTime() < now.getTime())
        .filter(event => event.assignments.some(a => a.memberId === member.id || a.traineeId === member.id));

    const stats = {
        totalAssignments: pastAssignments.length,
        onTime: 0,
        early: 0,
        late: 0,
        noShow: 0,
    };

    pastAssignments.forEach(event => {
        const checkIn = member.checkIns?.find(ci => ci.eventId === event.id);
        if (checkIn) {
            const checkInTime = new Date(checkIn.checkInTime).getTime();
            const callTime = new Date(event.callTime).getTime();
            const diffMinutes = (checkInTime - callTime) / (1000 * 60);

            if (diffMinutes < -5) stats.early++;
            else if (diffMinutes <= 5) stats.onTime++;
            else stats.late++;
        } else {
            stats.noShow++;
        }
    });
    
    const totalCheckedIn = stats.onTime + stats.early + stats.late;
    const onTimePercentage = totalCheckedIn > 0 ? ((stats.onTime + stats.early) / totalCheckedIn) * 100 : 100;

    // Reliability Score Calculation: 0-100 scale
    // Penalize No-Shows (100% loss for that slot) and Late (50% loss for that slot)
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
    
    // Alert for repeated lateness (more than 30% of check-ins)
    if (totalCheckedIn >= 3 && (stats.late / totalCheckedIn) > 0.3) {
         alerts.push({
            type: 'lateness',
            level: stats.late > 5 ? 'critical' : 'warning',
            message: `Punctuality alert: You've been late for ${stats.late} of your recent check-ins.`
        });
    }

    // Alert for no-shows (2 or more)
    if (stats.noShow >= 2) {
        alerts.push({
            type: 'no-shows',
            level: stats.noShow > 3 ? 'critical' : 'warning',
            message: `Accountability alert: ${stats.noShow} no-shows detected. Please coordinate with your lead if you cannot attend.`
        });
    }

    return alerts;
};