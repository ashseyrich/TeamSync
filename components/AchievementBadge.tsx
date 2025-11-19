
import React from 'react';
// FIX: Corrected import path for types module by adding file extension.
import type { Achievement } from '../types.ts';

const iconMap: Record<Achievement['icon'], React.ReactNode> = {
  trophy: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.12 2.59a1 1 0 00-2.24 0l-1.12 4.47-4.47 1.12a1 1 0 000 2.24l4.47 1.12 1.12 4.47a1 1 0 002.24 0l1.12-4.47 4.47-1.12a1 1 0 000-2.24l-4.47-1.12-1.12-4.47zM15 15.01a1 1 0 00-1-1h-4a1 1 0 100 2h4a1 1 0 001-1z" clipRule="evenodd" /></svg>,
  star: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  sound: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 3a1 1 0 000 2v1a1 1 0 001 1h1a1 1 0 100-2H8V3zM6 8a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm2 5a1 1 0 100-2H7a1 1 0 100 2h1zm2-2a1 1 0 11-2 0 1 1 0 012 0zm1 1a1 1 0 10-2 0 1 1 0 002 0zM12 9a1 1 0 11-2 0 1 1 0 012 0zm1-3a1 1 0 10-2 0 1 1 0 002 0zM9 5a1 1 0 11-2 0 1 1 0 012 0zM5 8a1 1 0 100-2 1 1 0 000 2zM6 5a1 1 0 11-2 0 1 1 0 012 0zm1-1a1 1 0 10-2 0 1 1 0 002 0zM15 8a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 10-2 0 1 1 0 002 0zm1-3a1 1 0 11-2 0 1 1 0 012 0zm0 5a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" /></svg>,
  camera: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-4.586l-1.707-1.707A2 2 0 008 2H6a2 2 0 00-2 2z" clipRule="evenodd" /></svg>,
  presentation: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.333a1 1 0 01-2 0V3a1 1 0 011-1zm0 14a1 1 0 01-1-1v-1.333a1 1 0 112 0V17a1 1 0 01-1 1zm-5.333-3.667a1 1 0 011.333 0l1.417 1.416a1 1 0 11-1.416 1.417L4.25 14.75a1 1 0 010-1.417zm1.417-9.75a1 1 0 010 1.417L4.25 5.25a1 1 0 11-1.417-1.416l1.417-1.417a1 1 0 011.416 0zm12.083 9.75a1 1 0 01-1.416 0l-1.417-1.416a1 1 0 111.416-1.417l1.417 1.417a1 1 0 010 1.416zM14.75 4.25a1 1 0 011.417 0l1.416 1.417a1 1 0 11-1.416 1.416L14.75 5.667a1 1 0 010-1.417zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>,
  video: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>,
};


interface AchievementBadgeProps {
  achievement: Achievement;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement }) => {
  return (
    <div className="relative group flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center border-2 border-yellow-200">
            {iconMap[achievement.icon]}
        </div>
        <p className="text-xs font-semibold text-gray-700 mt-1">{achievement.name}</p>
        <div className="absolute bottom-full mb-2 w-48 p-2 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {achievement.description}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
        </div>
    </div>
  );
};