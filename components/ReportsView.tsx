import React, { useMemo } from 'react';
import type { ServiceEvent, TeamMember, Team } from '../types.ts';
import { CheckInTimelinessChart } from './CheckInTimelinessChart.tsx';
import { DebriefAnalysis } from './DebriefAnalysis.tsx';

interface ReportsViewProps {
  serviceEvents: ServiceEvent[];
  teamMembers: TeamMember[];
  currentTeam: Team;
  currentUser: TeamMember;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ serviceEvents, teamMembers, currentTeam, currentUser }) => {

    const checkInTimelinessData = useMemo(() => {
        let early = 0, onTime = 0, late = 0;
        teamMembers.forEach(member => {
            member.checkIns.forEach(checkIn => {
                const event = serviceEvents.find(e => e.id === checkIn.eventId);
                if (event) {
                    const checkInTime = new Date(checkIn.checkInTime).getTime();
                    const callTime = new Date(event.callTime).getTime();
                    const diffMinutes = (checkInTime - callTime) / (1000 * 60);

                    if (diffMinutes < -5) early++;
                    else if (diffMinutes <= 5) onTime++;
                    else late++;
                }
            });
        });
        return [
            { name: 'Early', value: early },
            { name: 'On Time', value: onTime },
            { name: 'Late', value: late },
        ];
    }, [serviceEvents, teamMembers]);
    

  return (
    <div className="space-y-8 p-4 sm:p-0">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Reports &amp; Analytics</h2>
            </div>
        </div>
        
        <div id="guide-debrief-analysis">
            <DebriefAnalysis serviceEvents={serviceEvents} />
        </div>

        <div id="guide-timeliness-chart" className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">Team-wide Check-in Timeliness</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">Summary of all team member check-ins relative to call time.</p>
             <div className="h-96">
                <CheckInTimelinessChart data={checkInTimelinessData} />
            </div>
        </div>
    </div>
  );
};