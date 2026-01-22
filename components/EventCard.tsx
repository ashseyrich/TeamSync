

import React from 'react';
import type { ServiceEvent, Role, TeamMember, Assignment } from '../types.ts';

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

const StatusIndicator: React.FC<{ status: Assignment['status'] }> = ({ status }) => {
    switch (status) {
        case 'accepted':
            return (
                <span className="flex items-center text-[10px] text-green-600 font-black uppercase tracking-tighter bg-green-50 px-1 rounded border border-green-100">
                    <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    OK
                </span>
            );
        case 'declined':
            return (
                <span className="flex items-center text-[10px] text-red-600 font-black uppercase tracking-tighter bg-red-50 px-1 rounded border border-red-100">
                    <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    Declined
                </span>
            );
        default:
            return (
                <span className="flex items-center text-[10px] text-gray-400 font-black uppercase tracking-tighter bg-gray-50 px-1 rounded border border-gray-100">
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

    return (
        <div id={isFirst ? 'guide-event-card' : undefined} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
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
                            <p className="text-xs text-gray-500">Call Time: {new Date(event.callTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            {event.location && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                    {event.location.address}
                                </p>
                            )}
                        </div>
                    </div>
                    {canSchedule && (
                        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto sm:justify-end">
                            <button
                                id={isFirst ? 'guide-ai-assistant-btn' : undefined}
                                onClick={() => onAIAssistClick(event)}
                                className="flex-grow sm:flex-grow-0 text-[11px] px-2.5 py-1.5 bg-purple-100 text-purple-800 font-bold uppercase rounded-md hover:bg-purple-200 flex items-center justify-center gap-1 transition-colors"
                                title="AI scheduling assistant"
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
                
                {event.serviceNotes && (
                     <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-900 rounded-r-md">
                        <span className="font-bold">Team Note:</span> {event.serviceNotes}
                    </div>
                )}
                
                {event.resources && event.resources.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {event.resources.map(res => (
                            <a 
                                key={res.id} 
                                href={res.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-[10px] font-bold uppercase hover:bg-gray-100 border border-gray-200 transition-colors"
                            >
                                <span className="mr-1 text-sm">
                                    {res.type === 'link' && '🔗'}
                                    {res.type === 'document' && '📄'}
                                    {res.type === 'music' && '🎵'}
                                    {res.type === 'video' && '📹'}
                                </span>
                                {res.title}
                            </a>
                        ))}
                    </div>
                )}

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {event.assignments.map(assignment => {
                        const role = roles.find(r => r.id === assignment.roleId);
                        if (!role) return null;
                        const status = assignment.status || 'pending';
                        
                        return (
                            <div key={role.id} className={`p-3 rounded-lg border flex flex-col justify-between ${
                                status === 'declined' ? 'bg-red-50 border-red-100 opacity-80' : 
                                status === 'accepted' ? 'bg-green-50/30 border-green-100' : 
                                'bg-gray-50 border-gray-100'
                            }`}>
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{role.name}</p>
                                        {assignment.memberId && <StatusIndicator status={status} />}
                                    </div>
                                    <p className={`text-sm font-bold ${status === 'declined' ? 'text-red-700 line-through' : 'text-gray-800'}`}>
                                        {getMemberName(assignment.memberId)}
                                    </p>
                                    {status === 'declined' && assignment.declineReason && (
                                        <p className="text-[10px] text-red-600 mt-1 italic leading-tight">"{assignment.declineReason}"</p>
                                    )}
                                    {assignment.traineeId && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-1 rounded">Trainee</span>
                                            <span className="text-[11px] font-medium text-gray-600">{getMemberName(assignment.traineeId)}</span>
                                        </div>
                                    )}
                                </div>
                                {canSchedule && (
                                    <button
                                        onClick={() => onAssignClick(event, role)}
                                        className="mt-3 text-[10px] font-black uppercase text-brand-primary hover:text-brand-primary-dark tracking-widest text-right"
                                    >
                                        Edit Assignment &rarr;
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
