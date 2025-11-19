
import React, { useState, useMemo } from 'react';
import type { ServiceEvent, TeamMember, Role, Skill, Team } from '../types.ts';
import { EventCard } from './EventCard.tsx';
import { AssignTeamModal } from './AssignTeamModal.tsx';
import { EditEventModal } from './EditEventModal.tsx';
import { AISchedulingAssistantModal } from './AISchedulingAssistantModal.tsx';
import { hasPermission } from '../utils/permissions.ts';

interface ScheduleViewProps {
  serviceEvents: ServiceEvent[];
  currentTeam: Team;
  onUpdateEvent: (event: ServiceEvent) => void;
  currentUser: TeamMember;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ serviceEvents, currentTeam, onUpdateEvent, currentUser }) => {
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
  
  const handleNotifyTeam = (event: ServiceEvent) => {
      const assignedMemberIds = new Set(event.assignments.map(a => a.memberId).filter(Boolean));
      
      if (assignedMemberIds.size === 0) {
          alert("No members are assigned to this event to notify.");
          return;
      }

      const confirmation = window.confirm(
          `This will send a notification to all ${assignedMemberIds.size} assigned members for "${event.name}".\n\n- Via Email (if available)\n- Via SMS (if available)\n\nDo you want to proceed?`
      );

      if (confirmation) {
          const membersToNotify = teamMembers.filter(m => assignedMemberIds.has(m.id));
          const emailCount = membersToNotify.filter(m => m.email).length;
          const smsCount = membersToNotify.filter(m => m.phoneNumber).length;
          
          alert(`Notifications sent for "${event.name}":\n- Email to ${emailCount} members\n- SMS to ${smsCount} members`);
      }
  };

  const canSchedule = hasPermission(currentUser, 'scheduler');

  return (
    <div className="space-y-8 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 id="full-schedule-title" className="text-3xl font-bold text-gray-900">Full Schedule</h2>
        </div>
        {departments && departments.length > 0 && (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter by Department:</span>
                <select 
                    value={selectedDepartment} 
                    onChange={e => setSelectedDepartment(e.target.value)}
                    className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                    <option value="all">All Departments</option>
                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    <option value="none">No Department</option>
                </select>
            </div>
        )}
      </div>
      
      <div className="space-y-6">
        {sortedEvents.length > 0 ? (
            sortedEvents.map((event, index) => (
            <div key={event.id} id={index === 0 ? 'guide-event-card' : undefined}>
                <EventCard
                event={event}
                roles={filteredRoles}
                teamMembers={teamMembers}
                onAssignClick={handleOpenAssignModal}
                onEditClick={handleOpenEditEventModal}
                onNotifyClick={handleNotifyTeam}
                onAIAssistClick={handleOpenAIAssistant}
                canSchedule={canSchedule}
                isFirst={index === 0}
                />
            </div>
            ))
        ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events scheduled</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new service event.</p>
                {canSchedule && (
                    <div className="mt-6">
                        <button
                            onClick={() => handleOpenEditEventModal(null)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create Event
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
