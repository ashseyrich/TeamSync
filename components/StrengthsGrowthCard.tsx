import React, { useState } from 'react';
import type { TeamMember } from '../types.ts';

const ALL_SKILLS = [
    // Technical Skills
    'Audio Mixing', 
    'Camera Operation', 
    'Video Directing', 
    'ProPresenter', 
    'Lighting',
    // Soft & Personal Skills
    'Communication', 
    'Leadership', 
    'Problem Solving', 
    'Teamwork', 
    'Adaptability',
    'Timeliness',
    'Cleaning Up Equipment',
    'Attention to Detail',
    'Following Directions',
    'Receiving Feedback'
];

interface StrengthsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: TeamMember;
    onSave: (strengths: string[], growthAreas: string[]) => void;
}

const StrengthsModal: React.FC<StrengthsModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [currentStrengths, setCurrentStrengths] = useState(new Set(user.strengths || []));
    const [currentGrowth, setCurrentGrowth] = useState(new Set(user.growthAreas || []));

    if(!isOpen) return null;

    const handleToggle = (skill: string, type: 'strength' | 'growth') => {
        if (type === 'strength') {
            const newStrengths = new Set(currentStrengths);
            if(newStrengths.has(skill)) newStrengths.delete(skill);
            else newStrengths.add(skill);
            setCurrentStrengths(newStrengths);
        } else {
            const newGrowth = new Set(currentGrowth);
            if(newGrowth.has(skill)) newGrowth.delete(skill);
            else newGrowth.add(skill);
            setCurrentGrowth(newGrowth);
        }
    }
    
    const handleAddSuggestionToGrowth = (skill: string) => {
        const newGrowth = new Set(currentGrowth);
        newGrowth.add(skill);
        setCurrentGrowth(newGrowth);
    }

    const handleSave = () => {
        onSave(Array.from(currentStrengths), Array.from(currentGrowth));
        onClose();
    }

    const suggestedButNotAdded = (user.suggestedGrowthAreas || []).filter(s => !currentGrowth.has(s));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Strengths & Growth Areas</h2>
                </div>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {suggestedButNotAdded.length > 0 && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h4 className="font-semibold text-purple-800">Suggestions from Leadership</h4>
                            <p className="text-sm text-purple-700 mb-2">Your team leaders have suggested focusing on these areas. Click to add them to your personal growth plan.</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedButNotAdded.map(skill => (
                                    <button key={skill} onClick={() => handleAddSuggestionToGrowth(skill)} className="px-3 py-1 bg-purple-200 text-purple-800 text-sm font-semibold rounded-full hover:bg-purple-300">
                                        + {skill}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">My Strengths</h3>
                            <div className="space-y-2">
                               {ALL_SKILLS.map(skill => (
                                   <label key={skill} className="flex items-center p-2 bg-gray-50 rounded-md">
                                       <input type="checkbox" checked={currentStrengths.has(skill)} onChange={() => handleToggle(skill, 'strength')} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                                       <span className="ml-2 text-sm text-gray-800">{skill}</span>
                                   </label>
                               ))}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Areas for Growth</h3>
                            <div className="space-y-2">
                               {ALL_SKILLS.map(skill => (
                                   <label key={skill} className="flex items-center p-2 bg-gray-50 rounded-md">
                                       <input type="checkbox" checked={currentGrowth.has(skill)} onChange={() => handleToggle(skill, 'growth')} className="h-4 w-4 text-brand-secondary border-gray-300 rounded focus:ring-brand-secondary" />
                                       <span className="ml-2 text-sm text-gray-800">{skill}</span>
                                   </label>
                               ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save</button>
                </div>
            </div>
        </div>
    );
};


interface StrengthsGrowthCardProps {
    user: TeamMember;
    onUpdateUser: (user: TeamMember) => void;
}

export const StrengthsGrowthCard: React.FC<StrengthsGrowthCardProps> = ({ user, onUpdateUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleSave = (strengths: string[], growthAreas: string[]) => {
        onUpdateUser({ ...user, strengths, growthAreas });
    }

    const hasSuggestions = user.suggestedGrowthAreas && user.suggestedGrowthAreas.length > 0;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Strengths & Growth</h3>
                <button onClick={() => setIsModalOpen(true)} className="text-sm text-brand-primary hover:underline">
                    Edit
                </button>
            </div>
            
            {hasSuggestions && (
                 <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-800 text-sm">Suggestions from Leadership</h4>
                     <div className="flex flex-wrap gap-2 mt-1">
                       {user.suggestedGrowthAreas!.map(s => <span key={s} className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-200 text-purple-800">{s}</span>)}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">My Strengths</h4>
                    {(user.strengths && user.strengths.length > 0) ? (
                        <div className="flex flex-wrap gap-2">
                            {user.strengths.map(s => <span key={s} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{s}</span>)}
                        </div>
                    ) : <p className="text-sm text-gray-500 italic">No strengths selected.</p>}
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Areas for Growth</h4>
                    {(user.growthAreas && user.growthAreas.length > 0) ? (
                        <div className="flex flex-wrap gap-2">
                           {user.growthAreas.map(s => <span key={s} className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{s}</span>)}
                        </div>
                    ) : <p className="text-sm text-gray-500 italic">No growth areas selected.</p>}
                </div>
            </div>
             <StrengthsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                onSave={handleSave}
            />
        </div>
    );
};