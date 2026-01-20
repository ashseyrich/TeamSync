import React, { useState, useEffect } from 'react';
import type { ServiceEvent, Role, SavedAttireTheme, Attire, EventResource } from '../types.ts';
import { geocodeAddress } from '../utils/location.ts';
import { AttireInspiration } from './AttireInspiration.tsx';

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

const DEFAULT_CHURCH_ADDRESS = "816 e Whitney str Houston TX";

/**
 * Returns YYYY-MM-DD in local time
 */
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

/**
 * Returns HH:MM in local time
 */
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
        id: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: 'Sunday Morning Service',
        date: nextSunday,
        callTime: callTime,
        assignments: allRoles.map(r => ({ roleId: r.id, memberId: null, traineeId: null })),
        attire: { theme: 'All Black', description: 'Clean, professional black attire.', colors: ['#000000', '#000000'] },
        location: { address: DEFAULT_CHURCH_ADDRESS, latitude: undefined, longitude: undefined },
        resources: [],
        serviceNotes: '',
    };
};

export const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, event, allRoles, onSave, onDelete, savedLocations, savedAttireThemes, showAttire = true }) => {
    const [eventData, setEventData] = useState<ServiceEvent>(() => getInitialEventState(allRoles));
    const [isSaving, setIsSaving] = useState(false);
    const [isResolvingLocation, setIsResolvingLocation] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setSaveSuccess(false);
            if (event) {
                setEventData({
                    ...event,
                    date: new Date(event.date),
                    endDate: event.endDate ? new Date(event.endDate) : undefined,
                    callTime: new Date(event.callTime),
                    attire: event.attire ? { ...event.attire } : { theme: 'All Black', description: '', colors: ['#000000', '#000000'] },
                    location: event.location ? { ...event.location } : { address: DEFAULT_CHURCH_ADDRESS, latitude: undefined, longitude: undefined },
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
             setEventData(prev => ({
                ...prev,
                location: { ...prev.location!, address: value, latitude: undefined, longitude: undefined }
            }));
        } else {
            setEventData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleColorChange = (index: number, color: string) => {
        const newColors = [...(eventData.attire?.colors || ['#000000', '#000000'])];
        newColors[index] = color;
        setEventData(prev => ({
            ...prev,
            attire: { ...prev.attire!, colors: newColors as [string, string] }
        }));
    };

    const attemptGeocode = async (address: string) => {
        if (!address.trim()) return null;
        setIsResolvingLocation(true);
        try {
            const coords = await geocodeAddress(address);
            if (coords) {
                setEventData(prev => ({
                    ...prev,
                    location: { ...prev.location!, ...coords }
                }));
            }
        } catch (e) {
            console.warn("Geocoding failed for:", address);
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
                const d = new Date(prev.date);
                d.setFullYear(year, month - 1, day);
                newData.date = d;
                
                // Sync callTime date to service date by default
                const ct = new Date(prev.callTime);
                ct.setFullYear(year, month - 1, day);
                newData.callTime = ct;
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
    
    const handleRoleToggle = (roleId: string, checked: boolean) => {
        if (checked) {
            if (!eventData.assignments.some(a => a.roleId === roleId)) {
                setEventData(prev => ({
                    ...prev,
                    assignments: [...prev.assignments, { roleId, memberId: null, traineeId: null }]
                }));
            }
        } else {
            setEventData(prev => ({
                ...prev,
                assignments: prev.assignments.filter(a => a.roleId !== roleId)
            }));
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            let finalLocation = { ...eventData.location } as any;
            
            // Non-blocking geocode attempt if coordinates missing
            if (finalLocation.address && !finalLocation.latitude) {
                try {
                    const resolved = await geocodeAddress(finalLocation.address);
                    if (resolved) {
                        finalLocation = { ...finalLocation, ...resolved };
                    }
                } catch (e) {
                    console.warn("Proceeding with text address only.");
                }
            }

            const finalEvent: ServiceEvent = {
                ...eventData,
                location: finalLocation
            };
            
            await onSave(finalEvent);
            setSaveSuccess(true);
            
            setTimeout(() => {
                setIsSaving(false);
                onClose();
            }, 500);
        } catch (err) {
            console.error("Failed to save event:", err);
            alert("Failed to save changes. Please try again.");
            setIsSaving(false);
        }
    };

    const handleUpdateFromAttireInspiration = (updatedEvent: ServiceEvent) => {
        setEventData(updatedEvent);
    };

    const isGeofenceSet = !!(eventData.location?.latitude && eventData.location?.longitude);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 flex flex-col animate-fade-in-up max-h-[95vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{event ? 'Edit Event' : 'Create New Event'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>

                <div className="space-y-4 mb-6 overflow-y-auto pr-2">
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-1">Basic Info</h3>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Event Name</label>
                            <input type="text" name="name" id="name" value={eventData.name} onChange={handleInputChange} className="input-style" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Service Date</label>
                                <input type="date" name="date" id="date" value={toInputDateString(eventData.date)} onChange={handleDateTimeChange} className="input-style" />
                            </div>
                            <div>
                                 <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                                <input type="date" name="endDate" id="endDate" value={eventData.endDate ? toInputDateString(eventData.endDate) : ''} onChange={handleDateTimeChange} className="input-style" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="callTime" className="block text-sm font-medium text-gray-700">Call Time</label>
                                <input type="time" name="callTime" id="callTime" value={toInputTimeString(eventData.callTime)} onChange={handleDateTimeChange} className="input-style" />
                            </div>
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Service Start</label>
                                <input type="time" name="startTime" id="startTime" value={toInputTimeString(eventData.date)} onChange={handleDateTimeChange} className="input-style" />
                            </div>
                        </div>
                    </section>
                    
                    <section className="space-y-4 border-t pt-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-1">Location</h3>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="address" className="block text-sm font-bold text-gray-700">Location Address</label>
                                {isResolvingLocation ? (
                                    <span className="text-[10px] font-bold text-blue-600 animate-pulse uppercase">Verifying...</span>
                                ) : isGeofenceSet ? (
                                    <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Geofence Active</span>
                                ) : null}
                            </div>
                            <input
                                type="text"
                                name="address"
                                id="address"
                                list="saved-locations-list-modal"
                                value={eventData.location?.address || ''}
                                onChange={handleInputChange}
                                onBlur={(e) => attemptGeocode(e.target.value)}
                                className="input-style"
                                placeholder="e.g., 123 Main St, Houston TX"
                            />
                            <datalist id="saved-locations-list-modal">
                                <option value={DEFAULT_CHURCH_ADDRESS} />
                                {savedLocations.filter(l => l !== DEFAULT_CHURCH_ADDRESS).map(loc => <option key={loc} value={loc} />)}
                            </datalist>
                        </div>
                    </section>

                    {showAttire && (
                        <section className="space-y-4 border-t pt-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-1">Attire Guidelines</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="attire_theme" className="block text-sm font-medium text-gray-700">Theme</label>
                                    <input 
                                        type="text" 
                                        name="attire_theme" 
                                        id="attire_theme" 
                                        value={eventData.attire?.theme || ''} 
                                        onChange={handleInputChange} 
                                        className="input-style" 
                                        placeholder="e.g., All Black, Business Casual" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Brand Colors</label>
                                    <div className="mt-2 flex gap-2">
                                        <input 
                                            type="color" 
                                            value={eventData.attire?.colors[0] || '#000000'} 
                                            onChange={e => handleColorChange(0, e.target.value)} 
                                            className="w-8 h-8 rounded cursor-pointer border shadow-sm"
                                        />
                                        <input 
                                            type="color" 
                                            value={eventData.attire?.colors[1] || '#000000'} 
                                            onChange={e => handleColorChange(1, e.target.value)} 
                                            className="w-8 h-8 rounded cursor-pointer border shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="attire_description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea 
                                    name="attire_description" 
                                    id="attire_description" 
                                    value={eventData.attire?.description || ''} 
                                    onChange={handleInputChange} 
                                    rows={2}
                                    className="input-style" 
                                    placeholder="e.g., No rips in jeans, tucked in shirts. Black polos preferred." 
                                />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-dashed">
                                <h4 className="text-sm font-bold text-gray-700 mb-3">AI Visual Inspiration</h4>
                                <AttireInspiration 
                                    event={eventData} 
                                    onUpdateEvent={handleUpdateFromAttireInspiration} 
                                    canSchedule={true} 
                                />
                            </div>
                        </section>
                    )}

                    <section className="space-y-4 border-t pt-4">
                         <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-1">Team Details</h3>
                        <div>
                            <label htmlFor="serviceNotes" className="block text-sm font-medium text-gray-700">Service Notes</label>
                            <textarea name="serviceNotes" id="serviceNotes" rows={2} value={eventData.serviceNotes || ''} onChange={handleInputChange} className="input-style" placeholder="Special instructions for the whole team..." />
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Roles Required</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {allRoles.map(role => (
                                    <div key={role.id} className="flex items-center">
                                        <input id={`role-modal-${role.id}`} type="checkbox" checked={eventData.assignments.some(a => a.roleId === role.id)} onChange={(e) => handleRoleToggle(role.id, e.target.checked)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                                        <label htmlFor={`role-modal-${role.id}`} className="ml-2 block text-sm text-gray-900">{role.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex justify-between items-center gap-2 mt-auto border-t pt-4">
                    <div>
                        {event && onDelete && (
                            <button onClick={() => { if(window.confirm('Delete event?')) { onDelete(event.id); onClose(); } }} className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors text-sm">Delete</button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || isResolvingLocation || saveSuccess} 
                            className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition-all text-sm flex items-center gap-2 ${saveSuccess ? 'bg-green-600' : 'bg-brand-primary hover:bg-brand-primary-dark disabled:bg-gray-400'}`}
                        >
                            {saveSuccess ? (
                                <>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Saved!
                                </>
                            ) : isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};