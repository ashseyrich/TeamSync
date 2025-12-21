import React, { useState } from 'react';
import type { TeamMember, Team, View } from '../types.ts';
import { NotificationDropdown } from './NotificationDropdown.tsx';
import { Avatar } from './Avatar.tsx';
import { PageGuide } from './PageGuide.tsx';

interface HeaderProps {
  currentUser: TeamMember;
  setCurrentView: (view: View) => void;
  activeView: View;
  onLogout: () => void;
  currentTeam: Team | undefined;
  myTeams: Team[];
  onSwitchTeam: (teamId: string) => void;
  onCreateTeam: () => void;
  pendingMemberCount?: number;
  isDemoMode?: boolean;
}

const NavLink: React.FC<{
    view: View,
    activeView: View,
    setCurrentView: (view: View) => void,
    children: React.ReactNode,
    badgeCount?: number;
}> = ({ view, activeView, setCurrentView, children, badgeCount }) => {
    const isActive = view === activeView;
    return (
        <button
            onClick={() => setCurrentView(view)}
            className={`relative px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-brand-primary text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
            {children}
            {badgeCount && badgeCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {badgeCount}
                </span>
            ) : null}
        </button>
    );
}

const TeamSwitcher: React.FC<{
    currentTeam: Team;
    myTeams: Team[];
    onSwitchTeam: (teamId: string) => void;
    onCreateTeam: () => void;
    isAdmin: boolean;
}> = ({ currentTeam, myTeams, onSwitchTeam, onCreateTeam, isAdmin }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelectTeam = (teamId: string) => {
        onSwitchTeam(teamId);
        setIsOpen(false);
    };

    const handleCreateTeam = () => {
        onCreateTeam();
        setIsOpen(false);
    };

    const canSwitchTeams = myTeams.length > 1;

    if (!canSwitchTeams && !isAdmin) {
        return <h1 className="text-xl font-bold text-brand-primary truncate max-w-[200px] md:max-w-none">{currentTeam.name}</h1>;
    }

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 max-w-[200px] md:max-w-xs">
                <h1 className="text-xl font-bold text-brand-primary truncate">{currentTeam.name}</h1>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                 <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {canSwitchTeams && myTeams.map(team => (
                            <button key={team.id} onClick={() => handleSelectTeam(team.id)} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 truncate">{team.name}</button>
                        ))}
                        {isAdmin && canSwitchTeams && <div className="border-t my-1"></div>}
                        {isAdmin && <button onClick={handleCreateTeam} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold">+ Create New Team</button>}
                    </div>
                 </div>
            )}
        </div>
    );
}

export const Header: React.FC<HeaderProps> = ({ currentUser, setCurrentView, activeView, onLogout, currentTeam, myTeams, onSwitchTeam, onCreateTeam, pendingMemberCount, isDemoMode }) => {
  const isAdmin = currentUser.permissions.includes('admin');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const features = currentTeam?.features || { videoAnalysis: true, training: true, attire: true, childCheckIn: false, inventory: false };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      {isDemoMode && (
          <div className="bg-brand-secondary text-white text-[10px] font-bold uppercase py-1 px-4 text-center tracking-widest animate-pulse">
              Demo Mode: Data is saved only to this device and not shared.
          </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {currentTeam && myTeams.length > 0 ? (
                 <TeamSwitcher currentTeam={currentTeam} myTeams={myTeams} onSwitchTeam={onSwitchTeam} onCreateTeam={onCreateTeam} isAdmin={isAdmin} />
            ) : (
                <h1 className="text-xl font-bold text-brand-primary">{currentTeam?.name || 'TeamSync'}</h1>
            )}

            <nav className="hidden md:flex ml-10 space-x-4 overflow-x-auto pb-1 md:pb-0">
                <NavLink view="my-schedule" activeView={activeView} setCurrentView={setCurrentView}>My Schedule</NavLink>
                {features.childCheckIn && <NavLink view="children" activeView={activeView} setCurrentView={setCurrentView}>Kids Check-in</NavLink>}
                <NavLink view="full-schedule" activeView={activeView} setCurrentView={setCurrentView}>Full Schedule</NavLink>
                <NavLink view="team" activeView={activeView} setCurrentView={setCurrentView} badgeCount={isAdmin ? pendingMemberCount : 0}>Team</NavLink>
                {features.inventory && <NavLink view="inventory" activeView={activeView} setCurrentView={setCurrentView}>Inventory</NavLink>}
                {!features.childCheckIn && <NavLink view="reports" activeView={activeView} setCurrentView={setCurrentView}>Reports</NavLink>}
                {features.videoAnalysis && <NavLink view="review" activeView={activeView} setCurrentView={setCurrentView}>AI Review</NavLink>}
                {features.training && <NavLink view="training" activeView={activeView} setCurrentView={setCurrentView}>Training</NavLink>}
                {!features.childCheckIn && <NavLink view="encouragement" activeView={activeView} setCurrentView={setCurrentView}>Encouragement</NavLink>}
                {!features.childCheckIn && <NavLink view="faq" activeView={activeView} setCurrentView={setCurrentView}>FAQ</NavLink>}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && myTeams.length === 0 && <button onClick={onCreateTeam} className="text-sm font-semibold text-brand-primary hover:underline hidden sm:block">+ Create New Team</button>}
            <PageGuide view={activeView} currentUser={currentUser} />
            <NotificationDropdown />
            
            <div className="hidden md:flex items-center">
                <div className="text-right mr-3">
                    <div className="text-sm font-medium text-gray-800">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">{currentUser.permissions.includes('admin') ? 'Admin' : currentUser.permissions.includes('scheduler') ? 'Scheduler' : 'Team Member'}</div>
                </div>
                <button onClick={() => setCurrentView('profile')} className="rounded-full hover:opacity-80 transition-opacity">
                    <Avatar avatarUrl={currentUser.avatarUrl} name={currentUser.name} sizeClassName="h-10 w-10" />
                </button>
                <div className="border-l border-gray-300 h-8 mx-3"></div>
                <button 
                    onClick={onLogout} 
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Log Out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
            
            <div className="md:hidden relative ml-2">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                    <Avatar avatarUrl={currentUser.avatarUrl} name={currentUser.name} sizeClassName="h-10 w-10" />
                </button>
                {isUserMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            <div className="px-4 py-3 border-b">
                                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser.permissions.includes('admin') ? 'Admin' : currentUser.permissions.includes('scheduler') ? 'Scheduler' : 'Team Member'}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setCurrentView('profile');
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                My Profile
                            </button>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {isDemoMode ? 'Exit Demo' : 'Log Out'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};