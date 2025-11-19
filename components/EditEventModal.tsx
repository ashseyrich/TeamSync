
import React, { useState, useEffect } from 'react';
import type { ServiceEvent, Role, SavedAttireTheme, Attire, EventResource } from '../types.ts';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ServiceEvent | null;
  allRoles: Role[];
  onSave: (event: ServiceEvent) => void;
  savedLocations: string[];
  savedAttireThemes: SavedAttireTheme[];
  showAttire?: boolean;
}

// Helper to format Date to YYYY-MM-DD for date input
const toInputDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Helper to format Date to HH:mm for time input
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
        location: { address: '' },
        resources: [],
        serviceNotes: '',
    };
};

export const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, event, allRoles, onSave, savedLocations, savedAttireThemes, showAttire = true }) => {
    const [eventData, setEventData] = useState<Omit<ServiceEvent, 'id'>>(() => getInitialEventState(allRoles));
    
    // Resource state
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [newResourceType, setNewResourceType] = useState<EventResource['type']>('link');

    useEffect(() => {
        if (isOpen) {
            if (event) {
                // Editing an existing event
                setEventData({
                    name: event.name,
                    date: new Date(event.date),
                    endDate: event.endDate ? new Date(event.endDate) : undefined,
                    callTime: new Date(event.callTime),
                    assignments: event.assignments,
                    attire: event.attire ? { ...event.attire } : { theme: '', description: '', colors: ['#ffffff', '#ffffff'] },
                    attireImages: event.attireImages,
                    location: event.location ? { ...event.location } : { address: '' },
                    resources: event.resources || [],
                    serviceNotes: event.serviceNotes || '',
                });
            } else {
                // Creating a new event
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
                location: { ...prev.location!, address: value }
            }));
        } else {
            setEventData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleColorChange = (index: 0 | 1, color: string) => {
        const oldColors = eventData.attire?.colors || ['#ffffff', '#ffffff'];
        const newColors: [string, string] = index === 0 ? [color, oldColors[1]] : [oldColors[0], color];
        setEventData(prev => ({
            ...prev,
            attire: { ...prev.attire!, colors: newColors }
        }));
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
        }
    };
    
    const handleRoleToggle = (roleId: string, checked: boolean) => {
        if (checked) {
            // Add role if it doesn't exist
            if (!eventData.assignments.some(a => a.roleId === roleId)) {
                setEventData(prev => ({
                    ...prev,
                    assignments: [...prev.assignments, { roleId, memberId: null }]
                }));
            }
        } else {
            // Remove role, but preserve assignment data if it exists
            setEventData(prev => ({
                ...prev,
                assignments: prev.assignments.filter(a => a.roleId !== roleId)
            }));
        }
    };

    const handleSave = () => {
        const finalEvent: ServiceEvent = {
            id: event?.id || '', // id will be set in onSave handler if new
            ...eventData,
        };
        onSave(finalEvent);
        onClose();
    };
    
    const handleThemeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const themeName = e.target.value;
        const selectedTheme = savedAttireThemes.find(t => t.theme === themeName);
        if (selectedTheme) {
             setEventData(prev => ({
                ...prev,
                attire: { ...selectedTheme }
            }));
        }
    }

    const handleAddResource = () => {
        if (newResourceTitle.trim() && newResourceUrl.trim()) {
            const newResource: EventResource = {
                id: `res_${Date.now()}`,
                title: newResourceTitle.trim(),
                url: newResourceUrl.trim(),
                type: newResourceType,
            };
            setEventData(prev => ({
                ...prev,
                resources: [...(prev.resources || []), newResource]
            }));
            setNewResourceTitle('');
            setNewResourceUrl('');
        }
    };

    const handleRemoveResource = (id: string) => {
        setEventData(prev => ({
            ...prev,
            resources: prev.resources?.filter(r => r.id !== id)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{event ? 'Edit Event' : 'Create New Event'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>

                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Event Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={eventData.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                name="date"
                                id="date"
                                value={toInputDateString(eventData.date)}
                                onChange={handleDateTimeChange}
                                className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            />
                        </div>
                        <div>
                             <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                            <input
                                type="date"
                                name="endDate"
                                id="endDate"
                                value={eventData.endDate ? toInputDateString(eventData.endDate) : ''}
                                onChange={handleDateTimeChange}
                                className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="callTime" className="block text-sm font-medium text-gray-700">Call Time (Start)</label>
                        <input
                            type="time"
                            name="callTime"
                            id="callTime"
                            value={toInputTimeString(eventData.callTime)}
                            onChange={handleDateTimeChange}
                            className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                    </div>
                     <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Event Location & Notes</h4>
                         <div className="space-y-3">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    list="saved-locations"
                                    value={eventData.location?.address || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    placeholder="e.g., 123 Main St, Anytown, USA"
                                />
                                <datalist id="saved-locations">
                                    {savedLocations.map(loc => <option key={loc} value={loc} />)}
                                </datalist>
                            </div>
                            <div>
                                <label htmlFor="serviceNotes" className="block text-sm font-medium text-gray-700">Service Notes / Description</label>
                                <textarea
                                    name="serviceNotes"
                                    id="serviceNotes"
                                    rows={2}
                                    value={eventData.serviceNotes || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    placeholder="Special instructions or theme for the service..."
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Resources Section */}
                    <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Resources (Links & Docs)</h4>
                        <div className="space-y-2 mb-3">
                            {eventData.resources?.map(res => (
                                <div key={res.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-lg">
                                            {res.type === 'link' && '🔗'}
                                            {res.type === 'document' && '📄'}
                                            {res.type === 'music' && '🎵'}
                                            {res.type === 'video' && '📹'}
                                        </span>
                                        <div className="truncate">
                                            <p className="text-sm font-medium text-gray-800 truncate">{res.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{res.url}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveResource(res.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                            <div className="flex-grow w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Title (e.g., Run Sheet)"
                                    value={newResourceTitle}
                                    onChange={e => setNewResourceTitle(e.target.value)}
                                    className="block w-full pl-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm mb-2 sm:mb-0"
                                />
                            </div>
                            <div className="flex-grow w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="URL"
                                    value={newResourceUrl}
                                    onChange={e => setNewResourceUrl(e.target.value)}
                                    className="block w-full pl-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm mb-2 sm:mb-0"
                                />
                            </div>
                            <div className="w-full sm:w-auto">
                                <select 
                                    value={newResourceType} 
                                    onChange={e => setNewResourceType(e.target.value as any)}
                                    className="block w-full pl-2 pr-8 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                >
                                    <option value="link">Link</option>
                                    <option value="document">Doc</option>
                                    <option value="music">Music</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <button type="button" onClick={handleAddResource} className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300">
                                Add
                            </button>
                        </div>
                    </div>

                    {showAttire && (
                        <div className="border-t pt-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-2">Attire (Optional)</h4>
                            {savedAttireThemes.length > 0 && (
                                <div className="mb-2">
                                    <label htmlFor="saved_themes" className="block text-sm font-medium text-gray-700">Load Saved Theme</label>
                                    <select id="saved_themes" onChange={handleThemeSelect} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                                        <option>Select a preset...</option>
                                        {savedAttireThemes.map(theme => <option key={theme.theme} value={theme.theme}>{theme.theme}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="attire_theme" className="block text-sm font-medium text-gray-700">Theme Name</label>
                                    <input
                                        type="text"
                                        name="attire_theme"
                                        id="attire_theme"
                                        value={eventData.attire?.theme || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                        placeholder="e.g., Joyful Praise"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Color 1</label>
                                        <input
                                            type="color"
                                            value={eventData.attire?.colors[0] || '#ffffff'}
                                            onChange={(e) => handleColorChange(0, e.target.value)}
                                            className="mt-1 w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Color 2</label>
                                        <input
                                            type="color"
                                            value={eventData.attire?.colors[1] || '#ffffff'}
                                            onChange={(e) => handleColorChange(1, e.target.value)}
                                            className="mt-1 w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2">
                                <label htmlFor="attire_description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="attire_description"
                                    id="attire_description"
                                    value={eventData.attire?.description || ''}
                                    onChange={handleInputChange}
                                    rows={2}
                                    className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    placeholder="e.g., Wear bright and cheerful colors."
                                />
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Roles for this Event</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {allRoles.map(role => (
                                <div key={role.id} className="flex items-center">
                                    <input
                                        id={`role-${role.id}`}
                                        type="checkbox"
                                        checked={eventData.assignments.some(a => a.roleId === role.id)}
                                        onChange={(e) => handleRoleToggle(role.id, e.target.checked)}
                                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                    />
                                    <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                                        {role.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-auto border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Event</button>
                </div>
            </div>
        </div>
    );
};
