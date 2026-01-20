import React, { useState, useEffect, useRef } from 'react';
import { useMockData } from './hooks/useMockData.ts';
import type { View, TeamType, TeamFeatures, SignUpDetails } from './types.ts';
import { Header } from './components/Header.tsx';
import { MyScheduleView } from './components/MyScheduleView.tsx';
import { ScheduleView } from './components/ScheduleView.tsx';
import { TeamView } from './components/TeamView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { ReviewView } from './components/ReviewView.tsx';
import { EncouragementView } from './components/EncouragementView.tsx';
import { FAQView } from './components/FAQView.tsx';
import { TrainingView } from './components/TrainingView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { ForgotPasswordView } from './components/ForgotPasswordView.tsx';
import { JoinTeamView } from './components/JoinTeamView.tsx';
import { SignUpView } from './components/SignUpView.tsx';
import { FloatingActionButton } from './components/FloatingActionButton.tsx';
import { AddShoutOutModal } from './components/AddShoutOutModal.tsx';
import { AddAnnouncementModal } from './components/AddAnnouncementModal.tsx';
import { EditEventModal } from './components/EditEventModal.tsx';
import { CreateTeamModal } from './components/CreateTeamModal.tsx';
import { BottomNavBar } from './components/BottomNavBar.tsx';
import { MoreMenuModal } from './components/MoreMenuModal.tsx';
import { shadeColor } from './utils/colors.ts';
import { AccessCodeView } from './components/AccessCodeView.tsx';
import { AdminRegistrationView } from './components/AdminRegistrationView.tsx';
import { ChildrenView } from './components/ChildrenView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { ConnectionStatus } from './components/ConnectionStatus.tsx';
import { ConfirmJoinModal } from './components/ConfirmJoinModal.tsx';

type AuthState = 
  | { status: 'logged-out'; screen: 'login'; message?: string }
  | { status: 'logged-out'; screen: 'forgot-password' }
  | { status: 'logged-out'; screen: 'join-team'; initialCode?: string | null; autoApprove?: boolean }
  | { status: 'logged-out'; screen: 'sign-up'; teamId: string; isAdmin: boolean; autoApprove?: boolean }
  | { status: 'setup'; screen: 'access-code' }
  | { status: 'setup'; screen: 'register-admin' };


