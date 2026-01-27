
import React, { useMemo } from 'react';
import type { ServiceEvent, TeamMember, Team } from '../types.ts';
import { CheckInTimelinessChart } from './CheckInTimelinessChart.tsx';
import { TeamReliabilityChart } from './TeamReliabilityChart.tsx';
import { DebriefAnalysis } from './DebriefAnalysis.tsx';
import { calculateAttendanceStats, ensureDate } from '../utils/performance.ts';

interface ReportsViewProps {
  serviceEvents: ServiceEvent[];
  teamMembers: TeamMember[];
  currentTeam: Team;
  currentUser: TeamMember;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ serviceEvents, teamMembers, currentTeam, currentUser }) => {

    const timelinessData = useMemo(() => {
        let early = 0, onTime = 0, late = 0;
        teamMembers.forEach(member => {
            (member.checkIns || []).forEach(checkIn => {
                const event = serviceEvents.find(e => e.id === checkIn.eventId);
                if (event) {
                    const checkInTime = ensureDate(checkIn.checkInTime).getTime();
                    const callTime = ensureDate(event.callTime).getTime();
                    
                    // Safety check for invalid dates or data corruption
                    if (checkInTime === 0 || callTime === 0) return;

                    const diffMinutes = (checkInTime - callTime) / (1000 * 60);

                    if (diffMinutes < -5) early++;
                    else if (diffMinutes <= 5) onTime++;
                    else late++;
                }
            });
        });
        return [
            { name: 'Early (>5m)', value: early },
            { name: 'On Time (±5m)', value: onTime },
            { name: 'Late (>5m)', value: late },
        ];
    }, [serviceEvents, teamMembers]);

    const reliabilitySummary = useMemo(() => {
        const summary = { rockstar: 0, reliable: 0, inconsistent: 0, atRisk: 0 };
        
        teamMembers.filter(m => m.status === 'active').forEach(member => {
            const stats = calculateAttendanceStats(member, serviceEvents);
            if (stats.totalAssignments === 0) return;

            if (stats.reliabilityScore >= 95) summary.rockstar++;
            else if (stats.reliabilityScore >= 85) summary.reliable++;
            else if (stats.reliabilityScore >= 70) summary.inconsistent++;
            else summary.atRisk++;
        });

        return [
            { category: 'Rockstars (95%+)', count: summary.rockstar, color: '#10B981' },
            { category: 'Reliable (85%+)', count: summary.reliable, color: '#3B82F6' },
            { category: 'Inconsistent', count: summary.inconsistent, color: '#F59E0B' },
            { category: 'At-Risk (<70%)', count: summary.atRisk, color: '#EF4444' },
        ];
    }, [teamMembers, serviceEvents]);

    return (
        <div className="space-y-8 p-4 sm:p-0 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Reports & Analytics</h2>
                    <p className="text-gray-600 font-medium">Tracking team health, accountability, and technical growth.</p>
                </div>
            </div>
            
            <div id="guide-debrief-analysis">
                <DebriefAnalysis serviceEvents={serviceEvents} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div id="guide-timeliness-chart" className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col h-[450px]">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Check-in Timeliness</h3>
                        <p className="text-sm text-gray-500">Aggregate team punctuality records across all services.</p>
                    </div>
                    <div className="flex-grow min-h-0">
                        <CheckInTimelinessChart data={timelinessData} />
                    </div>
                </div>

                <div id="guide-reliability-trends" className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col h-[450px]">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Team Accountability</h3>
                        <p className="text-sm text-gray-500">Distribution of Reliability Scores across the active roster.</p>
                    </div>
                    <div className="flex-grow min-h-0">
                        <TeamReliabilityChart data={reliabilitySummary} />
                    </div>
                </div>
            </div>
        </div>
    );
};
