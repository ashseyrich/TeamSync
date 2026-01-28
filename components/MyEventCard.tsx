
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
    onToggleIndividualTask: (roleId: string, taskId: string, completed: boolean) => void;
    onToggleCorporateTask: (taskId: string, completed: boolean) => void;
}

export const MyEventCard: React.FC<MyEventCardProps> = ({ 
    event, roles, currentUser, teamMembers, onCheckIn, onUpdateEvent, onUpdateAssignmentStatus, onToggleIndividualTask, onToggleCorporateTask 
}) => {
    const [isAttireOpen, setIsAttireOpen] = useState(false);
    const [isMyDebriefOpen, setIsMyDebriefOpen] = useState(false);
    const [isViewDebriefsOpen, setIsViewDebriefsOpen] = useState(false);
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [isReadyCheckOpen, setIsReadyCheckOpen] = useState(false);

    const myAssignments = event.assignments.filter(a => a.memberId === currentUser.id || a.traineeId === currentUser.id);
    const myDebrief = event.debriefs?.find(d => d.memberId === currentUser.id);

    const eventDate = ensureDate(event.date);
    const day = eventDate.toLocaleString('en-US', { day: '2-digit' });
    const month = eventDate.toLocaleString('en-US', { month: 'short' });
    const weekday = eventDate.toLocaleString('en-US', { weekday: 'long' });
    
    const endDate = event.endDate ? ensureDate(event.endDate) : null;
    const isPastEvent = ensureDate(event.endDate || event.date).getTime() < new Date().getTime();
    const canSchedule = hasPermission(currentUser, 'scheduler');

    const handleSaveDebrief = (debriefData: Omit<MemberDebrief, 'memberId'>) => {
        const newDebrief: MemberDebrief = { ...debriefData, memberId: currentUser.id };
        const otherDebriefs = event.debriefs?.filter(d => d.memberId !== currentUser.id) || [];
        onUpdateEvent({ ...event, debriefs: [...otherDebriefs, newDebrief] });
        setIsMyDebriefOpen(false);
    };

    const handleGenerateBriefing = async (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        setIsBriefingLoading(true);
        try {
            const briefing = await generateRoleBriefing(event, role);
            const updatedAssignments = event.assignments.map(a => 
                a.roleId === roleId ? { ...a, briefing } : a
            );
            onUpdateEvent({ ...event, assignments: updatedAssignments });
        } catch (err) {
            console.error(err);
        } finally {
            setIsBriefingLoading(false);
        }
    };

    const handleDecline = (roleId: string) => {
        const reason = window.prompt("Accountability check: Why are you declining this position?");
        if (reason === null) return; 
        if (!reason.trim()) {
            alert("Reason required for roster integrity.");
            return;
        }
        onUpdateAssignmentStatus(event.id, roleId, 'declined', reason.trim());
    };

    const isCheckedIn = (currentUser.checkIns || []).some(ci => ci.eventId === event.id);

    // Calculate collective progress
    let totalCompleted = 0;
    let totalTasks = 0;

    myAssignments.forEach(a => {
        totalTasks += (a.checklistTasks || []).length;
        totalCompleted += Object.values(a.checklistProgress || {}).filter(Boolean).length;
    });
    totalTasks += (event.corporateChecklistTasks || []).length;
    totalCompleted += (Object.values(event.corporateChecklistStatus || {}) as CorporateTaskStatus[]).filter(s => s.completed).length;

    const progressPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const isFullyReady = totalTasks > 0 && totalCompleted === totalTasks;

    return (
        <div className={`bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 transition-all ${isPastEvent ? 'opacity-80' : 'hover:shadow-2xl'}`}>
            <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="flex items-center flex-grow">
                        <div className="text-center w-20 mr-6 flex-shrink-0">
                            <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">{month}</div>
                            <div className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{day}</div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 break-words leading-tight uppercase italic">{event.name}</h3>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-tight mt-2">{weekday} • {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-xs text-brand-primary font-black uppercase tracking-[0.15em] mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
                                CALL TIME: {ensureDate(event.callTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                        {!isPastEvent && (
                            <div className="flex flex-col gap-3 w-full sm:w-auto">
                                <CheckInButton event={event} currentUser={currentUser} onCheckIn={onCheckIn} />
                                
                                {isCheckedIn && (
                                    <button 
                                        onClick={() => setIsReadyCheckOpen(true)}
                                        className={`w-full sm:w-auto px-6 py-3 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${isFullyReady ? 'bg-green-600' : 'bg-brand-secondary hover:bg-brand-secondary-dark ring-4 ring-brand-secondary/20'}`}
                                    >
                                        {isFullyReady ? '✓ MISSION READY' : 'Perform Ready Check'}
                                    </button>
                                )}
                            </div>
                        )}
                        {isPastEvent && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                {canSchedule ? (
                                    <button onClick={() => setIsViewDebriefsOpen(true)} className="px-6 py-3 bg-teal-100 text-teal-800 text-[10px] font-black uppercase rounded-2xl hover:bg-teal-200 transition-colors tracking-widest">Audit Debriefs ({event.debriefs?.length || 0})</button>
                                ) : (
                                    <button onClick={() => setIsMyDebriefOpen(true)} className="px-6 py-3 bg-teal-100 text-teal-800 text-[10px] font-black uppercase rounded-2xl hover:bg-teal-200 transition-colors tracking-widest">{myDebrief ? "Update Debrief" : "Submit Debrief"}</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {!isPastEvent && totalTasks > 0 && (
                    <div className={`mt-8 p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${isCheckedIn ? 'bg-brand-light border-brand-primary/20' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                        <div className="flex items-center gap-4">
                            <div className={isCheckedIn ? "text-brand-primary" : "text-gray-400"}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isCheckedIn ? 'text-brand-primary' : 'text-gray-500'}`}>Readiness Meter</span>
                                <span className="text-sm font-bold text-gray-700">{totalCompleted} of {totalTasks} verified</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300/10">
                                <div className={`h-full transition-all duration-1000 ${isCheckedIn ? (isFullyReady ? 'bg-green-600' : 'bg-brand-primary') : 'bg-gray-400'}`} style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{progressPercent}% SYNCED</span>
                        </div>
                    </div>
                )}

                <div className="mt-8 border-t border-gray-100 pt-8">
                    <h4 className="font-black text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-6 flex items-center gap-2">
                        <span className="w-4 h-[1px] bg-gray-300"></span>
                        Assignment Management
                        <span className="w-4 h-[1px] bg-gray-300"></span>
                    </h4>
                     <div className="space-y-6">
                        {myAssignments.map(assignment => {
                            const role = roles.find(r => r.id === assignment.roleId);
                            const isTrainee = assignment.traineeId === currentUser.id;
                            const status = assignment.status || 'pending';

                            return (
                                <div key={assignment.roleId} className={`p-6 rounded-3xl border-2 transition-all shadow-sm ${
                                    status === 'accepted' ? 'bg-green-50/40 border-green-200/50' : 
                                    status === 'declined' ? 'bg-red-50/40 border-red-200/50 grayscale' : 
                                    'bg-brand-primary/5 border-brand-primary/20 ring-8 ring-brand-primary/5 animate-pulse-soft'
                                }`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                                        <div className="min-w-0">
                                            <p className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                                {role?.name} 
                                                {isTrainee && <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 uppercase tracking-widest">Skill Growing</span>}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                                                ROSTER STATUS: <span className={status === 'accepted' ? 'text-green-600' : status === 'declined' ? 'text-red-600' : 'text-brand-primary'}>{status.toUpperCase()}</span>
                                            </p>
                                        </div>
                                        
                                        {!isPastEvent && (status === 'pending') && (
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button 
                                                    onClick={() => onUpdateAssignmentStatus(event.id, assignment.roleId, 'accepted')} 
                                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-green-700 shadow-xl transition-all transform active:scale-95"
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleDecline(assignment.roleId)} 
                                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-white text-red-600 border-2 border-red-100 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-all"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}

                                        {!isPastEvent && status === 'accepted' && !assignment.briefing && (
                                            <button onClick={() => handleGenerateBriefing(assignment.roleId)} disabled={isBriefingLoading} className="w-full sm:w-auto px-6 py-2.5 bg-purple-100 text-purple-800 text-[10px] font-black uppercase rounded-2xl hover:bg-purple-200 flex items-center justify-center gap-2 border border-purple-200/50 tracking-widest transition-all">
                                                {isBriefingLoading ? 'Simulating...' : '✨ Get AI Briefing'}
                                            </button>
                                        )}
                                    </div>
                                    {assignment.briefing && status === 'accepted' && <RoleBriefingDisplay briefing={assignment.briefing} />}
                                    {status === 'declined' && assignment.declineReason && (
                                        <p className="mt-3 text-xs text-red-700 italic border-l-2 border-red-200 pl-3 py-1">Decline reason: {assignment.declineReason}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {event.attire?.theme && (
                    <div className="mt-8 border-t border-gray-100 pt-8">
                        <button onClick={() => setIsAttireOpen(!isAttireOpen)} className="w-full flex justify-between items-center text-left group bg-gray-50/50 p-5 rounded-3xl border border-gray-100 hover:border-brand-primary/30 transition-all">
                           <div className="flex items-center gap-5">
                                <div className="flex -space-x-3 flex-shrink-0">
                                    <div className="w-9 h-9 rounded-full border-2 border-white shadow-md ring-1 ring-gray-100" style={{ backgroundColor: event.attire.colors[0] }} />
                                    <div className="w-9 h-9 rounded-full border-2 border-white shadow-md ring-1 ring-gray-100" style={{ backgroundColor: event.attire.colors[1] }} />
                                </div>
                               <div className="min-w-0">
                                 <h4 className="font-black text-gray-900 text-sm group-hover:text-brand-primary transition-colors uppercase italic tracking-tight">Presentation Standards</h4>
                                 <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">{event.attire.theme}</p>
                               </div>
                           </div>
                           <svg className={`w-5 h-5 text-gray-400 transition-transform ${isAttireOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isAttireOpen && <div className="mt-6 animate-fade-in"><AttireInspiration event={event} onUpdateEvent={onUpdateEvent} canSchedule={canSchedule} /></div>}
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
                onToggleIndividualTask={onToggleIndividualTask}
                onToggleCorporateTask={onToggleCorporateTask}
            />

             {isMyDebriefOpen && <DebriefModal isOpen={isMyDebriefOpen} onClose={() => setIsMyDebriefOpen(false)} event={event} initialDebrief={myDebrief || null} onSave={handleSaveDebrief} />}
            {isViewDebriefsOpen && <ViewDebriefsModal isOpen={isViewDebriefsOpen} onClose={() => setIsViewDebriefsOpen(false)} event={event} teamMembers={teamMembers} />}
        </div>
    );
};
