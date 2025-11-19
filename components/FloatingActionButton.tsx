import React, { useState } from 'react';
import type { TeamMember } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';

interface FloatingActionButtonProps {
    currentUser: TeamMember;
    onShoutOutClick: () => void;
    onNewEventClick: () => void;
    onNewAnnouncementClick: () => void;
}

const ActionButton: React.FC<{ label: string, icon: React.ReactNode, onClick: () => void }> = ({ label, icon, onClick }) => (
    <div className="flex items-center justify-end gap-3">
        <span className="bg-white text-sm text-gray-700 font-semibold px-3 py-1 rounded-md shadow-sm">{label}</span>
        <button
            onClick={onClick}
            className="w-12 h-12 rounded-full bg-white text-brand-primary flex items-center justify-center shadow-lg hover:bg-gray-100"
        >
            {icon}
        </button>
    </div>
);

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ currentUser, onShoutOutClick, onNewEventClick, onNewAnnouncementClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    const canAnnounce = hasPermission(currentUser, 'admin');
    const canSchedule = hasPermission(currentUser, 'scheduler');

    const actions = [
        {
            label: 'Give a Shout-Out',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            onClick: onShoutOutClick,
            isPermitted: true
        },
        {
            label: 'Create New Event',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            onClick: onNewEventClick,
            isPermitted: canSchedule
        },
        {
            label: 'Add Announcement',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18.668 1 19.382 1h.063c.636 0 1.09.588 1.09 1.214V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15m-3.566-2.091A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18.668 1 19.382 1h.063c.636 0 1.09.588 1.09 1.214V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15" /></svg>,
            onClick: onNewAnnouncementClick,
            isPermitted: canAnnounce
        },
    ].filter(a => a.isPermitted);
    
    if (actions.length === 0) return null;

    return (
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
            <div className="flex flex-col items-end gap-3">
                {isOpen && (
                    <div className="flex flex-col gap-3">
                        {actions.map(action => (
                            <ActionButton key={action.label} {...action} />
                        ))}
                    </div>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg hover:bg-brand-primary-dark transition-transform"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
};