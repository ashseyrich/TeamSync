
import React, { useMemo } from 'react';
import type { ServiceEvent, Role, TeamMember, Team } from '../types.ts';
import { MyEventCard } from './MyEventCard.tsx';
import { Announcements } from './Announcements.tsx';
import { DailyEngagement } from './DailyEngagement.tsx';
import { hasPermission } from '../utils/permissions.ts';

interface MyScheduleViewProps {
  serviceEvents: ServiceEvent[];
  roles: Role[];
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onCheckIn: (eventId: string, location: { latitude: number; longitude: number; }) => Promise<void>;
  onUpdateEvent: (event: ServiceEvent) => void;
  onRemoveAnnouncement: (announcementId: string) => void;
  currentTeam: Team;
  onAddPrayerPoint: (text: string) => void;
  onRemovePrayerPoint: (pointId: string) => void;
  onMarkAsRead: (announcementIds: string[]) => void;
  pendingMemberCount?: number;
  onNavigateToTeam?: () => void;
}

export const MyScheduleView: React.FC<MyScheduleViewProps> = ({ 
  serviceEvents, roles, currentUser, teamMembers, 
  onCheckIn, onUpdateEvent, onRemoveAnnouncement, currentTeam, onAddPrayerPoint, onRemovePrayerPoint,
  onMarkAsRead, pendingMemberCount, onNavigateToTeam
}) => {

  const myEvents = useMemo(() => {
    return serviceEvents
      .filter(event => 
        event.assignments.some(a => a.memberId === currentUser.id || a.traineeId === currentUser.id)
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [serviceEvents, currentUser.id]);

  const isAdmin = hasPermission(currentUser, 'admin');

  return (
    <div className="space-y-8 p-4 sm:p-0">
      {isAdmin && pendingMemberCount && pendingMemberCount > 0 ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm flex justify-between items-center animate-fade-in">
              <div className="flex items-center gap-3">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                   <div>
                       <h3 className="text-sm font-bold text-red-800">Action Required</h3>
                       <p className="text-sm text-red-700">You have {pendingMemberCount} pending team member request{pendingMemberCount > 1 ? 's' : ''}.</p>
                   </div>
              </div>
              <button 
                onClick={onNavigateToTeam}
                className="px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200 text-sm whitespace-nowrap"
              >
                  Review Now
              </button>
          </div>
      ) : null}

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-md text-gray-600">Welcome, {currentUser.name.split(' ')[0]}! Here are your assignments and today's team focus.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div id="guide-daily-engagement">
          <DailyEngagement 
            team={currentTeam}
            currentUser={currentUser}
            onAddPrayerPoint={onAddPrayerPoint}
            onRemovePrayerPoint={onRemovePrayerPoint}
          />
        </div>
        <div id="guide-announcements">
          <Announcements 
            announcements={currentTeam.announcements}
            scriptures={currentTeam.scriptures}
            currentUser={currentUser}
            teamMembers={teamMembers}
            onRemoveAnnouncement={onRemoveAnnouncement}
            onMarkAsRead={onMarkAsRead}
            teamType={currentTeam.type}
            teamDescription={currentTeam.description}
          />
        </div>
      </div>
      
      <div id="guide-my-assignments">
        {myEvents.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 border-t pt-8">My Assignments</h3>
            {myEvents.map(event => (
              <MyEventCard
                key={event.id}
                event={event}
                roles={roles}
                currentUser={currentUser}
                teamMembers={teamMembers}
                onCheckIn={onCheckIn}
                onUpdateEvent={onUpdateEvent}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border-t mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">My Assignments</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">You have not been scheduled for any events.</p>
          </div>
        )}
      </div>
    </div>
  );
};
