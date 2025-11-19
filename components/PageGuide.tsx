import React, { useState } from 'react';
import type { View, TeamMember } from '../types.ts';
import { InteractiveGuide } from './InteractiveGuide.tsx';

interface PageGuideProps {
    view: View;
    currentUser: TeamMember;
}

export const PageGuide: React.FC<PageGuideProps> = ({ view, currentUser }) => {
    const [isGuideActive, setIsGuideActive] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsGuideActive(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="What does this page do?"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {isGuideActive && (
                <InteractiveGuide
                    view={view}
                    currentUser={currentUser}
                    onClose={() => setIsGuideActive(false)}
                />
            )}
        </>
    );
};