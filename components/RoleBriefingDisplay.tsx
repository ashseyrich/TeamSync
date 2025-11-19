import React, { useState } from 'react';
import type { Briefing } from '../types.ts';

interface RoleBriefingDisplayProps {
  briefing: Briefing;
}

const BriefingSection: React.FC<{ title: string; items: string[]; icon: React.ReactNode }> = ({ title, items, icon }) => (
    <div>
        <h5 className="font-semibold text-gray-700 text-xs uppercase flex items-center gap-1.5">
            {icon}
            {title}
        </h5>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-800 mt-1 pl-2">
            {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
    </div>
);

export const RoleBriefingDisplay: React.FC<RoleBriefingDisplayProps> = ({ briefing }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!briefing) return null;

    return (
        <div className="mt-2 border-t pt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-sm font-semibold text-brand-primary"
            >
                {isOpen ? 'Hide Briefing' : 'Show Briefing'}
                 <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                 <div className="mt-2 space-y-3 animate-fade-in">
                    <BriefingSection
                        title="Key Focus Points"
                        items={briefing.keyFocusPoints}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" /></svg>}
                    />
                    <BriefingSection
                        title="Potential Challenges"
                        items={briefing.potentialChallenges}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                    />
                    <BriefingSection
                        title="Communication Cues"
                        items={briefing.communicationCues}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V4zm-3 7a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM5 11a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1zm6 0a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1z" /></svg>}
                    />
                </div>
            )}
        </div>
    );
};
