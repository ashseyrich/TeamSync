
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
        const role = roles.find(r => r.id === a.roleId);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] animate-fade-in-up">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Ready Check</h2>
                        <p className="text-sm font-medium text-gray-500">Event: {event.name}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-brand-primary">{progress}%</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prepared</div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    {myAssignments.map(a => {
                        const role = roles.find(r => r.id === a.roleId);
                        const tasks = a.checklistTasks || role?.defaultChecklist || [];
                        if (tasks.length === 0) return null;

                        return (
                            <section key={role?.id}>
                                <h3 className="text-xs font-black uppercase text-brand-secondary tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>
                                    {role?.name} Readiness
                                </h3>
                                <div className="space-y-3">
                                    {tasks.map(task => (
                                        <label key={task} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${a.checklistProgress?.[task] ? 'border-brand-primary bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                            <div className="relative flex items-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!a.checklistProgress?.[task]} 
                                                    onChange={(e) => onToggleIndividualTask(a.roleId, task, e.target.checked)}
                                                    className="w-6 h-6 rounded-md border-2 border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                />
                                            </div>
                                            <span className={`text-sm font-bold ${a.checklistProgress?.[task] ? 'text-brand-primary' : 'text-gray-700'}`}>
                                                {task}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {corpTasksList.length > 0 && (
                        <section>
                            <h3 className="text-xs font-black uppercase text-brand-primary tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                Collective Mission
                            </h3>
                            <div className="space-y-3">
                                {corpTasksList.map((task) => {
                                    const status = event.corporateChecklistStatus?.[task];
                                    const processedBy = status?.memberId ? allMembers.find(m => m.id === status.memberId) : null;
                                    
                                    return (
                                        <label key={task} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${status?.completed ? 'border-brand-primary bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!status?.completed} 
                                                    onChange={(e) => onToggleCorporateTask(task, e.target.checked)}
                                                    className="w-6 h-6 rounded-md border-2 border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                />
                                                <div>
                                                    <span className={`text-sm font-bold ${status?.completed ? 'text-brand-primary' : 'text-gray-700'}`}>
                                                        {task}
                                                    </span>
                                                    {status?.completed && processedBy && (
                                                        <p className="text-[10px] text-gray-500 font-medium">Checked by {processedBy.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {status?.completed && processedBy && (
                                                <Avatar avatarUrl={processedBy.avatarUrl} name={processedBy.name} sizeClassName="w-6 h-6" />
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t rounded-b-2xl">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-brand-primary-dark transition-all transform active:scale-[0.98]"
                    >
                        {progress === 100 ? 'Mission Ready' : 'Save Progress'}
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-4 uppercase font-bold tracking-tighter">Your readiness is visible to leadership and team members.</p>
                </div>
            </div>
        </div>
    );
};
