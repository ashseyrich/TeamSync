
import React from 'react';
import type { ServiceEvent, Role, TeamMember, CorporateTaskStatus, Assignment } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface ReadyCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: ServiceEvent;
    member: TeamMember;
    roles: Role[];
    onToggleIndividualTask: (roleId: string, taskId: string, completed: boolean) => void;
    onToggleCorporateTask: (taskId: string, completed: boolean) => void;
    allMembers: TeamMember[];
}

export const ReadyCheckModal: React.FC<ReadyCheckModalProps> = ({ 
    isOpen, onClose, event, member, roles, onToggleIndividualTask, onToggleCorporateTask, allMembers 
}) => {
    if (!isOpen) return null;

    const myAssignments = (event.assignments || []).filter(a => a.memberId === member.id || a.traineeId === member.id);
    
    let totalTasks = 0;
    let completedTasks = 0;

    myAssignments.forEach(a => {
        const role = (roles || []).find(r => r.id === a.roleId);
        const tasks = a.checklistTasks || role?.defaultChecklist || [];
        tasks.forEach(task => {
            totalTasks++;
            if (a.checklistProgress && a.checklistProgress[task]) completedTasks++;
        });
    });

    const corpTasksList = event.corporateChecklistTasks || [];
    corpTasksList.forEach(task => {
        totalTasks++;
        if (event.corporateChecklistStatus?.[task]?.completed) {
            completedTasks++;
        }
    });

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center z-[100] p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] animate-fade-in-up">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center rounded-t-3xl sm:rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Ready Check</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{event.name}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-brand-primary">{progress}%</div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Logged</div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {myAssignments.length === 0 && corpTasksList.length === 0 && (
                        <div className="text-center py-10 text-gray-500 italic">No preparation tasks assigned.</div>
                    )}

                    {myAssignments.map(a => {
                        const role = (roles || []).find(r => r.id === a.roleId);
                        const tasks = a.checklistTasks || role?.defaultChecklist || [];
                        if (tasks.length === 0) return null;

                        return (
                            <section key={role?.id}>
                                <h3 className="text-[10px] font-black uppercase text-brand-secondary tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-secondary"></span>
                                    {role?.name} Readiness
                                </h3>
                                <div className="space-y-3">
                                    {tasks.map(task => {
                                        const isChecked = !!a.checklistProgress?.[task];
                                        return (
                                            <label key={task} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${isChecked ? 'border-brand-primary bg-green-50/50 shadow-inner' : 'border-gray-100 hover:border-gray-200'}`}>
                                                <div className="relative flex items-center h-7 w-7">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked} 
                                                        onChange={(e) => onToggleIndividualTask(a.roleId, task, e.target.checked)}
                                                        className="w-full h-full rounded-lg border-2 border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-colors"
                                                    />
                                                </div>
                                                <span className={`text-sm font-bold leading-tight flex-grow transition-colors ${isChecked ? 'text-brand-primary' : 'text-gray-700'}`}>
                                                    {task}
                                                </span>
                                                {isChecked && (
                                                    <svg className="w-5 h-5 text-brand-primary animate-fade-in" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}

                    {corpTasksList.length > 0 && (
                        <section>
                            <h3 className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                                Collective Mission
                            </h3>
                            <div className="space-y-3">
                                {corpTasksList.map((task) => {
                                    const status = event.corporateChecklistStatus?.[task];
                                    const isChecked = !!status?.completed;
                                    const processedBy = status?.memberId ? (allMembers || []).find(m => m.id === status.memberId) : null;
                                    
                                    return (
                                        <label key={task} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${isChecked ? 'border-brand-primary bg-blue-50/50 shadow-inner' : 'border-gray-100 hover:border-gray-200'}`}>
                                            <div className="flex items-center gap-4 flex-grow">
                                                <div className="relative flex items-center h-7 w-7">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked} 
                                                        onChange={(e) => onToggleCorporateTask(task, e.target.checked)}
                                                        className="w-full h-full rounded-lg border-2 border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-bold leading-tight transition-colors ${isChecked ? 'text-brand-primary' : 'text-gray-700'}`}>
                                                        {task}
                                                    </span>
                                                    {isChecked && processedBy && (
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-1">Cleared by {processedBy.name.split(' ')[0]}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {isChecked && processedBy && (
                                                <Avatar avatarUrl={processedBy.avatarUrl} name={processedBy.name} sizeClassName="w-8 h-8 ring-2 ring-white flex-shrink-0" />
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t sm:rounded-b-2xl">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-brand-primary-dark transition-all transform active:scale-[0.98] text-sm"
                    >
                        {progress === 100 ? '✓ Ready for Service' : 'Update Readiness Log'}
                    </button>
                    <p className="text-[9px] text-center text-gray-400 mt-4 uppercase font-black tracking-widest">Real-time Sync Active • Dashboard Updates Instantly</p>
                </div>
            </div>
        </div>
    );
};
