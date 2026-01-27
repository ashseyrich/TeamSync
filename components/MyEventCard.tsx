
import React, { useState } from 'react';
import type { ServiceEvent, Role, TeamMember, MemberDebrief, Briefing, Assignment, CorporateTaskStatus } from '../types.ts';
import { CheckInButton } from './CheckInButton.tsx';
import { AttireInspiration } from './AttireInspiration.tsx';
import { DebriefModal } from './DebriefModal.tsx';
import { ViewDebriefsModal } from './ViewDebriefsModal.tsx';
import { hasPermission } from '../utils/permissions.ts';
import { generateRoleBriefing } from '../services/geminiService.ts';
import { RoleBriefingDisplay } from './RoleBriefingDisplay.tsx';
import { downloadIcsFile } from '../utils/calendar.ts';
import { ReadyCheckModal } from './ReadyCheckModal.tsx';
import { ensureDate } from '../utils/performance.ts';

interface MyEventCardProps {
    event: ServiceEvent;
    roles: Role[];
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    onCheckIn: (eventId: string, location: { latitude: number; longitude: number; }, isUnverified?: boolean) => Promise<void>;
    onUpdateEvent: (event: ServiceEvent) => void;
    onUpdateAssignmentStatus: (eventId: string, roleId: string, status: 'accepted' | 'declined', reason?: string) => void;
}

