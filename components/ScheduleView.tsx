
import React, { useState, useMemo } from 'react';
import type { ServiceEvent, TeamMember, Role, Skill, Team, Assignment, Department } from '../types.ts';
import { EventCard } from './EventCard.tsx';
import { AssignTeamModal } from './AssignTeamModal.tsx';
import { EditEventModal } from './EditEventModal.tsx';
import { AISchedulingAssistantModal } from './AISchedulingAssistantModal.tsx';
import { hasPermission } from '../utils/permissions.ts';
import { sendLocalNotification, requestNotificationPermission, getNotificationPermissionState } from '../utils/notifications.ts';

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
  const [isPaging, setIsPaging] = useState<string | null>(null);
  
  // Track forced expansion states for "Expand All" / "Collapse All"
  const [globalExpansionState, setGlobalExpansionState] = useState<'collapsed' | 'expanded' | 'custom'>('custom');

  const sortedEvents = useMemo(() => {
    return [...serviceEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [serviceEvents]);

  // Group events by Month and Year
  const groupedEvents = useMemo(() => {
      const groups: Record<string, ServiceEvent[]> = {};
      sortedEvents.forEach(event => {
          const monthYear = event.date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!groups[monthYear]) groups[monthYear] = [];
          groups[monthYear].push(event);
      });
      return groups;
  }, [sortedEvents]);

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

    const updatedAssignments: Assignment[] = selectedEvent.assignments.map(a => 
      a.roleId === selectedRole.id 
        ? { ...a, memberId, traineeId, status: 'pending' as const } 
        : a
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

      const permState = getNotificationPermissionState();
      if (permState === 'default') {
          const granted = await requestNotificationPermission();
          if (!granted) {
              alert("Wait! To page the team with device alerts, you must enable notifications when prompted.");
              return;
          }
      } else if (permState === 'denied') {
          alert("Action Required: Notifications are blocked in your browser settings. You cannot page the team until these are enabled.");
          return;
      }

      const confirmation = window.confirm(
          `Page ${assignedMemberIds.size} members for "${event.name}"?\n\nThis will trigger a high-priority device notification for immediate roster confirmation.`
      );

      if (confirmation) {
          setIsPaging(event.id);
          const now = new Date();
          const eventDateStr = event.date.toLocaleDateString();
          
          const updatedAssignments: Assignment[] = event.assignments.map(a => 
              a.memberId ? { ...a, lastPagedAt: now } : a
          );
          
          onUpdateEvent({ ...event, assignments: updatedAssignments });

          await sendLocalNotification(
              `🚨 URGENT: ${event.name}`, 
              `Confirm your role for ${eventDateStr}. Call time: ${new Date(event.callTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          );
          
          setTimeout(() => {
              setIsPaging(null);
              alert(`Success! Team paged.`);
          }, 1000);
      }
  };

  const jumpToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextEvent = sortedEvents.find(e => e.date >= today);
    if (nextEvent) {
        setGlobalExpansionState('custom');
        const element = document.getElementById(nextEvent.id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // The card for the next event will automatically be expanded by isFirst if it's the first in the list
            // or we could add specific logic to ensure it expands when jumped to.
        }
    }
  };

  const canSchedule = hasPermission(currentUser, 'scheduler');

  return (
    <div className="space-y-6 p-4 sm:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 id="full-schedule-title" className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Roster Control</h2>
            <p className="text-sm text-gray-500 font-medium italic tracking-tight">Technical deployment and readiness logs.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
                onClick={jumpToToday}
                className="flex-grow md:flex-grow-0 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50 tracking-widest shadow-sm transition-all active:scale-95"
            >
                Jump to Next
            </button>
            {departments && departments.length > 0 && (
                <div className="flex-grow md:flex-grow-0 relative">
                    <select 
                        value={selectedDepartment} 
                        onChange={e => setSelectedDepartment(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-[10px] font-black uppercase tracking-widest border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-xl shadow-sm"
                    >
                        <option value="all">All Units</option>
                        {/* FIX: Explicitly cast departments to Department[] to ensure map is available if narrowing fails */}
                        {(departments as Department[]).map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        <option value="none">Uncategorized</option>
                    </select>
                </div>
            )}
        </div>
      </div>

      {/* Global Collapse/Expand Controller */}
      <div className="flex justify-end gap-2">
          <button 
            onClick={() => setGlobalExpansionState('expanded')}
            className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded border transition-colors ${globalExpansionState === 'expanded' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-400 border-gray-200'}`}
          >
              Expand All
          </button>
          <button 
            onClick={() => setGlobalExpansionState('collapsed')}
            className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded border transition-colors ${globalExpansionState === 'collapsed' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-400 border-gray-200'}`}
          >
              Collapse All
          </button>
      </div>
      
      <div className="space-y-12">
        {Object.keys(groupedEvents).length > 0 ? (
            /* FIX: Explicitly cast Object.entries results to resolve 'map does not exist on type unknown' errors when iterating over grouped data */
            (Object.entries(groupedEvents) as [string, ServiceEvent[]][]).map(([monthYear, events]) => (
                <div key={monthYear} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 whitespace-nowrap">{monthYear}</h3>
                        <div className="h-px w-full bg-gray-100" />
                    </div>
                    <div className="space-y-4">
                        {events.map((event, index) => (
                            <div key={event.id} id={event.id} className="animate-fade-in-up">
                                <EventCard
                                    key={`${event.id}-${globalExpansionState}`}
                                    event={event}
                                    roles={filteredRoles}
                                    teamMembers={teamMembers}
                                    onAssignClick={handleOpenAssignModal}
                                    onEditClick={handleOpenEditEventModal}
                                    onNotifyClick={handleNotifyTeam}
                                    onAIAssistClick={handleOpenAIAssistant}
                                    onDeleteClick={onDeleteEvent}
                                    canSchedule={canSchedule}
                                    isFirst={globalExpansionState === 'expanded' ? true : (globalExpansionState === 'collapsed' ? false : index === 0)}
                                    initiallyExpanded={globalExpansionState === 'expanded' ? true : (globalExpansionState === 'collapsed' ? false : undefined)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-24 bg-white rounded-3xl shadow-xl border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Roster Empty</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Create a new service event to start deploying your technical team.</p>
                {canSchedule && (
                    <div className="mt-8">
                        <button
                            onClick={() => handleOpenEditEventModal(null)}
                            className="inline-flex items-center px-8 py-4 border border-transparent shadow-xl text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-brand-primary hover:bg-brand-primary-dark transition-all transform active:scale-95"
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
          teamCorporateChecklist={currentTeam.corporateChecklist}
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
