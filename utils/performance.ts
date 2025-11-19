import type { ServiceEvent, TeamMember, AttendanceStats, PerformanceAlert } from '../types.ts';

/**
 * Calculates detailed attendance statistics for a single team member.
 * @param member The team member to analyze.
 * @param allEvents A list of all service events.
 * @returns An object containing attendance counts and percentages.
 */
export const calculateAttendanceStats = (member: TeamMember, allEvents: ServiceEvent[]): AttendanceStats => {
    const pastAssignments = allEvents
        .filter(event => new Date(event.date).getTime() < Date.now())
        .filter(event => event.assignments.some(a => a.memberId === member.id));

    const stats = {
        totalAssignments: pastAssignments.length,
        onTime: 0,
        early: 0,
        late: 0,
        noShow: 0,
    };

    pastAssignments.forEach(event => {
        const checkIn = member.checkIns.find(ci => ci.eventId === event.id);
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

    return { ...stats, onTimePercentage };
};

/**
 * Detects performance issues like consistent lateness or no-shows.
 * @param stats The calculated attendance stats for a member.
 * @returns An array of performance alert objects.
 */
export const detectPerformanceIssues = (stats: AttendanceStats): PerformanceAlert[] => {
    const alerts: PerformanceAlert[] = [];
    const totalCheckedIn = stats.onTime + stats.early + stats.late;
    
    // Alert for repeated lateness
    if (totalCheckedIn > 2 && stats.late / totalCheckedIn > 0.5) {
         alerts.push({
            type: 'lateness',
            level: stats.late > 3 ? 'critical' : 'warning',
            message: `Noticed you've been late for ${stats.late} of your last ${totalCheckedIn} check-ins.`
        });
    }

    // Alert for no-shows
    if (stats.noShow >= 2) {
        alerts.push({
            type: 'no-shows',
            level: stats.noShow > 3 ? 'critical' : 'warning',
            message: `You've had ${stats.noShow} no-shows for recent events you were scheduled for.`
        });
    }

    return alerts;
};