const App: React.FC = () => {
    const data = useMockData();
    const [authState, setAuthState] = useState<AuthState | null>(null);
    const [activeView, setActiveView] = useState<View>('my-schedule');
    const [pendingJoin, setPendingJoin] = useState<{ teamId: string; isAdmin: boolean; autoApprove: boolean } | null>(null);
    const hasProcessedUrl = useRef(false);
    const [isCheckingInvite, setIsCheckingInvite] = useState(false);
    
    const [isShoutOutModalOpen, setIsShoutOutModalOpen] = useState(false);
    const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // 1. Initial URL Parameter Detection
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('join_code') || urlParams.get('demo')) {
            setIsCheckingInvite(true);
        }
    }, []);

    // 2. Process URL Parameters and Auth State
    useEffect(() => {
        if (!data.isDataLoaded) return; 

        // Scrub parameters once at start
        if (!hasProcessedUrl.current) {
            const urlParams = new URLSearchParams(window.location.search);
            const demoParam = urlParams.get('demo');
            const joinCode = urlParams.get('join_code');
            const autoApprove = urlParams.get('auto_approve') === 'true';

            if (demoParam === 'admin' || demoParam === 'member') {
                data.handleDemoMode(demoParam as 'admin' | 'member');
                hasProcessedUrl.current = true;
                window.history.replaceState({}, document.title, window.location.pathname);
                setIsCheckingInvite(false);
                return;
            }

            if (joinCode) {
                const teamId = data.handleJoinCode(joinCode);
                if (teamId) {
                    const isAdmin = data.isAdminCode(joinCode);
                    const isAlreadyMember = data.myTeams.some(t => t.id === teamId);
                    
                    if (isAlreadyMember) {
                        data.handleSwitchTeam(teamId);
                    } else if (data.currentUser) {
                        setPendingJoin({ teamId, isAdmin, autoApprove });
                    } else {
                        // User is NOT logged in and has a valid code - take them to sign up
                        setAuthState({ status: 'logged-out', screen: 'sign-up', teamId, isAdmin, autoApprove });
                    }
                } else {
                    alert("This invite link has expired or is invalid. Links are valid for 24 hours.");
                    // Fallback to default state below
                }
                hasProcessedUrl.current = true;
                window.history.replaceState({}, document.title, window.location.pathname);
                setIsCheckingInvite(false);
                return;
            }
            hasProcessedUrl.current = true;
            setIsCheckingInvite(false);
        }

        // Handle standard auth states IF we aren't currently routing an invite
        if (!isCheckingInvite) {
            if (data.isDemoMode) { 
                setAuthState(null); 
                return; 
            }

            if (data.allTeams.length === 0 && !data.currentUser) {
                setAuthState({ status: 'setup', screen: 'access-code' });
                return;
            }

            if (!data.currentUser && !authState) {
                setAuthState({ status: 'logged-out', screen: 'login' });
            }
        }
    }, [data.isDataLoaded, data.isDemoMode, data.allTeams.length, data.currentUser, data.myTeams.length, isCheckingInvite]);

    useEffect(() => {
        const root = document.documentElement;
        const primaryDefault = '#0d9488';
        if (data.currentTeam?.brandColors) {
            const primary = data.currentTeam.brandColors.primary;
            const secondary = data.currentTeam.brandColors.secondary;
            root.style.setProperty('--brand-primary', primary);
            root.style.setProperty('--brand-primary-dark', shadeColor(primary, -15));
            root.style.setProperty('--brand-secondary', secondary);
            root.style.setProperty('--brand-secondary-dark', shadeColor(secondary, -15));
            root.style.setProperty('--brand-light', shadeColor(primary, 88));
            root.style.setProperty('--brand-dark', shadeColor(primary, -60));
        } else {
            root.style.setProperty('--brand-primary', primaryDefault);
            root.style.setProperty('--brand-primary-dark', '#0f766e');
            root.style.setProperty('--brand-secondary', '#f59e0b');
            root.style.setProperty('--brand-secondary-dark', '#d97706');
            root.style.setProperty('--brand-light', '#f0fdfa');
            root.style.setProperty('--brand-dark', '#134e4a');
        }
    }, [data.currentTeam]);

    if (!data.isDataLoaded || isCheckingInvite) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 bg-brand-primary opacity-20 mx-auto"></div>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto relative bg-brand-light"></div>
                    </div>
                    <p className="mt-6 text-brand-dark font-black uppercase tracking-widest text-[10px]">
                        {isCheckingInvite ? 'Verifying Invite Code...' : 'Synchronizing Team Data...'}
                    </p>
                </div>
            </div>
        );
    }

    if (!data.isDemoMode && authState?.status === 'setup') {
        switch (authState.screen) {
            case 'access-code':
                return <AccessCodeView onAccessGranted={(code) => { if (code === 'SETUPNOW') { setAuthState({ status: 'setup', screen: 'register-admin' }); return true; } return false; }} onNoCodeClick={() => setAuthState({ status: 'logged-out', screen: 'login' })} onDemoClick={data.handleDemoMode} />;
            case 'register-admin':
                return <AdminRegistrationView onRegister={data.handleAdminRegistration} onRegistrationComplete={() => setAuthState({ status: 'logged-out', screen: 'login', message: 'Team created! Please sign in.' })} onBack={() => setAuthState({ status: 'setup', screen: 'access-code' })} />;
        }
    }

    if (!data.isDemoMode && !data.currentUser) {
        if (!authState) return null;
        switch (authState.screen) {
            case 'login':
                return <LoginView onLogin={data.handleLogin} onForgotPasswordClick={() => setAuthState({ status: 'logged-out', screen: 'forgot-password' })} onRequestAccessClick={() => setAuthState({ status: 'logged-out', screen: 'join-team' })} successMessage={authState.message} onBackToSetupClick={() => setAuthState({ status: 'setup', screen: 'access-code' })} />;
            case 'forgot-password':
                return <ForgotPasswordView onSendResetEmail={data.handleForgotPassword} onCancel={() => setAuthState({ status: 'logged-out', screen: 'login' })} />;
            case 'join-team':
                return <JoinTeamView onJoin={async (code) => { const teamId = data.handleJoinCode(code); if (teamId) { setAuthState({ status: 'logged-out', screen: 'sign-up', teamId, isAdmin: data.isAdminCode(code), autoApprove: false }); return true; } return false; }} onBackToLogin={() => setAuthState({ status: 'logged-out', screen: 'login' })} initialCode={authState.initialCode || null} />;
            case 'sign-up':
                 const teamToJoin = data.allTeams.find(t => t.id === authState.teamId);
                 if (!teamToJoin) return <div className="min-h-screen flex items-center justify-center p-4"><div className="bg-white p-8 rounded-lg shadow-xl text-center"><h2 className="text-xl font-bold mb-2 text-red-600">Team Not Found</h2><p className="text-gray-600 mb-4">This link may be broken or the team has been deleted.</p><button onClick={() => setAuthState({status: 'logged-out', screen: 'login'})} className="text-brand-primary font-bold hover:underline">Return to Login</button></div></div>;
                 return <SignUpView teamToJoin={teamToJoin} onSignUp={(details: SignUpDetails, password) => data.handleSignUp(details, password, authState.teamId, authState.isAdmin, authState.autoApprove)} onBackToLogin={() => setAuthState({ status: 'logged-out', screen: 'login', message: "Account created! Please sign in." })} isAdminSignUp={authState.isAdmin} />;
            default:
                return <div className="p-20 text-center">Authentication Error</div>;
        }
    }

    const features = data.currentTeam?.features || { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false };
    const pendingMemberCount = data.currentTeam?.members.filter(m => m.status === 'pending-approval').length || 0;

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <Header 
                currentUser={data.currentUser!} 
                setCurrentView={setActiveView} 
                activeView={activeView} 
                onLogout={data.handleLogout} 
                currentTeam={data.currentTeam!} 
                myTeams={data.myTeams} 
                onSwitchTeam={data.handleSwitchTeam} 
                onCreateTeam={() => setIsCreateTeamModalOpen(true)} 
                pendingMemberCount={pendingMemberCount} 
                isDemoMode={data.isDemoMode}
                onMarkAsRead={data.handleMarkAsRead}
            />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="animate-fade-in">
                    {(() => {
                        switch (activeView) {
                            case 'my-schedule': return <MyScheduleView serviceEvents={data.currentTeam!.serviceEvents} roles={data.currentTeam!.roles} currentUser={data.currentUser!} teamMembers={data.currentTeam!.members} onCheckIn={data.handleCheckIn} onUpdateEvent={data.handleUpdateEvent} onRemoveAnnouncement={data.handleRemoveAnnouncement} currentTeam={data.currentTeam!} onAddPrayerPoint={data.handleAddPrayerPoint} onRemovePrayerPoint={data.handleRemovePrayerPoint} onAddAnnouncement={data.handleAddAnnouncement} onMarkAsRead={data.handleMarkAsRead} pendingMemberCount={pendingMemberCount} onNavigateToTeam={() => setActiveView('team')} />;
                            case 'full-schedule': return <ScheduleView serviceEvents={data.currentTeam!.serviceEvents} currentTeam={data.currentTeam!} onUpdateEvent={data.handleUpdateEvent} onDeleteEvent={data.handleDeleteEvent} currentUser={data.currentUser!} />;
                            case 'team': return <TeamView team={data.currentTeam!} serviceEvents={data.currentTeam!.serviceEvents} currentUser={data.currentUser!} onUpdateTeam={data.handleUpdateTeam} onUpdateMember={data.handleUpdateMember} onRemoveMember={data.handleRemoveMember} onResetTeam={data.handleResetTeam} onDeleteTeam={data.handleDeleteTeam} onRefreshInvites={data.handleRefreshInviteCodes} />;
                            case 'profile': return <ProfileView currentUser={data.currentUser!} onUpdateUser={data.handleUpdateCurrentUser} onLeaveTeam={data.handleLeaveTeam} serviceEvents={data.currentTeam!.serviceEvents} currentTeam={data.currentTeam!} />;
                            case 'children': return <ChildrenView team={data.currentTeam!} currentUser={data.currentUser!} onAddChild={data.handleAddChild} onUpdateChild={data.handleUpdateChild} onDeleteChild={data.handleDeleteChild} onCheckIn={data.handleChildCheckIn} onCheckOut={data.handleChildCheckOut} />;
                            case 'inventory': return <InventoryView team={data.currentTeam!} currentUser={data.currentUser!} onAddInventoryItem={data.handleAddInventoryItem} onUpdateInventoryItem={data.handleUpdateInventoryItem} onDeleteInventoryItem={data.handleDeleteInventoryItem} onCheckOutItem={data.handleCheckOutItem} onCheckInItem={data.handleCheckInItem} />;
                            case 'reports': return <ReportsView serviceEvents={data.currentTeam!.serviceEvents} teamMembers={data.currentTeam!.members} currentTeam={data.currentTeam!} currentUser={data.currentUser!} />;
                            case 'review': return <ReviewView team={data.currentTeam!} onAddAnalysis={data.handleAddVideoAnalysis} currentUser={data.currentUser!} />;
                            case 'training': return <TrainingView team={data.currentTeam!} currentUser={data.currentUser!} onAddVideo={data.handleAddTrainingVideo} onUpdateVideo={data.handleUpdateTrainingVideo} onDeleteVideo={data.handleDeleteTrainingVideo} />;
                            case 'encouragement': return <EncouragementView team={data.currentTeam!} currentUser={data.currentUser!} />;
                            case 'faq': return <FAQView team={data.currentTeam!} currentUser={data.currentUser!} onAddFaqItem={data.handleAddFaq} onUpdateFaqItem={data.handleUpdateFaq} onDeleteFaqItem={data.handleDeleteFaq} />;
                            default: return <div className="text-center py-20 text-gray-500">View Not Found</div>;
                        }
                    })()}
                </div>
            </main>
            <FloatingActionButton currentUser={data.currentUser!} onShoutOutClick={() => setIsShoutOutModalOpen(true)} onNewEventClick={() => setIsNewEventModalOpen(true)} onNewAnnouncementClick={() => setIsAnnouncementModalOpen(true)} />
            <BottomNavBar activeView={activeView} setCurrentView={setActiveView} onMoreClick={() => setIsMoreMenuOpen(true)} pendingMemberCount={pendingMemberCount} />
            <ConnectionStatus />
            <ConfirmJoinModal isOpen={!!pendingJoin} onClose={() => setPendingJoin(null)} teamName={data.allTeams.find(t => t.id === pendingJoin?.teamId)?.name || ''} onConfirm={async () => { if (pendingJoin) { await data.handleSignUp({ name: data.currentUser!.name, email: data.currentUser!.email, username: data.currentUser!.username }, '', pendingJoin.teamId, pendingJoin.isAdmin, pendingJoin.autoApprove); data.handleSwitchTeam(pendingJoin.teamId); setPendingJoin(null); } }} />
            <AddShoutOutModal isOpen={isShoutOutModalOpen} onClose={() => setIsShoutOutModalOpen(false)} onSave={data.handleAddShoutOut} teamMembers={data.currentTeam!.members} />
            <AddAnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} onSave={data.handleAddAnnouncement} />
            <EditEventModal isOpen={isNewEventModalOpen} onClose={() => setIsNewEventModalOpen(false)} event={null} allRoles={data.currentTeam!.roles} onSave={data.handleUpdateEvent} savedLocations={data.currentTeam!.savedLocations || []} savedAttireThemes={data.currentTeam!.savedAttireThemes || []} showAttire={features.attire} />
            <CreateTeamModal isOpen={isCreateTeamModalOpen} onClose={() => setIsCreateTeamModalOpen(false)} onCreateTeam={data.handleCreateTeam} />
            {isMoreMenuOpen && <MoreMenuModal onClose={() => setIsMoreMenuOpen(false)} setCurrentView={setActiveView} activeView={activeView} features={features} />}
        </div>
    );
};

export default App;