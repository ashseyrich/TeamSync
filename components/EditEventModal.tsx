
import React, { useState, useEffect } from 'react';
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
}

const DEFAULT_CHURCH_ADDRESS = "816 E Whitney St, Houston, TX";

const toInputDateString = (date: Date): string => {
    try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return '';
    }
};

const toInputTimeString = (date: Date): string => {
    try {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '00:00';
    }
};

const getInitialEventState = (allRoles: Role[]): ServiceEvent => {
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
    nextSunday.setHours(10, 0, 0, 0);

    const callTime = new Date(nextSunday);
    callTime.setHours(8, 30, 0, 0);

    return {
        id: '',
        name: 'Sunday Morning Service',
        date: nextSunday,
        callTime: callTime,
        assignments: allRoles.map(r => ({ 
            roleId: r.id, 
            memberId: null, 
            traineeId: null, 
            checklistTasks: [...(r.defaultChecklist || [])] 
        })),
        attire: { theme: 'All Black', description: 'Clean, professional black attire.', colors: ['#000000', '#000000'] },
        location: { address: DEFAULT_CHURCH_ADDRESS, latitude: undefined, longitude: undefined },
        resources: [],
        serviceNotes: '',
        corporateChecklistTasks: [],
        corporateChecklistStatus: {}
    };
};

