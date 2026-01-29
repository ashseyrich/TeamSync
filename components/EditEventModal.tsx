
import React, { useState, useEffect, useMemo } from 'react';
import type { ServiceEvent, Role, SavedAttireTheme, Attire, Assignment } from '../types.ts';
import { geocodeAddress } from '../utils/location.ts';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ServiceEvent | null;
  allRoles: Role[];
  onSave: (event: ServiceEvent) => void;
  onDelete?: (eventId: string) => void;
  savedLocations: string[];
  savedAttireThemes: SavedAttireTheme[];
  showAttire?: boolean;
  teamCorporateChecklist?: string[];
}

const DEFAULT_CHURCH_ADDRESS = "816 E Whitney St, Houston, TX";

const toInputDateString = (date: Date): string => {
    try {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (e) { return ''; }
};

const toInputTimeString = (date: Date): string => {
    try {
        const d = new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch (e) { return '00:00'; }
};

const getInitialEventState = (allRoles: Role[] = [], teamChecklist: string[] = []): ServiceEvent => {
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
    nextSunday.setHours(10, 0, 0, 0);
    const callTime = new Date(nextSunday);
    callTime.setHours(8, 30, 0, 0);

    return {
        id: '',
        name: 'Sunday Worship Service',
        date: nextSunday,
        callTime: callTime,
        assignments: (allRoles || []).map(r => ({ 
            roleId: r.id, 
            memberId: null, 
            traineeId: null, 
            status: 'pending',
            checklistTasks: [...(r.defaultChecklist || [])] 
        })),
        attire: { theme: 'All Black', description: 'Technical attire.', colors: ['#000000', '#000000'] },
        location: { address: DEFAULT_CHURCH_ADDRESS },
        resources: [],
        serviceNotes: '',
        corporateChecklistTasks: [...(teamChecklist || [])],
        corporateChecklistStatus: {}
    };
};

export const EditEventModal: React.FC<EditEventModalProps> = ({ 
    isOpen, onClose, event, allRoles = [], onSave, onDelete, savedLocations, savedAttireThemes, showAttire = true, teamCorporateChecklist = [] 
}) => {
    const [eventData, setEventData] = useState<ServiceEvent>(() => getInitialEventState(allRoles, teamCorporateChecklist));
    const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [newCorpTask, setNewCorpTask] = useState('');
    
    const rolesByDepartment = useMemo(() => {
        const grouped: Record<string, Role[]> = {};
        if (!allRoles) return grouped;
        allRoles.forEach(role => {
            const deptId = role.departmentId || 'General';
            if (!grouped[deptId]) grouped[deptId] = [];
            grouped[deptId].push(role);
        });
        return grouped;
    }, [allRoles]);

    useEffect(() => {
        if (isOpen) {
            if (event) {
                setEventData({
                    ...event,
                    date: new Date(event.date),
                    callTime: new Date(event.callTime),
                    attire: event.attire || { theme: 'All Black', description: '', colors: ['#000000', '#000000'] },
                    corporateChecklistTasks: event.corporateChecklistTasks || []
                });
                setSelectedRoleIds(new Set(event.assignments.map(a => a.roleId)));
            } else {
                setEventData(getInitialEventState(allRoles, teamCorporateChecklist));
                setSelectedRoleIds(new Set((allRoles || []).map(r => r.id)));
            }
        }
    }, [event, allRoles, isOpen, teamCorporateChecklist]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'address') {
             setEventData(prev => ({ ...prev, location: { address: value } }));
        } else if (name.startsWith('attire_')) {
            const field = name.replace('attire_', '');
            setEventData(prev => ({
                ...prev,
                attire: { ...prev.attire!, [field]: value }
            }));
        } else if (name === 'startTime') {
            const [hours, minutes] = value.split(':').map(Number);
            const newDate = new Date(eventData.date);
            newDate.setHours(hours, minutes);
            setEventData(prev => ({ ...prev, date: newDate }));
        } else if (name === 'callTime') {
            const [hours, minutes] = value.split(':').map(Number);
            const newCall = new Date(eventData.date);
            newCall.setHours(hours, minutes);
            setEventData(prev => ({ ...prev, callTime: newCall }));
        } else if (name === 'date') {
            const [year, month, day] = value.split('-').map(Number);
            const newDate = new Date(eventData.date);
            newDate.setFullYear(year, month - 1, day);
            const newCall = new Date(eventData.callTime);
            newCall.setFullYear(year, month - 1, day);
            setEventData(prev => ({ ...prev, date: newDate, callTime: newCall }));
        } else {
            setEventData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleColorChange = (idx: number, color: string) => {
        setEventData(prev => {
            const colors = [...(prev.attire?.colors || ['#000000', '#000000'])] as [string, string];
            colors[idx] = color;
            return { ...prev, attire: { ...prev.attire!, colors } };
        });
    };

    const handleAddCorpTask = () => {
        if (!newCorpTask.trim()) return;
        setEventData(prev => ({
            ...prev,
            corporateChecklistTasks: [...(prev.corporateChecklistTasks || []), newCorpTask.trim()]
        }));
        setNewCorpTask('');
    };

    const handleRemoveCorpTask = (idx: number) => {
        setEventData(prev => ({
            ...prev,
            corporateChecklistTasks: (prev.corporateChecklistTasks || []).filter((_, i) => i !== idx)
        }));
    };

    const toggleRole = (roleId: string) => {
        const next = new Set(selectedRoleIds);
        if (next.has(roleId)) next.delete(roleId);
        else next.add(roleId);
        setSelectedRoleIds(next);
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const finalLocation = { ...eventData.location } as any;
            if (finalLocation.address && !finalLocation.latitude) {
                const res = await geocodeAddress(finalLocation.address);
                if (res) Object.assign(finalLocation, res);
            }
            
            const assignments: Assignment[] = Array.from(selectedRoleIds).map(id => {
                const existing = eventData.assignments.find(a => a.roleId === id);
                if (existing) return existing;
                
                const role = allRoles.find(r => r.id === id);
                return {
                    roleId: id,
                    memberId: null,
                    status: 'pending',
                    checklistTasks: [...(role?.defaultChecklist || [])],
                    checklistProgress: {}
                };
            });

            await onSave({ ...eventData, location: finalLocation, assignments });
            onClose();
        } catch (e) { alert("Error saving."); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 w-full max-w-2xl flex flex-col animate-fade-in-up max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] overflow-hidden">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic leading-none">
                            {event ? 'Modify Unit' : 'Schedule Service'}
                        </h2>
                        <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Mission Planning Phase</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 text-3xl leading-none">&times;</button>
                </div>

                <div className="space-y-8 mb-6 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-brand-primary/10 pb-1">Primary Log</h3>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Service Title</label>
                            <input autoFocus type="text" name="name" value={eventData.name} onChange={handleInputChange} className="input-style" placeholder="Sunday Worship Experience" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                <input type="date" name="date" value={toInputDateString(eventData.date)} className="input-style" onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                                <input type="time" name="startTime" value={toInputTimeString(eventData.date)} className="input-style" onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Call Time</label>
                                <input type="time" name="callTime" value={toInputTimeString(eventData.callTime)} className="input-style" onChange={handleInputChange} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Venue Address</label>
                            <input type="text" name="address" value={eventData.location?.address || ''} onChange={handleInputChange} className="input-style" list="saved-locs" placeholder="816 E Whitney St, Houston, TX" />
                            <datalist id="saved-locs">{(savedLocations || []).map(l => <option key={l} value={l} />)}</datalist>
                        </div>
                    </section>

                    {showAttire && (
                        <section className="space-y-4 border-t pt-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-secondary border-b border-brand-secondary/10 pb-1">Presentation Standards</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Theme Title</label>
                                    <input type="text" name="attire_theme" value={eventData.attire?.theme || ''} onChange={handleInputChange} className="input-style" placeholder="e.g., All Black Tech" list="attire-themes" />
                                    <datalist id="attire-themes">{(savedAttireThemes || []).map(t => <option key={t.theme} value={t.theme} />)}</datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Color Palette</label>
                                    <div className="flex gap-4 mt-1">
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={eventData.attire?.colors?.[0] || '#000000'} onChange={(e) => handleColorChange(0, e.target.value)} className="w-10 h-10 rounded border cursor-pointer p-1" />
                                            <span className="text-[10px] font-mono font-bold uppercase">{eventData.attire?.colors?.[0]}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={eventData.attire?.colors?.[1] || '#000000'} onChange={(e) => handleColorChange(1, e.target.value)} className="w-10 h-10 rounded border cursor-pointer p-1" />
                                            <span className="text-[10px] font-mono font-bold uppercase">{eventData.attire?.colors?.[1]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Attire Description</label>
                                <textarea name="attire_description" value={eventData.attire?.description || ''} onChange={handleInputChange} rows={2} className="input-style" placeholder="e.g., Clean black polo, dark jeans, closed-toe shoes." />
                            </div>
                        </section>
                    )}

                    <section className="space-y-4 border-t pt-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600">Mission Readiness (Collective)</h3>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Per-Service Customization</span>
                        </div>
                        <div className="space-y-2">
                            {(eventData.corporateChecklistTasks || []).map((task, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                    <span className="text-sm font-bold text-gray-700">{task}</span>
                                    <button onClick={() => handleRemoveCorpTask(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newCorpTask} 
                                onChange={e => setNewCorpTask(e.target.value)} 
                                onKeyPress={e => e.key === 'Enter' && handleAddCorpTask()}
                                placeholder="Add specific task for this day..." 
                                className="flex-grow input-style" 
                            />
                            <button onClick={handleAddCorpTask} className="px-6 py-2 bg-orange-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-orange-700 shadow-sm transition-all flex-shrink-0">Add</button>
                        </div>
                    </section>

                    <section className="space-y-4 border-t pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-brand-primary/10 pb-1">Positions Needed</h3>
                        <div className="space-y-4">
                            {allRoles.length === 0 && <p className="text-sm text-gray-400 italic">No roles defined in Team Settings.</p>}
                            {(Object.entries(rolesByDepartment) as [string, Role[]][]).map(([deptId, roles]) => (
                                <div key={deptId}>
                                    <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-tighter mb-2">{deptId}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(roles || []).map(role => {
                                            const active = selectedRoleIds.has(role.id);
                                            return (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => toggleRole(role.id)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${active ? 'bg-brand-primary text-white border-brand-primary shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    {active ? '✓ ' : '+ '}{role.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-auto border-t pt-6 flex-shrink-0">
                    <div className="w-full sm:w-auto">
                        {event && onDelete && (
                            <button onClick={() => { if(window.confirm('Purge this unit?')) { onDelete(event.id); onClose(); } }} className="w-full px-6 py-3 text-red-600 font-black uppercase tracking-tighter rounded-xl hover:bg-red-50 text-xs">Purge Event</button>
                        )}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 px-6 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 text-sm">Abort</button>
                        <button onClick={handleSave} disabled={isSaving || selectedRoleIds.size === 0} className="flex-[2] px-8 py-3 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all text-sm bg-brand-primary hover:bg-brand-primary-dark disabled:bg-gray-400">
                            {isSaving ? "Dispatching..." : 'Commit Unit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
