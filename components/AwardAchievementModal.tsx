import React, { useState, useEffect } from 'react';
import type { Achievement, TeamMember } from '../types.ts';

const iconMap: Record<Achievement['icon'], React.ReactNode> = {
    trophy: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.12 2.59a1 1 0 00-2.24 0l-1.12 4.47-4.47 1.12a1 1 0 000 2.24l4.47 1.12 1.12 4.47a1 1 0 002.24 0l1.12-4.47 4.47-1.12a1 1 0 000-2.24l-4.47-1.12-1.12-4.47zM15 15.01a1 1 0 00-1-1h-4a1 1 0 100 2h4a1 1 0 001-1z" clipRule="evenodd" /></svg>,
    star: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
    sound: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 3a1 1 0 000 2v1a1 1 0 001 1h1a1 1 0 100-2H8V3zM6 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm2 5a1 1 0 100-2H7a1 1 0 100 2h1zm2-2a1 1 0 11-2 0 1 1 0 012 0zm1 1a1 1 0 10-2 0 1 1 0 002 0zM12 9a1 1 0 11-2 0 1 1 0 012 0zm1-3a1 1 0 10-2 0 1 1 0 002 0zM9 5a1 1 0 11-2 0 1 1 0 012 0zM5 8a1 1 0 100-2 1 1 0 000 2zM6 5a1 1 0 11-2 0 1 1 0 012 0zm1-1a1 1 0 10-2 0 1 1 0 002 0zM15 8a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 10-2 0 1 1 0 002 0zm1-3a1 1 0 11-2 0 1 1 0 012 0zm0 5a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" /></svg>,
    camera: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-4.586l-1.707-1.707A2 2 0 008 2H6a2 2 0 00-2 2z" clipRule="evenodd" /></svg>,
    presentation: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.333a1 1 0 01-2 0V3a1 1 0 011-1zm0 14a1 1 0 01-1-1v-1.333a1 1 0 112 0V17a1 1 0 01-1 1zm-5.333-3.667a1 1 0 011.333 0l1.417 1.416a1 1 0 11-1.416 1.417L4.25 14.75a1 1 0 010-1.417zm1.417-9.75a1 1 0 010 1.417L4.25 5.25a1 1 0 11-1.417-1.416l1.417-1.417a1 1 0 011.416 0zm12.083 9.75a1 1 0 01-1.416 0l-1.417-1.416a1 1 0 111.416-1.417l1.417 1.417a1 1 0 010 1.416zM14.75 4.25a1 1 0 011.417 0l1.416 1.417a1 1 0 11-1.416 1.416L14.75 5.667a1 1 0 010-1.417zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>,
    video: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>,
};


interface AwardAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  allAchievements: Achievement[];
  onSave: (awardedIds: string[]) => void;
}

export const AwardAchievementModal: React.FC<AwardAchievementModalProps> = ({ isOpen, onClose, member, allAchievements, onSave }) => {
    const [awardedIds, setAwardedIds] = useState(new Set<string>());
    
    useEffect(() => {
        if(isOpen) {
            setAwardedIds(new Set(member.awardedAchievements || []));
        }
    }, [isOpen, member.awardedAchievements]);


    if (!isOpen) return null;

    const handleToggleAchievement = (achievementId: string) => {
        const newIds = new Set(awardedIds);
        if (newIds.has(achievementId)) {
            newIds.delete(achievementId);
        } else {
            newIds.add(achievementId);
        }
        setAwardedIds(newIds);
    };
    
    const handleSaveChanges = () => {
        onSave(Array.from(awardedIds));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Award Achievements for <span className="text-brand-primary">{member.name}</span></h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-sm text-gray-600 mb-6">Select achievements to manually award to this team member. This is for special recognition beyond automatic awards.</p>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {allAchievements.map(ach => {
                        const isAwarded = awardedIds.has(ach.id);
                        return (
                            <div key={ach.id} className={`p-3 rounded-lg flex items-start gap-4 border cursor-pointer ${isAwarded ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} onClick={() => handleToggleAchievement(ach.id)}>
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center border-2 border-yellow-200">
                                    {iconMap[ach.icon]}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-bold text-gray-800">{ach.name}</h3>
                                    <p className="text-sm text-gray-600">{ach.description}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isAwarded}
                                        readOnly
                                        className="h-5 w-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveChanges} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Awards</button>
                </div>
            </div>
        </div>
    );
};