export const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, event, allRoles, onSave, onDelete, savedLocations, savedAttireThemes, showAttire = true }) => {
    const [eventData, setEventData] = useState<ServiceEvent>(() => getInitialEventState(allRoles));
    const [isSaving, setIsSaving] = useState(false);
    const [isResolvingLocation, setIsResolvingLocation] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [showManualCoords, setShowManualCoords] = useState(false);
    
    const [newCorpTask, setNewCorpTask] = useState('');
    const [roleTaskInputs, setRoleTaskInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setSaveSuccess(false);
            setLocationError(null);
            setShowManualCoords(false);
            if (event) {
                setEventData({
                    ...event,
                    date: new Date(event.date),
                    endDate: event.endDate ? new Date(event.endDate) : undefined,
                    callTime: new Date(event.callTime),
                    attire: event.attire ? { ...event.attire } : { theme: 'All Black', description: '', colors: ['#000000', '#000000'] },
                    location: event.location ? { ...event.location } : { address: DEFAULT_CHURCH_ADDRESS, latitude: undefined, longitude: undefined },
                    corporateChecklistTasks: event.corporateChecklistTasks || [],
                    corporateChecklistStatus: event.corporateChecklistStatus || {}
                });
            } else {
                setEventData(getInitialEventState(allRoles));
            }
        }
    }, [event, allRoles, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('attire_')) {
            const field = name.split('_')[1] as keyof Omit<Attire, 'colors'>;
            setEventData(prev => ({
                ...prev,
                attire: { ...prev.attire!, [field]: value }
            }));
        } else if (name === 'address') {
             setLocationError(null);
             setEventData(prev => ({
                ...prev,
                location: { ...prev.location!, address: value, latitude: undefined, longitude: undefined }
            }));
        } else if (name === 'latitude' || name === 'longitude') {
             setEventData(prev => ({
                 ...prev,
                 location: { ...prev.location!, [name]: parseFloat(value) || 0 }
             }));
        } else {
            setEventData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleColorChange = (index: number, color: string) => {
        setEventData(prev => {
            const newColors = [...(prev.attire?.colors || ['#000000', '#000000'])] as [string, string];
            newColors[index] = color;
            return {
                ...prev,
                attire: { ...prev.attire!, colors: newColors }
            };
        });
    };

    const handleVerifyLocation = async () => {
        const address = eventData.location?.address;
        if (!address || !address.trim()) return;
        
        setIsResolvingLocation(true);
        setLocationError(null);
        try {
            const coords = await geocodeAddress(address);
            if (coords) {
                setEventData(prev => ({
                    ...prev,
                    location: { ...prev.location!, ...coords }
                }));
            } else {
                setLocationError("Exact coordinates not found. (Optional) Try removing Suite numbers.");
            }
        } catch (e) {
            setLocationError("Verification service timed out.");
        } finally {
            setIsResolvingLocation(false);
        }
    };

    const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!value) return;

        setEventData(prev => {
            const newData = { ...prev };
            if (name === 'date') {
                const [year, month, day] = value.split('-').map(Number);
                
                // Update Start Time Date
                const d = new Date(prev.date);
                d.setFullYear(year, month - 1, day);
                newData.date = d;
                
                // Update Call Time Date
                const ct = new Date(prev.callTime);
                ct.setFullYear(year, month - 1, day);
                newData.callTime = ct;

                // Synchronize End Date as well if it exists
                if (prev.endDate) {
                    const ed = new Date(prev.endDate);
                    ed.setFullYear(year, month - 1, day);
                    newData.endDate = ed;
                }
            } else if (name === 'endDate') {
                const [year, month, day] = value.split('-').map(Number);
                const d = new Date(prev.endDate || prev.date);
                d.setFullYear(year, month - 1, day);
                newData.endDate = d;
            } else if (name === 'callTime') {
                const [hours, minutes] = value.split(':').map(Number);
                const ct = new Date(prev.callTime);
                ct.setHours(hours, minutes, 0, 0);
                newData.callTime = ct;
            } else if (name === 'startTime') {
                const [hours, minutes] = value.split(':').map(Number);
                const d = new Date(prev.date);
                d.setHours(hours, minutes, 0, 0);
                newData.date = d;
            }
            return newData;
        });
    };

    const handleAddCorporateTask = () => {
        if (!newCorpTask.trim()) return;
        setEventData(prev => {
            const tasks = [...(prev.corporateChecklistTasks || []), newCorpTask.trim()];
            const status = { ...(prev.corporateChecklistStatus || {}) };
            status[newCorpTask.trim()] = { completed: false };
            return { ...prev, corporateChecklistTasks: tasks, corporateChecklistStatus: status };
        });
        setNewCorpTask('');
    };

    const handleRemoveCorporateTask = (task: string) => {
        setEventData(prev => {
            const tasks = (prev.corporateChecklistTasks || []).filter(t => t !== task);
            const status = { ...(prev.corporateChecklistStatus || {}) };
            delete status[task];
            return { ...prev, corporateChecklistTasks: tasks, corporateChecklistStatus: status };
        });
    };

    const handleAddRoleTask = (roleId: string) => {
        const task = roleTaskInputs[roleId];
        if (!task || !task.trim()) return;
        setEventData(prev => {
            const assignments = prev.assignments.map(a => {
                if (a.roleId === roleId) {
                    return { ...a, checklistTasks: [...(a.checklistTasks || []), task.trim()] };
                }
                return a;
            });
            return { ...prev, assignments };
        });
        setRoleTaskInputs(prev => ({ ...prev, [roleId]: '' }));
    };

    const handleRemoveRoleTask = (roleId: string, task: string) => {
        setEventData(prev => {
            const assignments = prev.assignments.map(a => {
                if (a.roleId === roleId) {
                    return { ...a, checklistTasks: (a.checklistTasks || []).filter(t => t !== task) };
                }
                return a;
            });
            return { ...prev, assignments };
        });
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            let finalLocation = { ...eventData.location } as any;
            if (finalLocation.address && finalLocation.latitude === undefined) {
                try {
                    const resolved = await geocodeAddress(finalLocation.address);
                    if (resolved) finalLocation = { ...finalLocation, ...resolved };
                } catch (e) { console.warn("Saving with text address only."); }
            }
            await onSave({ ...eventData, location: finalLocation });
            setSaveSuccess(true);
            setTimeout(() => { setIsSaving(false); onClose(); }, 500);
        } catch (err) {
            console.error("Failed to save event:", err);
            alert("Connection error. Please try again.");
            setIsSaving(false);
        }
    };

    const isLocationVerified = eventData.location?.latitude !== undefined && eventData.location?.longitude !== undefined;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 flex flex-col animate-fade-in-up max-h-[95vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight italic">
                        {event ? 'Modify Service' : 'Schedule New Service'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>

                <div className="space-y-6 mb-6 overflow-y-auto pr-2">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b pb-1">Essential Information</h3>
                        <div>
                            <label htmlFor="name" className="block text-sm font-bold text-gray-700">Service Title</label>
                            <input type="text" name="name" id="name" value={eventData.name} onChange={handleInputChange} className="input-style" placeholder="e.g., Sunday Worship Experience" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-bold text-gray-700">Service Date</label>
                                <input type="date" name="date" id="date" value={toInputDateString(eventData.date)} onChange={handleDateTimeChange} className="input-style" />
                            </div>
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-bold text-gray-700">Service Start</label>
                                <input type="time" name="startTime" id="startTime" value={toInputTimeString(eventData.date)} onChange={handleDateTimeChange} className="input-style" />
                            </div>
                            <div>
                                <label htmlFor="callTime" className="block text-sm font-bold text-gray-700">Team Call Time</label>
                                <input type="time" name="callTime" id="callTime" value={toInputTimeString(eventData.callTime)} onChange={handleDateTimeChange} className="input-style" />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label htmlFor="address" className="block text-sm font-bold text-gray-700">Venue Address</label>
                                {isLocationVerified ? (
                                    <span className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                        GPS Geofencing Active
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-black text-orange-400 uppercase">Geofencing Recommended</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-grow">
                                    <input 
                                        type="text" 
                                        name="address" 
                                        id="address" 
                                        list="saved-locations"
                                        value={eventData.location?.address || ''} 
                                        onChange={handleInputChange} 
                                        className={`input-style ${isLocationVerified ? 'border-green-200 bg-green-50/20' : 'border-orange-100'}`} 
                                        placeholder="123 Church Way, City, State..." 
                                    />
                                    <datalist id="saved-locations">
                                        {savedLocations.map(loc => <option key={loc} value={loc} />)}
                                    </datalist>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleVerifyLocation}
                                    disabled={isResolvingLocation || !eventData.location?.address}
                                    className={`px-4 rounded-lg text-[10px] font-black uppercase transition-all border ${isLocationVerified ? 'bg-white text-green-700 border-green-200' : 'bg-brand-primary text-white border-brand-primary hover:bg-brand-primary-dark'} disabled:opacity-50`}
                                >
                                    {isResolvingLocation ? '...' : isLocationVerified ? 'Update Coords' : 'Verify GPS'}
                                </button>
                            </div>
                            {locationError && (
                                <div className="mt-2">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{locationError}</p>
                                    <button 
                                        onClick={() => setShowManualCoords(!showManualCoords)}
                                        className="text-[9px] text-brand-primary underline font-bold mt-1 block uppercase"
                                    >
                                        {showManualCoords ? 'Hide Manual Entry' : 'Manual Coordinate Override'}
                                    </button>
                                </div>
                            )}

                            {showManualCoords && (
                                <div className="mt-3 p-3 bg-gray-50 border rounded-lg animate-fade-in">
                                    <p className="text-[10px] text-gray-500 mb-2 italic">Provide exact coordinates to force geofencing.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-gray-400">Latitude</label>
                                            <input 
                                                type="number" 
                                                name="latitude" 
                                                value={eventData.location?.latitude || ''} 
                                                onChange={handleInputChange}
                                                step="any"
                                                className="input-style py-1 text-xs" 
                                                placeholder="e.g., 29.76"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-gray-400">Longitude</label>
                                            <input 
                                                type="number" 
                                                name="longitude" 
                                                value={eventData.location?.longitude || ''} 
                                                onChange={handleInputChange}
                                                step="any"
                                                className="input-style py-1 text-xs" 
                                                placeholder="e.g., -95.36"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {showAttire && (
                        <section className="space-y-4 border-t pt-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b pb-1">Attire Standards</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label htmlFor="attire_theme" className="block text-sm font-bold text-gray-700">Theme Title</label>
                                    <input 
                                        type="text" 
                                        name="attire_theme" 
                                        id="attire_theme" 
                                        value={eventData.attire?.theme || ''} 
                                        onChange={handleInputChange} 
                                        className="input-style" 
                                        placeholder="e.g., Casual Sunday, Business Professional" 
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="attire_description" className="block text-sm font-bold text-gray-700">Guideline Details</label>
                                    <textarea 
                                        name="attire_description" 
                                        id="attire_description" 
                                        value={eventData.attire?.description || ''} 
                                        onChange={handleInputChange} 
                                        rows={2}
                                        className="input-style" 
                                        placeholder="Specific instructions for the team..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Primary Color</label>
                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <input 
                                            type="color" 
                                            value={eventData.attire?.colors[0] || '#000000'} 
                                            onChange={(e) => handleColorChange(0, e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer"
                                        />
                                        <span className="text-xs font-mono font-bold uppercase">{eventData.attire?.colors[0]}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Secondary Color</label>
                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <input 
                                            type="color" 
                                            value={eventData.attire?.colors[1] || '#000000'} 
                                            onChange={(e) => handleColorChange(1, e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer"
                                        />
                                        <span className="text-xs font-mono font-bold uppercase">{eventData.attire?.colors[1]}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="space-y-4 border-t pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b pb-1">Ready Check Tailoring</h3>
                        <p className="text-xs text-gray-500 italic mb-4">Modify tasks for this specific service instance. These won't change your global templates.</p>
                        
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-xs font-black uppercase text-blue-800 tracking-widest mb-3">Collective Mission Tasks</h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(eventData.corporateChecklistTasks || []).map((task) => (
                                    <span key={task} className="inline-flex items-center gap-1 bg-white border border-blue-200 rounded-full px-2 py-1 text-xs font-bold text-blue-700 group">
                                        {task}
                                        <button onClick={() => handleRemoveCorporateTask(task)} className="text-blue-300 hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={newCorpTask} onChange={e => setNewCorpTask(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddCorporateTask()} placeholder="Add shared task..." className="flex-grow text-xs px-2 py-2 border rounded-lg focus:ring-brand-primary" />
                                <button onClick={handleAddCorporateTask} className="px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg">Add</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {eventData.assignments.map(a => {
                                const role = allRoles.find(r => r.id === a.roleId);
                                if (!role) return null;
                                return (
                                    <div key={a.roleId} className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <h4 className="text-xs font-black uppercase text-gray-700 tracking-widest mb-3 flex items-center justify-between">
                                            {role.name} Readiness
                                            <span className="text-[10px] font-bold text-gray-400">Instance Specific</span>
                                        </h4>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {(a.checklistTasks || []).map((task) => (
                                                <span key={task} className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded-full px-2 py-1 text-xs font-bold text-gray-600 group">
                                                    {task}
                                                    <button onClick={() => handleRemoveRoleTask(a.roleId, task)} className="text-gray-400 hover:text-red-500">&times;</button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={roleTaskInputs[a.roleId] || ''} 
                                                onChange={e => setRoleTaskInputs(prev => ({ ...prev, [a.roleId]: e.target.value }))} 
                                                onKeyPress={e => e.key === 'Enter' && handleAddRoleTask(a.roleId)}
                                                placeholder={`Extra ${role.name} check...`} 
                                                className="flex-grow text-xs px-2 py-2 border rounded-lg focus:ring-brand-primary" 
                                            />
                                            <button onClick={() => handleAddRoleTask(a.roleId)} className="px-4 py-1 bg-gray-600 text-white text-[10px] font-black uppercase rounded-lg">Add</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="flex justify-between items-center gap-2 mt-auto border-t pt-4">
                    <div>
                        {event && onDelete && (
                            <button onClick={() => { if(window.confirm('Permanently delete this service? All assignments will be lost.')) { onDelete(event.id); onClose(); } }} className="px-4 py-2 bg-red-50 text-red-600 font-black uppercase tracking-tighter rounded-lg hover:bg-red-100 transition-colors text-xs">Delete Service</button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || isResolvingLocation || saveSuccess} 
                            className={`px-8 py-2 text-white font-black uppercase tracking-widest rounded-lg shadow-md transition-all text-sm flex items-center gap-2 ${saveSuccess ? 'bg-green-600' : 'bg-brand-primary hover:bg-brand-primary-dark disabled:bg-gray-400'}`}
                        >
                            {saveSuccess ? "Done!" : isSaving ? "Saving..." : 'Commit Schedule'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
