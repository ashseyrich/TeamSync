
import React, { useState, useMemo } from 'react';
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
    initiallyExpanded?: boolean;
}

const StatusIndicator: React.FC<{ status: Assignment['status'], assignment: Assignment, roles: Role[] }> = ({ status, assignment, roles }) => {
    const role = roles.find(r => r.id === assignment.roleId);
    
    const activeTasks = assignment.checklistTasks || role?.defaultChecklist || [];
    const totalRoleTasks = activeTasks.length;
    const completedRoleTasks = activeTasks.filter(task => !!assignment.checklistProgress?.[task]).length;
    
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

export const EventCard: React.FC<EventCardProps> = ({ event, roles, teamMembers, onAssignClick, onEditClick, onNotifyClick, onAIAssistClick, onDeleteClick, canSchedule, isFirst = false, initiallyExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded || isFirst);
    
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

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onDeleteClick) return;
        if (window.confirm(`Are you sure you want to permanently delete the event "${event.name}"? This will clear all assignments.`)) {
            onDeleteClick(event.id);
        }
    };

    // Ready Status Calculations
    const corpTasksList = event.corporateChecklistTasks || [];
    const totalCorpTasks = corpTasksList.length;
    const completedCorpTasks = (Object.values(event.corporateChecklistStatus || {}) as CorporateTaskStatus[]).filter(s => s.completed).length;
    const corpProgress = totalCorpTasks > 0 ? Math.round((completedCorpTasks / totalCorpTasks) * 100) : 100;

    // Roster Summary Stats for Collapsed State
    const rosterStats = useMemo(() => {
        const total = event.assignments.length;
        const filled = event.assignments.filter(a => a.memberId).length;
        const ready = event.assignments.filter(a => {
            if (!a.memberId || a.status !== 'accepted') return false;
            const role = roles.find(r => r.id === a.roleId);
            const tasks = a.checklistTasks || role?.defaultChecklist || [];
            if (tasks.length === 0) return true;
            const done = Object.values(a.checklistProgress || {}).filter(Boolean).length;
            return done === tasks.length;
        }).length;
        return { total, filled, ready };
    }, [event.assignments, roles]);

    return (
        <div 
            id={isFirst ? 'guide-event-card' : undefined} 
            className={`bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all ${isExpanded ? 'ring-2 ring-brand-primary/20 shadow-lg' : 'hover:bg-gray-50 hover:shadow-lg'}`}
        >
            {/* Clickable Header Area */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="cursor-pointer"
            >
                {canSchedule && (
                    <div className={`px-4 py-1.5 border-b flex justify-between items-center transition-colors ${isExpanded ? 'bg-brand-primary/5' : 'bg-gray-50/50'}`}>
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Readiness Audit</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-primary transition-all duration-700" style={{ width: `${corpProgress}%` }}></div>
                                </div>
                                <span className="text-[9px] font-bold text-brand-primary uppercase tracking-tighter">Mission: {corpProgress}%</span>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDelete}
                                    className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                                >
                                    Purge Event
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center">
                        <div className="text-center w-12 mr-4 flex-shrink-0">
                            <div className="text-[10px] font-black text-red-600 uppercase leading-none">{month}</div>
                            <div className="text-2xl font-black text-gray-800 leading-tight">{day}</div>
                        </div>
                        <div>
                            <h3 className={`text-lg font-black leading-tight uppercase italic tracking-tight transition-colors ${isExpanded ? 'text-brand-primary' : 'text-gray-800'}`}>
                                {event.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {dateDisplay} • {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Collapsed Status Summary */}
                        {!isExpanded && (
                            <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <div className="flex flex-col items-end">
                                    <span className="text-gray-800">{rosterStats.total} Positions</span>
                                    <span>Total Log</span>
                                </div>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="flex flex-col items-end">
                                    <span className={rosterStats.filled === rosterStats.total ? 'text-green-600' : 'text-blue-600'}>{rosterStats.filled} Filled</span>
                                    <span>Scheduled</span>
                                </div>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="flex flex-col items-end">
                                    <span className={rosterStats.ready === rosterStats.total ? 'text-green-600' : 'text-orange-500'}>{rosterStats.ready} Ready</span>
                                    <span>Verified</span>
                                </div>
                            </div>
                        )}

                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-primary' : 'text-gray-400'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content Area */}
            {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-white animate-fade-in">
                    {canSchedule && (
                        <div className="flex items-center gap-1.5 flex-wrap w-full mb-6">
                            <button
                                id={isFirst ? 'guide-ai-assistant-btn' : undefined}
                                onClick={(e) => { e.stopPropagation(); onAIAssistClick(event); }}
                                className="flex-grow sm:flex-grow-0 text-[10px] px-3 py-2 bg-purple-100 text-purple-800 font-black uppercase rounded-lg hover:bg-purple-200 flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
                                AI Optimizer
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onNotifyClick(event); }}
                                className="flex-grow sm:flex-grow-0 text-[10px] px-3 py-2 bg-blue-100 text-blue-800 font-black uppercase rounded-lg hover:bg-blue-200 transition-colors flex justify-center tracking-widest"
                            >
                                Dispatch Alerts
                            </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); onEditClick(event); }}
                                className="flex-grow sm:flex-grow-0 text-[10px] px-3 py-2 bg-gray-100 text-gray-700 font-black uppercase rounded-lg hover:bg-gray-200 transition-colors flex justify-center tracking-widest"
                            >
                                Edit Unit
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {event.assignments.map(assignment => {
                            const role = roles.find(r => r.id === assignment.roleId);
                            if (!role) return null;
                            const status = assignment.status || 'pending';
                            
                            return (
                                <div key={role.id} className={`p-4 rounded-xl border-2 flex flex-col justify-between transition-all group ${
                                    status === 'declined' ? 'bg-red-50 border-red-100 opacity-60' : 
                                    status === 'accepted' ? 'bg-green-50/30 border-green-100 hover:border-green-200' : 
                                    'bg-gray-50 border-gray-100 hover:border-gray-200 shadow-sm'
                                }`}>
                                    <div>
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest truncate">{role.name}</p>
                                            {assignment.memberId && <StatusIndicator status={status} assignment={assignment} roles={roles} />}
                                        </div>
                                        <p className={`text-sm font-black tracking-tight ${status === 'declined' ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                                            {getMemberName(assignment.memberId)}
                                        </p>
                                    </div>
                                    {canSchedule && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAssignClick(event, role); }}
                                            className="mt-4 text-[9px] font-black uppercase text-brand-primary hover:text-brand-primary-dark tracking-[0.2em] flex items-center justify-end gap-1 group-hover:gap-2 transition-all"
                                        >
                                            ROSTER 
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
