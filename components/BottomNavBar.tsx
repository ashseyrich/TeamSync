
import React from 'react';
import type { View } from '../types.ts';

interface BottomNavBarProps {
  activeView: View;
  setCurrentView: (view: View) => void;
  onMoreClick: () => void;
  pendingMemberCount?: number;
}

interface NavItemProps {
    view?: View;
    label: string;
    icon: React.ReactNode;
    activeView: View;
    onClick: () => void;
    isActive: boolean;
    badgeCount?: number;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, onClick, isActive, badgeCount }) => {
    const colorClass = isActive ? 'text-brand-primary' : 'text-gray-500';

    return (
        <button
            onClick={onClick}
            className={`relative flex flex-col items-center justify-center w-full pt-2 pb-1 ${colorClass} hover:text-brand-primary transition-colors`}
            aria-label={label}
        >
            <div className="relative">
                {icon}
                {badgeCount && badgeCount > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {badgeCount}
                    </span>
                ) : null}
            </div>
            <span className="text-xs mt-1">{label}</span>
        </button>
    );
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setCurrentView, onMoreClick, pendingMemberCount }) => {
    
    const isMoreMenuActive = ['reports', 'review', 'training', 'encouragement', 'faq', 'children', 'inventory'].includes(activeView);
    
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="flex justify-around items-center h-16">
                <NavItem
                    label="My Schedule"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    activeView={activeView}
                    onClick={() => setCurrentView('my-schedule')}
                    isActive={activeView === 'my-schedule'}
                />
                 <NavItem
                    label="Schedule"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                    activeView={activeView}
                    onClick={() => setCurrentView('full-schedule')}
                    isActive={activeView === 'full-schedule'}
                />
                <NavItem
                    label="Team"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    activeView={activeView}
                    onClick={() => setCurrentView('team')}
                    isActive={activeView === 'team'}
                    badgeCount={pendingMemberCount}
                />
                 <NavItem
                    label="Profile"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    activeView={activeView}
                    onClick={() => setCurrentView('profile')}
                    isActive={activeView === 'profile'}
                />
                 <NavItem
                    label="More"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
                    activeView={activeView}
                    onClick={onMoreClick}
                    isActive={isMoreMenuActive}
                />
            </div>
        </nav>
    );
};
