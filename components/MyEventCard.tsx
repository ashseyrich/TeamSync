
import React, { useState } from 'react';
import type { ServiceEvent, Role, TeamMember, MemberDebrief, Briefing } from '../types.ts';
import { CheckInButton } from './CheckInButton.tsx';
import { AttireInspiration } from './AttireInspiration.tsx';
import { DebriefModal } from './DebriefModal.tsx';
import { ViewDebriefsModal } from './ViewDebriefsModal.tsx';
import { hasPermission } from '../utils/permissions.ts';
import { generateRoleBriefing } from '../services/geminiService.ts';
import { RoleBriefingDisplay } from './RoleBriefingDisplay.tsx';
import { downloadIcsFile } from '../utils/calendar.ts';

interface MyEventCardProps {
    event: ServiceEvent;
    roles: Role[];
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    onCheckIn: (eventId: string, location: { latitude: number; longitude: number; }) => Promise<void>;
    onUpdateEvent: (event: ServiceEvent) => void;
}

export const MyEventCard: React.FC<MyEventCardProps> = ({ event, roles, currentUser, teamMembers, onCheckIn, onUpdateEvent }) => {
    const [isAttireOpen, setIsAttireOpen] = useState(false);
    const [isMyDebriefOpen, setIsMyDebriefOpen] = useState(false);
    const [isViewDebriefsOpen, setIsViewDebriefsOpen] = useState(false);
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [briefingError, setBriefingError] = useState<string | null>(null);

    const myAssignments = event.assignments.filter(a => a.memberId === currentUser.id || a.traineeId === currentUser.id);
    const myDebrief = event.debriefs?.find(d => d.memberId === currentUser.id);

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

    const isPastEvent = (event.endDate || event.date).getTime() < new Date().getTime();
    const canSchedule = hasPermission(currentUser, 'scheduler');

    const handleSaveDebrief = (debriefData: Omit<MemberDebrief, 'memberId'>) => {
        const newDebrief: MemberDebrief = { ...debriefData, memberId: currentUser.id };
        const otherDebriefs = event.debriefs?.filter(d => d.memberId !== currentUser.id) || [];
        const updatedEvent = { 
            ...event, 
            debriefs: [...otherDebriefs, newDebrief] 
        };
        onUpdateEvent(updatedEvent);
        setIsMyDebriefOpen(false);
    }

    const handleGenerateBriefing = async (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;

        setIsBriefingLoading(true);
        setBriefingError(null);
        try {
            const briefing = await generateRoleBriefing(event, role);
            const updatedAssignments = event.assignments.map(a => 
                a.roleId === roleId ? { ...a, briefing } : a
            );
            onUpdateEvent({ ...event, assignments: updatedAssignments });
        } catch (err) {
            setBriefingError(err instanceof Error ? err.message : "Failed to generate briefing.");
        } finally {
            setIsBriefingLoading(false);
        }
    };

    const renderDebriefButton = () => {
        if (!isPastEvent) return null;

        if (canSchedule) {
            const debriefCount = event.debriefs?.length || 0;
            return (
                <button
                    onClick={() => setIsViewDebriefsOpen(true)}
                    className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-semibold rounded-md hover:bg-teal-200 w-full sm:w-auto"
                >
                    View Debriefs ({debriefCount})
                </button>
            )
        }

        return (
            <button
                onClick={() => setIsMyDebriefOpen(true)}
                className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-semibold rounded-md hover:bg-teal-200 w-full sm:w-auto"
            >
                {myDebrief ? "View My Debrief" : "Add My Debrief"}
            </button>
        )
    }

    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${isPastEvent ? 'opacity-80' : ''}`}>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center flex-grow">
                        <div className="text-center w-16 mr-4 flex-shrink-0">
                            <div className="text-xs font-bold text-red-600 uppercase">{month}</div>
                            <div className="text-3xl font-bold text-gray-800">{day}</div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 break-words">{event.name}</h3>
                            <p className="text-sm text-gray-600">{dateDisplay} • {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-xs text-gray-500">Call Time: {new Date(event.callTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            {event.location && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                    <span className="truncate">{event.location.address}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        {!isPastEvent && <CheckInButton event={event} currentUser={currentUser} onCheckIn={onCheckIn} />}
                         {!isPastEvent && (
                            <button
                                onClick={() => downloadIcsFile(event)}
                                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                title="Add to my calendar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Add to Calendar
                            </button>
                        )}
                        {renderDebriefButton()}
                    </div>
                </div>
                
                {event.serviceNotes && (
                     <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-300 rounded-r-md text-sm text-yellow-900">
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
                                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 border border-blue-200 transition-colors"
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

                <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold text-gray-700">My Roles & Briefings</h4>
                     <div className="mt-2 space-y-4">
                        {myAssignments.map(assignment => {
                            const role = roles.find(r => r.id === assignment.roleId);
                            const isTrainee = assignment.traineeId === currentUser.id;
                            return (
                                <div key={assignment.roleId} className="p-3 bg-gray-50 rounded-md border">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold text-gray-800">
                                            {role?.name} {isTrainee && <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">TRAINEE</span>}
                                        </p>
                                        {!isPastEvent && !assignment.briefing && (
                                            <button 
                                                onClick={() => handleGenerateBriefing(assignment.roleId)}
                                                disabled={isBriefingLoading}
                                                className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-md hover:bg-purple-200 flex items-center gap-1 disabled:opacity-50"
                                            >
                                               {isBriefingLoading ? 'Generating...' : '✨ Get Briefing'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {briefingError && <p className="text-xs text-red-500 mt-2">{briefingError}</p>}

                                    {assignment.briefing && <RoleBriefingDisplay briefing={assignment.briefing} />}

                                </div>
                            )
                        })}
                    </div>
                </div>

                {event.attire?.theme && (
                    <div className="mt-4 border-t pt-4">
                        <button onClick={() => setIsAttireOpen(!isAttireOpen)} className="w-full flex justify-between items-center text-left">
                           <div className="flex items-center gap-3">
                                <div className="flex -space-x-2 flex-shrink-0">
                                    <div 
                                        className="w-6 h-6 rounded-full border border-gray-300" 
                                        style={{ backgroundColor: event.attire.colors[0] }}
                                    />
                                    <div 
                                        className="w-6 h-6 rounded-full border border-gray-300" 
                                        style={{ backgroundColor: event.attire.colors[1] }}
                                    />
                                </div>
                               <div className="flex-grow">
                                 <h4 className="font-semibold text-gray-700">Attire</h4>
                                 <p className="text-sm text-gray-600">{event.attire.theme}: <span className="italic">{event.attire.description}</span></p>
                               </div>
                           </div>
                           <svg className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${isAttireOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                        </button>
                        {isAttireOpen && (
                            <div className="mt-4">
                                <AttireInspiration event={event} onUpdateEvent={onUpdateEvent} canSchedule={canSchedule} />
                            </div>
                        )}
                    </div>
                )}
            </div>
             {isMyDebriefOpen && (
                <DebriefModal
                    isOpen={isMyDebriefOpen}
                    onClose={() => setIsMyDebriefOpen(false)}
                    event={event}
                    initialDebrief={myDebrief || null}
                    onSave={handleSaveDebrief}
                />
            )}
            {isViewDebriefsOpen && (
                <ViewDebriefsModal
                    isOpen={isViewDebriefsOpen}
                    onClose={() => setIsViewDebriefsOpen(false)}
                    event={event}
                    teamMembers={teamMembers}
                />
            )}
        </div>
    );
};
