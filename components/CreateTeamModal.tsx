
import React, { useState } from 'react';
import type { TeamType } from '../types.ts';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamName: string, type: TeamType, description?: string, focusAreas?: string[]) => Promise<string | boolean>;
}

const TEAM_TYPES: { id: TeamType; label: string; icon: string; description: string }[] = [
    { id: 'media', label: 'Media / Production', icon: '📹', description: 'Includes Video Analysis, technical roles, and equipment focus.' },
    { id: 'worship', label: 'Worship Team', icon: '🎸', description: 'Roles for musicians and vocalists. Audio/Video features optional.' },
    { id: 'ushering', label: 'Ushers / Greeters', icon: '🤝', description: 'Hospitality focused roles. Simplified feature set.' },
    { id: 'youth', label: 'Youth Ministry', icon: '🎮', description: 'Includes Child Check-in, small group roles, and safety features.' },
    { id: 'general', label: 'General Team', icon: '👥', description: 'Basic scheduling and announcements for any group.' },
    { id: 'custom', label: 'Custom Team', icon: '✨', description: 'Describe your team, and AI will generate roles, skills, and settings for you.' },
];

const FOCUS_AREAS = [
    { id: 'videoAnalysis', label: 'Video Analysis & Review' },
    { id: 'attire', label: 'Attire / Uniform Tracking' },
    { id: 'training', label: 'Training Library & Scenarios' },
    { id: 'childCheckIn', label: 'Child Check-in System' },
];

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onCreateTeam }) => {
    const [teamName, setTeamName] = useState('');
    const [selectedType, setSelectedType] = useState<TeamType>('media');
    const [customDescription, setCustomDescription] = useState('');
    const [selectedFocusAreas, setSelectedFocusAreas] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!teamName.trim()) {
            setError('Team name cannot be empty.');
            return;
        }
        if (selectedType === 'custom' && !customDescription.trim()) {
            setError('Please provide a description for your custom team.');
            return;
        }

        setIsLoading(true);
        try {
             const result = await onCreateTeam(teamName, selectedType, customDescription, Array.from(selectedFocusAreas));
             if (result === true) {
                 setTeamName('');
                 setCustomDescription('');
                 setSelectedType('media');
                 setSelectedFocusAreas(new Set());
                 onClose(); // Success
             } else {
                 setError(result as string);
             }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFocusArea = (areaId: string) => {
        const newAreas = new Set(selectedFocusAreas);
        if (newAreas.has(areaId)) {
            newAreas.delete(areaId);
        } else {
            newAreas.add(areaId);
        }
        setSelectedFocusAreas(newAreas);
    };

    if (!isOpen) return null;

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create a New Team</h2>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          This will create a new, separate team where you will be the first administrator.
        </p>
      
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="newTeamName" className="block text-sm font-medium text-gray-700">New Team Name</label>
                <input type="text" id="newTeamName" value={teamName} onChange={e => setTeamName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., Youth Ministry Team"/>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TEAM_TYPES.map(type => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedType(type.id)}
                            className={`p-3 rounded-lg border text-left transition-all ${selectedType === type.id ? 'border-brand-primary bg-brand-light ring-1 ring-brand-primary' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                            <div className="text-2xl mb-1">{type.icon}</div>
                            <div className="font-bold text-gray-800 text-sm">{type.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                        </button>
                    ))}
                </div>
            </div>
            
            {selectedType === 'custom' && (
                <div className="animate-fade-in space-y-4">
                    <div>
                        <label htmlFor="customDescription" className="block text-sm font-medium text-gray-700">Describe Your Team</label>
                        <textarea 
                            id="customDescription" 
                            value={customDescription} 
                            onChange={e => setCustomDescription(e.target.value)} 
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" 
                            placeholder="e.g., A parking lot safety team that directs traffic and helps elderly people to the door."
                        />
                        <p className="text-xs text-gray-500 mt-1">AI will generate roles and skills based on this description.</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Include Features</label>
                        <p className="text-xs text-gray-500 mb-2">Select areas you specifically need for this team.</p>
                        <div className="space-y-2">
                            {FOCUS_AREAS.map(area => (
                                <label key={area.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedFocusAreas.has(area.id)}
                                        onChange={() => toggleFocusArea(area.id)}
                                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                    />
                                    <span className="text-sm text-gray-800">{area.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {error && ( <div className="rounded-md bg-red-50 p-3"><p className="text-sm text-red-700">{error}</p></div> )}

            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400">
                    {isLoading ? (selectedType === 'custom' ? 'Generating...' : 'Creating...') : 'Create Team'}
                </button>
            </div>
        </form>
      </div>
    </div>
    );
};
