
import React, { useState, useEffect } from 'react';
import type { Team, TeamFeatures } from '../types.ts';

interface TeamSettingsCardProps {
    team: Team;
    onUpdateTeam: (updatedData: Partial<Team>) => void;
    onResetTeamClick: () => void;
    onDeleteTeamClick: () => void;
}

export const TeamSettingsCard: React.FC<TeamSettingsCardProps> = ({ team, onUpdateTeam, onResetTeamClick, onDeleteTeamClick }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [teamName, setTeamName] = useState(team.name);

    useEffect(() => {
        setTeamName(team.name);
    }, [team.name]);

    const handleSave = () => {
        if (teamName.trim() && teamName.trim() !== team.name) {
            onUpdateTeam({ name: teamName.trim() });
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTeamName(team.name);
        setIsEditing(false);
    };

    const toggleFeature = (feature: keyof TeamFeatures) => {
        const currentFeatures = team.features || { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false };
        onUpdateTeam({
            features: {
                ...currentFeatures,
                [feature]: !currentFeatures[feature]
            }
        });
    };

    const isYouthTeam = team.type === 'youth';

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Team Settings</h3>
            <div className="flex items-center justify-between mb-6">
                <div className="flex-grow mr-4">
                    <label className="block text-sm font-medium text-gray-500">Team Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                    ) : (
                        <p className="text-lg text-gray-800">{team.name}</p>
                    )}
                </div>
                {isEditing ? (
                    <div className="flex gap-2 items-end h-full pt-6">
                        <button onClick={handleSave} className="px-3 py-1 bg-brand-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save</button>
                        <button onClick={handleCancel} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="px-3 py-1 text-sm font-semibold text-brand-primary hover:underline mt-6">
                        Edit
                    </button>
                )}
            </div>
            
            <div className="border-t pt-4 mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Feature Toggles</h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                         <div>
                            <p className="font-medium text-gray-800">Video Analysis</p>
                            <p className="text-xs text-gray-500">Enable AI reviews for service videos.</p>
                         </div>
                         <button 
                            onClick={() => toggleFeature('videoAnalysis')} 
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${team.features?.videoAnalysis ? 'bg-brand-primary' : 'bg-gray-200'}`}
                         >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${team.features?.videoAnalysis ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                    </div>
                     <div className="flex items-center justify-between">
                         <div>
                            <p className="font-medium text-gray-800">Attire Guide</p>
                            <p className="text-xs text-gray-500">Show dress code and AI outfit suggestions on events.</p>
                         </div>
                         <button 
                            onClick={() => toggleFeature('attire')} 
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${team.features?.attire ? 'bg-brand-primary' : 'bg-gray-200'}`}
                         >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${team.features?.attire ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                    </div>
                     <div className="flex items-center justify-between">
                         <div>
                            <p className="font-medium text-gray-800">Training Library</p>
                            <p className="text-xs text-gray-500">Enable the video training module.</p>
                         </div>
                         <button 
                            onClick={() => toggleFeature('training')} 
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${team.features?.training ? 'bg-brand-primary' : 'bg-gray-200'}`}
                         >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${team.features?.training ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                    </div>
                    {isYouthTeam && (
                        <div className="flex items-center justify-between">
                             <div>
                                <p className="font-medium text-gray-800">Kids Check-in</p>
                                <p className="text-xs text-gray-500">Enable the child check-in and tracking module.</p>
                             </div>
                             <button 
                                onClick={() => toggleFeature('childCheckIn')} 
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${team.features?.childCheckIn ? 'bg-brand-primary' : 'bg-gray-200'}`}
                             >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${team.features?.childCheckIn ? 'translate-x-5' : 'translate-x-0'}`} />
                             </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-red-300 space-y-6">
                <h4 className="text-lg font-bold text-red-700">Danger Zone</h4>
                
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <p className="font-bold text-gray-800">Reset Team</p>
                        <p className="text-sm text-gray-600">Permanently delete all members (except you), events, and data. Your admin role remains.</p>
                    </div>
                    <button
                        onClick={onResetTeamClick}
                        className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 flex-shrink-0 transition-colors"
                    >
                        Reset Data
                    </button>
                </div>

                <div className="flex justify-between items-start gap-4 pt-4 border-t border-red-100">
                    <div>
                        <p className="font-bold text-red-600">Delete Team Permanentely</p>
                        <p className="text-sm text-gray-600">Permanently destroy this team and all its data. You will lose access immediately.</p>
                    </div>
                    <button
                        onClick={onDeleteTeamClick}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex-shrink-0 shadow-sm transition-colors"
                    >
                        Delete Team
                    </button>
                </div>
            </div>
        </div>
    );
};
