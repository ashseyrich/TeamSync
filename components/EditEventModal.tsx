
import React, { useState, useEffect } from 'react';
import type { ServiceEvent, Role, SavedAttireTheme, Attire, EventResource } from '../types.ts';
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

const toInputDateString = (date: Date): string => {
    try {
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

const toInputTimeString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const getInitialEventState = (allRoles: Role[]): Omit<ServiceEvent, 'id'> => {
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
    nextSunday.setHours(10, 0, 0, 0);

    const callTime = new Date(nextSunday);
    callTime.setHours(8, 30, 0, 0);

    return {
        name: 'Sunday Morning Service',
        date: nextSunday,
        callTime: callTime,
        assignments: allRoles.map(r => ({ roleId: r.id, memberId: null, traineeId: null })),
        attire: { theme: '', description: '', colors: ['#ffffff', '#ffffff'] },
        location: { address: '', latitude: undefined, longitude: undefined },
        resources: [],
        serviceNotes: '',
    };
};

export const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, event, allRoles, onSave, onDelete, savedLocations, savedAttireThemes, showAttire = true }) => {
    const [eventData, setEventData] = useState<Omit<ServiceEvent, 'id'>>(() => getInitialEventState(allRoles));
    const [isSaving, setIsSaving] = useState(false);
    const [isResolvingLocation, setIsResolvingLocation] = useState(false);
    
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [newResourceType, setNewResourceType] = useState<EventResource['type']>('link');

    useEffect(() => {
        if (isOpen) {
            if (event) {
                setEventData({
                    name: event.name,
                    date: new Date(event.date),
                    endDate: event.endDate ? new Date(event.endDate) : undefined,
                    callTime: new Date(event.callTime),
                    assignments: event.assignments,
                    attire: event.attire ? { ...event.attire } : { theme: '', description: '', colors: ['#ffffff', '#ffffff'] },
                    attireImages: event.attireImages,
                    location: event.location ? { ...event.location } : { address: '', latitude: undefined, longitude: undefined },
                    resources: event.resources || [],
                    serviceNotes: event.serviceNotes || '',
                });
            } else {
                setEventData(getInitialEventState(allRoles));
            }
        }
    }, [event, allRoles, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const attemptGeocode = async (address: string) => {
        if (!address.trim()) return;
        setIsResolvingLocation(true);
        const coords = await geocodeAddress(address);
        if (coords) {
            setEventData(prev => ({
                ...prev,
                location: { ...prev.location!, ...coords }
            }));
        }
        setIsResolvingLocation(false);
        return coords;
    };

    const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'date') {
            const [year, month, day] = value.split('-').map(Number);
            const newDate = new Date(eventData.date);
            newDate.setFullYear(year, month - 1, day);
            const newCallTime = new Date(eventData.callTime);
            newCallTime.setFullYear(year, month - 1, day);
            setEventData(prev => ({ ...prev, date: newDate, callTime: newCallTime }));
        } else if (name === 'endDate') {
            if (!value) {
                setEventData(prev => ({ ...prev, endDate: undefined }));
                return;
            }
            const [year, month, day] = value.split('-').map(Number);
            const newEndDate = new Date(year, month - 1, day);
            setEventData(prev => ({ ...prev, endDate: newEndDate }));
        } else if (name === 'callTime') {
            const [hours, minutes] = value.split(':').map(Number);
            const newCallTime = new Date(eventData.callTime);
            newCallTime.setHours(hours, minutes);
            setEventData(prev => ({ ...prev, callTime: newCallTime }));
        } else if (name === 'startTime') {
            const [hours, minutes] = value.split(':').map(Number);
            const newDate = new Date(eventData.date);
            newDate.setHours(hours, minutes);
            setEventData(prev => ({ ...prev, date: newDate }));
        }
    };
    
    const handleRoleToggle = (roleId: string, checked: boolean) => {
        if (checked) {
            if (!eventData.assignments.some(a => a.roleId === roleId)) {
                setEventData(prev => ({
                    ...prev,
                    assignments: [...prev.assignments, { roleId, memberId: null }]
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
        setIsSaving(true);
        let finalLocation = { ...eventData.location };
        
        // Final attempt to resolve location if an address is present but no coords
        if (finalLocation.address && !finalLocation.latitude) {
            const resolved = await attemptGeocode(finalLocation.address);
            if (resolved) {
                finalLocation = { ...finalLocation, ...resolved };
            }
        }

        const finalEvent: ServiceEvent = {
            id: event?.id || `event_${Date.now()}`,
            ...eventData,
            location: finalLocation
        };
        
        onSave(finalEvent);
        setIsSaving(false);
        onClose();
    };

    const isGeofenceSet = !!(eventData.location?.latitude && eventData.location?.longitude);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 flex flex-col animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{event ? 'Edit Event' : 'Create New Event'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>

                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
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
                             <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
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
                    
                    <div className="border-t pt-4">
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
                            list="saved-locations"
                            value={eventData.location?.address || ''}
                            onChange={handleInputChange}
                            onBlur={(e) => attemptGeocode(e.target.value)}
                            className="input-style"
                            placeholder="e.g., 123 Main St, Anytown"
                        />
                        <datalist id="saved-locations">
                            {savedLocations.map(loc => <option key={loc} value={loc} />)}
                        </datalist>
                        <p className="text-[10px] text-gray-500 mt-1 italic">Type the address and we'll automatically set up the proximity check-in for your team.</p>
                    </div>

                    <div className="border-t pt-4">
                        <label htmlFor="serviceNotes" className="block text-sm font-medium text-gray-700">Service Notes</label>
                        <textarea name="serviceNotes" id="serviceNotes" rows={2} value={eventData.serviceNotes || ''} onChange={handleInputChange} className="input-style" placeholder="Special instructions..." />
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Roles Required</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {allRoles.map(role => (
                                <div key={role.id} className="flex items-center">
                                    <input id={`role-${role.id}`} type="checkbox" checked={eventData.assignments.some(a => a.roleId === role.id)} onChange={(e) => handleRoleToggle(role.id, e.target.checked)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                                    <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">{role.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-2 mt-auto border-t pt-4">
                    <div>
                        {event && onDelete && (
                            <button onClick={() => { if(window.confirm('Delete event?')) { onDelete(event.id); onClose(); } }} className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors text-sm">Delete</button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || isResolvingLocation} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-brand-primary-dark disabled:bg-gray-400 text-sm flex items-center gap-2">
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </>
                            ) : 'Save Event'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
