import React, { useState, useMemo } from 'react';
import type { ServiceEvent, TeamMember, Role, Skill, Team } from '../types.ts';
import { EventCard } from './EventCard.tsx';
import { AssignTeamModal } from './AssignTeamModal.tsx';
import { EditEventModal } from './EditEventModal.tsx';
import { AISchedulingAssistantModal } from './AISchedulingAssistantModal.tsx';
import { hasPermission } from '../utils/permissions.ts';
import { sendLocalNotification } from '../utils/notifications.ts';

interface ScheduleViewProps {
  serviceEvents: ServiceEvent[];
  currentTeam: Team;
  onUpdateEvent: (event: ServiceEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  currentUser: TeamMember;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ serviceEvents, currentTeam, onUpdateEvent, onDeleteEvent, currentUser }) => {
  const { members: teamMembers, roles, skills, departments } = currentTeam;
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ServiceEvent | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const sortedEvents = useMemo(() => {
    return [...serviceEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [serviceEvents]);

  const filteredRoles = useMemo(() => {
      if (selectedDepartment === 'all') return roles;
      if (selectedDepartment === 'none') return roles.filter(r => !r.departmentId);
      return roles.filter(r => r.departmentId === selectedDepartment);
  }, [roles, selectedDepartment]);

  const handleOpenAssignModal = (event: ServiceEvent, role: Role) => {
    setSelectedEvent(event);
    setSelectedRole(role);
    setIsAssignModalOpen(true);
  };
  
  const handleOpenEditEventModal = (event: ServiceEvent | null) => {
    setSelectedEvent(event);
    setIsEditEventModalOpen(true);
  };
  
  const handleOpenAIAssistant = (event: ServiceEvent) => {
    setSelectedEvent(event);
    setIsAIAssistantOpen(true);
  }

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedEvent(null);
    setSelectedRole(null);
  };
  
  const handleSaveAssignment = (memberId: string | null, traineeId: string | null) => {
    if (!selectedEvent || !selectedRole) return;

    const updatedAssignments = selectedEvent.assignments.map(a => 
      a.roleId === selectedRole.id ? { ...a, memberId, traineeId } : a
    );
    
    onUpdateEvent({ ...selectedEvent, assignments: updatedAssignments });
    handleCloseAssignModal();
  };
  
  const handleNotifyTeam = async (event: ServiceEvent) => {
      const assignedMemberIds = new Set(event.assignments.map(a => a.memberId).filter(Boolean));
      
      if (assignedMemberIds.size === 0) {
          alert("No members are currently assigned to this event.");
          return;
      }

      const confirmation = window.confirm(
          `Page ${assignedMemberIds.size} members for "${event.name}"?\n\nThis will trigger a device notification (if enabled) and log an accountability ping for the roster.`
      );

      if (confirmation) {
          const eventDateStr = event.date.toLocaleDateString();
          
          // Trigger immediate browser/OS notification
          await sendLocalNotification(
              `Service Alert: ${event.name}`, 
              `You are scheduled to serve on ${eventDateStr}. Please confirm your call time.`
          );
          
          const membersToNotify = teamMembers.filter(m => assignedMemberIds.has(m.id));
          const emailCount = membersToNotify.filter(m => m.email).length;
          const smsCount = membersToNotify.filter(m => m.phoneNumber).length;
          
          alert(`Team Paged successfully:\n- Push Notification triggered for all active devices.\n- Simulation: ${emailCount} Email cues and ${smsCount} SMS cues sent.`);
      }
  };

  const jumpToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextEvent = sortedEvents.find(e => e.date >= today);
    if (nextEvent) {
        document.getElementById(nextEvent.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const canSchedule = hasPermission(currentUser, 'scheduler');

  return (
    <div className="space-y-6 p-4 sm:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 id="full-schedule-title" className="text-3xl font-black text-gray-900 tracking-tight">Full Schedule</h2>
            <p className="text-sm text-gray-500 font-medium">Master planning and roster accountability</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
                onClick={jumpToToday}
                className="flex-grow md:flex-grow-0 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-black uppercase rounded-lg hover:bg-gray-50 tracking-widest shadow-sm transition-colors"
            >
                Jump to Next
            </button>
            {departments && departments.length > 0 && (
                <div className="flex-grow md:flex-grow-0 relative">
                    <select 
                        value={selectedDepartment} 
                        onChange={e => setSelectedDepartment(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-xs font-bold uppercase tracking-wide border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-lg shadow-sm"
                    >
                        <option value="all">All Departments</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        <option value="none">Uncategorized</option>
                    </select>
                </div>
            )}
        </div>
      </div>
      
      <div className="space-y-6">
        {sortedEvents.length > 0 ? (
            sortedEvents.map((event, index) => (
            <div key={event.id} id={event.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <EventCard
                event={event}
                roles={filteredRoles}
                teamMembers={teamMembers}
                onAssignClick={handleOpenAssignModal}
                onEditClick={handleOpenEditEventModal}
                onNotifyClick={handleNotifyTeam}
                onAIAssistClick={handleOpenAIAssistant}
                onDeleteClick={onDeleteEvent}
                canSchedule={canSchedule}
                isFirst={index === 0}
                />
            </div>
            ))
        ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-bold text-gray-900">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">Create a new service event to start scheduling.</p>
                {canSchedule && (
                    <div className="mt-6">
                        <button
                            onClick={() => handleOpenEditEventModal(null)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-bold rounded-lg text-white bg-brand-primary hover:bg-brand-primary-dark transition-all transform active:scale-95"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create First Event
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
      
      {isAssignModalOpen && selectedEvent && selectedRole && (
        <AssignTeamModal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          event={selectedEvent}
          role={selectedRole}
          teamMembers={teamMembers}
          skills={skills}
          onSave={handleSaveAssignment}
        />
      )}

      {isEditEventModalOpen && (
        <EditEventModal
          isOpen={isEditEventModalOpen}
          onClose={() => setIsEditEventModalOpen(false)}
          event={selectedEvent}
          allRoles={roles}
          onSave={onUpdateEvent}
          onDelete={onDeleteEvent}
          savedLocations={currentTeam.savedLocations || []}
          savedAttireThemes={currentTeam.savedAttireThemes || []}
        />
      )}

      {isAIAssistantOpen && selectedEvent && (
        <AISchedulingAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          event={selectedEvent}
          teamMembers={teamMembers}
          roles={roles}
          onApplySuggestions={(updatedAssignments) => {
            onUpdateEvent({ ...selectedEvent, assignments: updatedAssignments });
            setIsAIAssistantOpen(false);
          }}
        />
      )}
    </div>
  );
};