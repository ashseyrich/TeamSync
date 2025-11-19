
import React from 'react';
import type { ServiceEvent, Role, TeamMember } from '../types.ts';

interface EventCardProps {
    event: ServiceEvent;
    roles: Role[];
    teamMembers: TeamMember[];
    onAssignClick: (event: ServiceEvent, role: Role) => void;
    onEditClick: (event: ServiceEvent) => void;
    onNotifyClick: (event: ServiceEvent) => void;
    onAIAssistClick: (event: ServiceEvent) => void;
    canSchedule: boolean;
    isFirst?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, roles, teamMembers, onAssignClick, onEditClick, onNotifyClick, onAIAssistClick, canSchedule, isFirst = false }) => {
    
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

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <div className="text-center w-16 mr-4">
                            <div className="text-xs font-bold text-red-600 uppercase">{month}</div>
                            <div className="text-3xl font-bold text-gray-800">{day}</div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
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
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            <button
                                id={isFirst ? 'guide-ai-assistant-btn' : undefined}
                                onClick={() => onAIAssistClick(event)}
                                className="text-sm px-3 py-1 bg-purple-100 text-purple-800 font-semibold rounded-md hover:bg-purple-200 flex items-center gap-1"
                                title="Use AI to suggest a schedule for this event"
                            >
                                ✨ AI Assistant
                            </button>
                            <button
                                onClick={() => onNotifyClick(event)}
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-800 font-semibold rounded-md hover:bg-blue-200"
                                title="Send a notification to all assigned members for this event"
                            >
                                Notify Team
                            </button>
                             <button
                                onClick={() => onEditClick(event)}
                                className="text-sm px-3 py-1 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>
                
                {event.serviceNotes && (
                     <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-300 text-sm text-yellow-900">
                        <span className="font-semibold">Note:</span> {event.serviceNotes}
                    </div>
                )}
                
                {event.resources && event.resources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {event.resources.map(res => (
                            <a 
                                key={res.id} 
                                href={res.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 border border-gray-300 transition-colors"
                            >
                                <span className="mr-1">
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

                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {event.assignments.map(assignment => {
                        const role = roles.find(r => r.id === assignment.roleId);
                        if (!role) return null;
                        
                        return (
                            <div key={role.id} className="p-3 bg-gray-50 rounded-md">
                                <p className="text-sm font-bold text-gray-700">{role.name}</p>
                                <p className="text-sm text-gray-900">{getMemberName(assignment.memberId)}</p>
                                {assignment.traineeId && (
                                    <p className="text-xs text-blue-600">Trainee: {getMemberName(assignment.traineeId)}</p>
                                )}
                                {canSchedule && (
                                    <button
                                        onClick={() => onAssignClick(event, role)}
                                        className="mt-2 text-xs text-blue-600 hover:underline"
                                    >
                                        Assign
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
