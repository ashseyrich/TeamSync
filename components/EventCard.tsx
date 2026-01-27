
import React from 'react';
import type { ServiceEvent, Role, TeamMember, Assignment, CorporateTaskStatus } from '../types.ts';

interface EventCardProps {
    event: ServiceEvent;
    roles: Role[];
    teamMembers: TeamMember[];
    onAssignClick: (event: ServiceEvent, role: Role) => void;
    onEditClick: (event: ServiceEvent) => void;
    onNotifyClick: (event: ServiceEvent) => void;
    onAIAssistClick: (event: ServiceEvent) => void;
    onDeleteClick?: (eventId: string) => void;
    canSchedule: boolean;
    isFirst?: boolean;
}

const StatusIndicator: React.FC<{ status: Assignment['status'], assignment: Assignment, roles: Role[] }> = ({ status, assignment, roles }) => {
    const role = roles.find(r => r.id === assignment.roleId);
    
    const activeTasks = assignment.checklistTasks || role?.defaultChecklist || [];
    const totalRoleTasks = activeTasks.length;
    const completedRoleTasks = activeTasks.filter(task => !!assignment.checklistProgress?.[task]).length;
    
    // Only mark as truly READY if all tasks are done OR if no tasks are defined and status is accepted
    const isReady = totalRoleTasks > 0 ? (completedRoleTasks === totalRoleTasks) : status === 'accepted';

    switch (status) {
        case 'accepted':
            return (
                <span className={`flex items-center text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border ${isReady ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {isReady ? (
                        <><svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> READY</>
                    ) : (
                        `Checking (${completedRoleTasks}/${totalRoleTasks})`
                    )}
                </span>
            );
        case 'declined':
            return (
                <span className="flex items-center text-[10px] text-red-600 font-black uppercase tracking-tighter bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                    Declined
                </span>
            );
        default:
            return (
                <span className="flex items-center text-[10px] text-gray-400 font-black uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    Pending
                </span>
            );
    }
}

export const EventCard: React.FC<EventCardProps> = ({ event, roles, teamMembers, onAssignClick, onEditClick, onNotifyClick, onAIAssistClick, onDeleteClick, canSchedule, isFirst = false }) => {
    
    const getMemberName = (memberId: string | null) => {
        if (!memberId) return <span className="text-gray-500 italic">Unassigned</span>;
        return teamMembers.find(m => m.id === memberId)?.name || <span className="text-red-500">Unknown</span>;
    };
    
    const eventDate = new Date(event.date);
    const day = eventDate.toLocaleString('en-US', { day: '2-digit' });
    const month = eventDate.toLocaleString('en-US', { month: 'short' });
    const weekday = eventDate.toLocaleString('en-US', { weekday: 'long' });

    const endDate = event.endDate ? new Date(event.endDate) : null;
    const endMonth = endDate ? endDate.toLocaleString('en-US', { month: 'short' }) : '';
    const endDay = endDate ? endDate.toLocaleString('en-US', { day: '2-digit' }) : '';
    
    const dateDisplay = endDate 
        ? `${month} ${day} - ${endMonth} ${endDay}`
        : `${weekday}`;

    const handleDelete = () => {
        if (!onDeleteClick) return;
        if (window.confirm(`Are you sure you want to permanently delete the event "${event.name}"? This will clear all assignments.`)) {
            onDeleteClick(event.id);
        }
    };

    // Ready Status Calculations for Header
    const corpTasksList = event.corporateChecklistTasks || [];
    const totalCorpTasks = corpTasksList.length;
    const completedCorpTasks = (Object.values(event.corporateChecklistStatus || {}) as CorporateTaskStatus[]).filter(s => s.completed).length;
    const corpProgress = totalCorpTasks > 0 ? Math.round((completedCorpTasks / totalCorpTasks) * 100) : 100;

    return (
        <div id={isFirst ? 'guide-event-card' : undefined} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
            {canSchedule && (
                <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Preparedness Audit</span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-primary transition-all duration-700" style={{ width: `${corpProgress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter">Team Mission: {corpProgress}%</span>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center">
                        <div className="text-center w-16 mr-4 flex-shrink-0">
                            <div className="text-xs font-bold text-red-600 uppercase">{month}</div>
                            <div className="text-3xl font-black text-gray-800">{day}</div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 leading-tight">{event.name}</h3>
                            <p className="text-sm text-gray-600">
                                {dateDisplay} • {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    {canSchedule && (
                        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto sm:justify-end">
                            <button
                                id={isFirst ? 'guide-ai-assistant-btn' : undefined}
                                onClick={() => onAIAssistClick(event)}
                                className="flex-grow sm:flex-grow-0 text-[11px] px-2.5 py-1.5 bg-purple-100 text-purple-800 font-bold uppercase rounded-md hover:bg-purple-200 flex items-center justify-center gap-1 transition-colors"
                            >
                                ✨ AI Assist
                            </button>
                            <button
                                onClick={() => onNotifyClick(event)}
                                className="flex-grow sm:flex-grow-0 text-[11px] px-2.5 py-1.5 bg-blue-100 text-blue-800 font-bold uppercase rounded-md hover:bg-blue-200 transition-colors flex justify-center"
                            >
                                Page Team
                            </button>
                             <button
                                onClick={() => onEditClick(event)}
                                className="flex-grow sm:flex-grow-0 text-[11px] px-2.5 py-1.5 bg-gray-100 text-gray-700 font-bold uppercase rounded-md hover:bg-gray-200 transition-colors flex justify-center"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-grow sm:flex-grow-0 text-[11px] px-2.5 py-1.5 bg-red-50 text-red-600 font-bold uppercase rounded-md hover:bg-red-100 transition-colors flex justify-center"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {event.assignments.map(assignment => {
                        const role = roles.find(r => r.id === assignment.roleId);
                        if (!role) return null;
                        const status = assignment.status || 'pending';
                        
                        return (
                            <div key={role.id} className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
                                status === 'declined' ? 'bg-red-50 border-red-100 opacity-80' : 
                                status === 'accepted' ? 'bg-green-50/30 border-green-100' : 
                                'bg-gray-50 border-gray-100'
                            }`}>
                                <div>
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider truncate">{role.name}</p>
                                        {assignment.memberId && <StatusIndicator status={status} assignment={assignment} roles={roles} />}
                                    </div>
                                    <p className={`text-sm font-bold ${status === 'declined' ? 'text-red-700 line-through' : 'text-gray-800'}`}>
                                        {getMemberName(assignment.memberId)}
                                    </p>
                                </div>
                                {canSchedule && (
                                    <button
                                        onClick={() => onAssignClick(event, role)}
                                        className="mt-3 text-[10px] font-black uppercase text-brand-primary hover:text-brand-primary-dark tracking-widest text-right"
                                    >
                                        Manage &rarr;
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
