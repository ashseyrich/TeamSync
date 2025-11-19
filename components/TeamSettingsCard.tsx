
import React, { useState, useEffect, useRef } from 'react';
import type { Team, TeamFeatures } from '../types.ts';

interface TeamSettingsCardProps {
    team: Team;
    onUpdateTeam: (updatedData: Partial<Team>) => void;
    onResetTeamClick: () => void;
    onExportTeam: () => void;
    onImportTeam: (json: string) => void;
}

export const TeamSettingsCard: React.FC<TeamSettingsCardProps> = ({ team, onUpdateTeam, onResetTeamClick, onExportTeam, onImportTeam }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [teamName, setTeamName] = useState(team.name);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const currentFeatures = team.features || { videoAnalysis: true, attire: true, training: true };
        onUpdateTeam({
            features: {
                ...currentFeatures,
                [feature]: !currentFeatures[feature]
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const json = event.target?.result as string;
                onImportTeam(json);
            };
            reader.readAsText(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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
                </div>
            </div>

            <div className="border-t pt-4 mb-6">
                 <h4 className="text-md font-semibold text-gray-700 mb-3">Data Backup & Sync</h4>
                 <p className="text-sm text-gray-600 mb-3">
                     Since this app runs without a cloud server, you must manually export data to share it with your team or move it to another device.
                 </p>
                 <div className="flex gap-3">
                     <button onClick={onExportTeam} className="flex-1 px-3 py-2 bg-brand-secondary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Team Data
                     </button>
                     <button onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Import Team Data
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                 </div>
            </div>

            <div className="pt-4 border-t border-red-300">
                <h4 className="text-lg font-bold text-red-700">Danger Zone</h4>
                <div className="mt-2 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-800">Reset Team</p>
                        <p className="text-sm text-gray-600">This will permanently delete all members (except you), events, and data associated with this team.</p>
                    </div>
                    <button
                        onClick={onResetTeamClick}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 flex-shrink-0 ml-4"
                    >
                        Reset Team...
                    </button>
                </div>
            </div>
        </div>
    );
};