export const MyEventCard: React.FC<MyEventCardProps> = ({ event, roles, currentUser, teamMembers, onCheckIn, onUpdateEvent, onUpdateAssignmentStatus }) => {
    const [isAttireOpen, setIsAttireOpen] = useState(false);
    const [isMyDebriefOpen, setIsMyDebriefOpen] = useState(false);
    const [isViewDebriefsOpen, setIsViewDebriefsOpen] = useState(false);
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [briefingError, setBriefingError] = useState<string | null>(null);
    const [isReadyCheckOpen, setIsReadyCheckOpen] = useState(false);

    const myAssignments = event.assignments.filter(a => a.memberId === currentUser.id || a.traineeId === currentUser.id);
    const myDebrief = event.debriefs?.find(d => d.memberId === currentUser.id);

    const eventDate = ensureDate(event.date);
    const day = eventDate.toLocaleString('en-US', { day: '2-digit' });
    const month = eventDate.toLocaleString('en-US', { month: 'short' });
    const weekday = eventDate.toLocaleString('en-US', { weekday: 'long' });
    
    const endDate = event.endDate ? ensureDate(event.endDate) : null;
    const endMonth = endDate ? endDate.toLocaleString('en-US', { month: 'short' }) : '';
    const endDay = endDate ? endDate.toLocaleString('en-US', { day: '2-digit' }) : '';
    
    const dateDisplay = endDate 
        ? `${month} ${day} - ${endMonth} ${endDay}`
        : `${weekday}`;

    const isPastEvent = ensureDate(event.endDate || event.date).getTime() < new Date().getTime();
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

    const handleToggleIndividualTask = (roleId: string, taskId: string, completed: boolean) => {
        const updatedAssignments = event.assignments.map(a => {
            if (a.roleId === roleId && (a.memberId === currentUser.id || a.traineeId === currentUser.id)) {
                const currentProgress = { ...(a.checklistProgress || {}) };
                if (completed) currentProgress[taskId] = true;
                else delete currentProgress[taskId];
                return { ...a, checklistProgress: currentProgress };
            }
            return a;
        });
        onUpdateEvent({ ...event, assignments: updatedAssignments });
    };

    const handleToggleCorporateTask = (taskId: string, completed: boolean) => {
        const currentCorporate = { ...(event.corporateChecklistStatus || {}) };
        if (completed) {
            currentCorporate[taskId] = { completed: true, memberId: currentUser.id, timestamp: new Date() };
        } else {
            currentCorporate[taskId] = { completed: false };
        }
        onUpdateEvent({ ...event, corporateChecklistStatus: currentCorporate });
    };

    const handleDecline = (roleId: string) => {
        const reason = window.prompt("For accountability, please provide a reason for declining this assignment:");
        if (reason === null) return; 
        if (!reason.trim()) {
            alert("A reason is required to decline an assignment.");
            return;
        }
        onUpdateAssignmentStatus(event.id, roleId, 'declined', reason.trim());
    };

    const isCheckedIn = (currentUser.checkIns || []).some(ci => ci.eventId === event.id);

    // Calculate collective progress across ALL roles assigned to the user
    let totalCompleted = 0;
    let totalTasks = 0;

    myAssignments.forEach(a => {
        const tasks = a.checklistTasks || [];
        totalTasks += tasks.length;
        totalCompleted += Object.values(a.checklistProgress || {}).filter(Boolean).length;
    });
    
    const corpTasks = event.corporateChecklistTasks || [];
    totalTasks += corpTasks.length;
    totalCompleted += (Object.values(event.corporateChecklistStatus || {}) as CorporateTaskStatus[]).filter(s => s.completed).length;

    const progressPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const isFullyReady = totalTasks > 0 && totalCompleted === totalTasks;

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
                            <p className="text-xs text-gray-500">Call Time: {ensureDate(event.callTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        {!isPastEvent && (
                            <div className="flex flex-col gap-2 w-full sm:w-auto">
                                <CheckInButton event={event} currentUser={currentUser} onCheckIn={onCheckIn} />
                                
                                {isCheckedIn ? (
                                    <button 
                                        onClick={() => setIsReadyCheckOpen(true)}
                                        className={`w-full sm:w-auto px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${isFullyReady ? 'bg-green-600' : 'bg-brand-secondary hover:bg-brand-secondary-dark ring-2 ring-brand-secondary ring-offset-2 animate-pulse-soft'}`}
                                    >
                                        {isFullyReady ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Mission Ready
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Perform Ready Check
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="group relative w-full sm:w-auto">
                                        <button 
                                            disabled
                                            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Checklist Locked
                                        </button>
                                        <p className="text-[9px] text-gray-400 mt-1 text-right font-bold uppercase italic">Check in to unlock readiness</p>
                                    </div>
                                )}
                            </div>
                        )}
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
                        {isPastEvent && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                {canSchedule ? (
                                    <button onClick={() => setIsViewDebriefsOpen(true)} className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-semibold rounded-md hover:bg-teal-200 flex-grow sm:flex-grow-0">View Debriefs ({event.debriefs?.length || 0})</button>
                                ) : (
                                    <button onClick={() => setIsMyDebriefOpen(true)} className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-semibold rounded-md hover:bg-teal-200 flex-grow sm:flex-grow-0">{myDebrief ? "View My Debrief" : "Add My Debrief"}</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Checklist Progress Visualization */}
                {!isPastEvent && totalTasks > 0 && (
                    <div className={`mt-4 p-3 rounded-lg border flex items-center justify-between transition-colors ${isCheckedIn ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                        <div className="flex items-center gap-3">
                            <div className={isCheckedIn ? "text-blue-600" : "text-gray-400"}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isCheckedIn ? 'text-blue-800' : 'text-gray-500'}`}>
                                    Ready Check Status
                                </span>
                                <span className="text-xs font-bold text-gray-700">
                                    {totalCompleted} of {totalTasks} tasks verified
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden border">
                                <div 
                                    className={`h-full transition-all duration-500 ${isCheckedIn ? (isFullyReady ? 'bg-green-600' : 'bg-blue-600') : 'bg-gray-400'}`} 
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-black text-gray-400 uppercase">{progressPercent}% Prep Done</span>
                        </div>
                    </div>
                )}

                <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold text-gray-700">My Roles & Briefings</h4>
                     <div className="mt-2 space-y-4">
                        {myAssignments.map(assignment => {
                            const role = roles.find(r => r.id === assignment.roleId);
                            const isTrainee = assignment.traineeId === currentUser.id;
                            const status = assignment.status || 'pending';

                            return (
                                <div key={assignment.roleId} className={`p-3 rounded-md border transition-colors ${
                                    status === 'accepted' ? 'bg-green-50 border-green-200' : 
                                    status === 'declined' ? 'bg-red-50 border-red-200 opacity-70' : 
                                    'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-gray-800">
                                                {role?.name} {isTrainee && <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full ml-1">TRAINEE</span>}
                                                {status === 'accepted' && <span className="ml-2 text-[10px] text-green-600 font-black uppercase tracking-widest bg-white px-1.5 py-0.5 rounded border border-green-200">Accepted</span>}
                                            </p>
                                        </div>
                                        
                                        {!isPastEvent && status === 'pending' && (
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button onClick={() => onUpdateAssignmentStatus(event.id, assignment.roleId, 'accepted')} className="flex-1 sm:flex-none px-4 py-1.5 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-md hover:bg-green-700 shadow-sm">Accept</button>
                                                <button onClick={() => handleDecline(assignment.roleId)} className="flex-1 sm:flex-none px-4 py-1.5 bg-white text-red-600 border border-red-200 text-xs font-black uppercase tracking-widest rounded-md hover:bg-red-50">Decline</button>
                                            </div>
                                        )}

                                        {!isPastEvent && status === 'accepted' && !assignment.briefing && (
                                            <button onClick={() => handleGenerateBriefing(assignment.roleId)} disabled={isBriefingLoading} className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-md hover:bg-purple-200 flex items-center gap-1 disabled:opacity-50">{isBriefingLoading ? 'Generating...' : '✨ Get Briefing'}</button>
                                        )}
                                    </div>
                                    {assignment.briefing && status === 'accepted' && <RoleBriefingDisplay briefing={assignment.briefing} />}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {event.attire?.theme && (
                    <div className="mt-4 border-t pt-4">
                        <button onClick={() => setIsAttireOpen(!isAttireOpen)} className="w-full flex justify-between items-center text-left group">
                           <div className="flex items-center gap-3">
                                <div className="flex -space-x-2 flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full border border-white shadow-sm ring-1 ring-gray-200" style={{ backgroundColor: event.attire.colors[0] }} />
                                    <div className="w-6 h-6 rounded-full border border-white shadow-sm ring-1 ring-gray-200" style={{ backgroundColor: event.attire.colors[1] }} />
                                </div>
                               <div className="flex-grow">
                                 <h4 className="font-semibold text-gray-700 group-hover:text-brand-primary transition-colors">Attire Guide</h4>
                                 <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{event.attire.theme}</p>
                               </div>
                           </div>
                           <svg className={`w-5 h-5 text-gray-400 transition-transform ${isAttireOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isAttireOpen && <div className="mt-4 animate-fade-in"><AttireInspiration event={event} onUpdateEvent={onUpdateEvent} canSchedule={canSchedule} /></div>}
                    </div>
                )}
            </div>

            <ReadyCheckModal 
                isOpen={isReadyCheckOpen}
                onClose={() => setIsReadyCheckOpen(false)}
                event={event}
                member={currentUser}
                roles={roles}
                allMembers={teamMembers}
                onToggleIndividualTask={handleToggleIndividualTask}
                onToggleCorporateTask={handleToggleCorporateTask}
            />

             {isMyDebriefOpen && <DebriefModal isOpen={isMyDebriefOpen} onClose={() => setIsMyDebriefOpen(false)} event={event} initialDebrief={myDebrief || null} onSave={handleSaveDebrief} />}
            {isViewDebriefsOpen && <ViewDebriefsModal isOpen={isViewDebriefsOpen} onClose={() => setIsViewDebriefsOpen(false)} event={event} teamMembers={teamMembers} />}
        </div>
    );
};
