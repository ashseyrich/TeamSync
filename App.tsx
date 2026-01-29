
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
import { shadeColor, isDark } from './utils/colors.ts';
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
    
    const [isShoutOutModalOpen, setIsShoutOutModalOpen] = useState(false);
    const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    useEffect(() => {
        if (!data.isDataLoaded) return; 
        if (!hasProcessedUrl.current) {
            const urlParams = new URLSearchParams(window.location.search);
            const demoParam = urlParams.get('demo');
            const joinCode = urlParams.get('join_code');
            const autoApprove = urlParams.get('auto_approve') === 'true';

            if (demoParam === 'admin' || demoParam === 'member') {
                data.handleDemoMode(demoParam as 'admin' | 'member');
                hasProcessedUrl.current = true;
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }

            if (joinCode) {
                const teamId = data.handleJoinCode(joinCode);
                if (teamId) {
                    const isAdmin = data.isAdminCode(joinCode);
                    if (data.myTeams.some(t => t.id === teamId)) {
                        data.handleSwitchTeam(teamId);
                    } else if (data.currentUser) {
                        setPendingJoin({ teamId, isAdmin, autoApprove });
                    } else {
                        setAuthState({ status: 'logged-out', screen: 'sign-up', teamId, isAdmin, autoApprove });
                    }
                }
                hasProcessedUrl.current = true;
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            hasProcessedUrl.current = true;
        }

        if (data.isDemoMode) { setAuthState(null); return; }
        if (data.allTeams.length === 0 && !data.currentUser) { setAuthState({ status: 'setup', screen: 'access-code' }); return; }
        if (!data.currentUser && !authState) setAuthState({ status: 'logged-out', screen: 'login' });
    }, [data.isDataLoaded, data.isDemoMode, data.allTeams.length, data.currentUser, data.myTeams.length]);

    useEffect(() => {
        const root = document.documentElement;
        const primary = data.currentTeam?.brandColors?.primary || '#0d9488';
        const secondary = data.currentTeam?.brandColors?.secondary || '#f59e0b';
        const lightBg = shadeColor(primary, 96); 
        const bgIsDark = isDark(lightBg);
        root.style.setProperty('--brand-primary', primary);
        root.style.setProperty('--brand-primary-dark', shadeColor(primary, -15));
        root.style.setProperty('--brand-secondary', secondary);
        root.style.setProperty('--brand-secondary-dark', shadeColor(secondary, -15));
        root.style.setProperty('--brand-light', lightBg);
        root.style.setProperty('--text-main', bgIsDark ? '#ffffff' : '#111827');
        root.style.setProperty('--text-muted', bgIsDark ? '#cbd5e1' : '#4b5563');
        root.style.setProperty('--bg-card', bgIsDark ? shadeColor(lightBg, 5) : '#ffffff');
    }, [data.currentTeam]);

    if (!data.isDataLoaded) return <div className="min-h-screen bg-brand-light flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-brand-primary animate-pulse">Syncing...</div>;

    if (!data.isDemoMode && authState?.status === 'setup') {
        switch (authState.screen) {
            case 'access-code': return <AccessCodeView onAccessGranted={(c) => { if (c === 'SETUPNOW') { setAuthState({ status: 'setup', screen: 'register-admin' }); return true; } return false; }} onNoCodeClick={() => setAuthState({ status: 'logged-out', screen: 'login' })} onDemoClick={data.handleDemoMode} />;
            case 'register-admin': return <AdminRegistrationView onRegister={data.handleAdminRegistration} onRegistrationComplete={() => setAuthState({ status: 'logged-out', screen: 'login', message: 'Ready! Please sign in.' })} onBack={() => setAuthState({ status: 'setup', screen: 'access-code' })} />;
        }
    }

    if (!data.isDemoMode && !data.currentUser) {
        if (!authState) return null;
        switch (authState.screen) {
            case 'login': return <LoginView onLogin={data.handleLogin} onForgotPasswordClick={() => setAuthState({ status: 'logged-out', screen: 'forgot-password' })} onRequestAccessClick={() => setAuthState({ status: 'logged-out', screen: 'join-team' })} successMessage={authState.message} onBackToSetupClick={() => setAuthState({ status: 'setup', screen: 'access-code' })} />;
            case 'forgot-password': return <ForgotPasswordView onSendResetEmail={data.handleForgotPassword} onCancel={() => setAuthState({ status: 'logged-out', screen: 'login' })} />;
            case 'join-team': return <JoinTeamView onJoin={async (c) => { const tid = data.handleJoinCode(c); if (tid) { setAuthState({ status: 'logged-out', screen: 'sign-up', teamId: tid, isAdmin: data.isAdminCode(c), autoApprove: false }); return true; } return false; }} onBackToLogin={() => setAuthState({ status: 'logged-out', screen: 'login' })} initialCode={authState.initialCode || null} />;
            case 'sign-up': 
                const t = data.allTeams.find(x => x.id === authState.teamId);
                if (!t) return <div className="p-10 text-center font-bold">Team Expired</div>;
                return <SignUpView teamToJoin={t} onSignUp={(d, p) => data.handleSignUp(d, p, authState.teamId, authState.isAdmin, authState.autoApprove)} onBackToLogin={() => setAuthState({ status: 'logged-out', screen: 'login' })} isAdminSignUp={authState.isAdmin} />;
        }
    }

    const pendingCount = data.currentTeam?.members.filter(m => m.status === 'pending-approval').length || 0;

    return (
        <div className="min-h-screen bg-brand-light flex flex-col">
            <Header 
              currentUser={data.currentUser!} 
              setCurrentView={setActiveView} 
              activeView={activeView} 
              onLogout={data.handleLogout} 
              currentTeam={data.currentTeam!} 
              myTeams={data.myTeams} 
              onSwitchTeam={data.handleSwitchTeam} 
              onCreateTeam={() => setIsCreateTeamModalOpen(true)} 
              pendingMemberCount={pendingCount} 
              isDemoMode={data.isDemoMode} 
              onMarkAsRead={data.handleMarkAsRead} 
              onNavigate={setActiveView}
            />
            <main className="flex-grow max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 pb-32 md:pb-6">
                <div className="animate-fade-in">
                    {(() => {
                        switch (activeView) {
                            case 'my-schedule': return <MyScheduleView 
                                serviceEvents={data.currentTeam!.serviceEvents} 
                                roles={data.currentTeam!.roles} 
                                currentUser={data.currentUser!} 
                                teamMembers={data.currentTeam!.members} 
                                onCheckIn={data.handleCheckIn} 
                                onUpdateEvent={data.handleUpdateEvent} 
                                onUpdateAssignmentStatus={data.handleUpdateAssignmentStatus} 
                                onRemoveAnnouncement={data.handleRemoveAnnouncement} 
                                currentTeam={data.currentTeam!} 
                                onAddPrayerPoint={data.handleAddPrayerPoint} 
                                onRemovePrayerPoint={data.handleRemovePrayerPoint} 
                                onMarkAsRead={data.handleMarkAsRead} 
                                onToggleIndividualTask={data.handleToggleChecklistItem}
                                onToggleCorporateTask={data.handleToggleCorporateTask}
                                pendingMemberCount={pendingCount} 
                                onNavigateToTeam={() => setActiveView('team')} 
                                onNavigate={setActiveView}
                            />;
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
                            default: return null;
                        }
                    })()}
                </div>
            </main>
            <FloatingActionButton currentUser={data.currentUser!} onShoutOutClick={() => setIsShoutOutModalOpen(true)} onNewEventClick={() => setIsNewEventModalOpen(true)} onNewAnnouncementClick={() => setIsAnnouncementModalOpen(true)} />
            <BottomNavBar activeView={activeView} setCurrentView={setActiveView} onMoreClick={() => setIsMoreMenuOpen(true)} pendingMemberCount={pendingCount} />
            <ConnectionStatus />
            <ConfirmJoinModal isOpen={!!pendingJoin} onClose={() => setPendingJoin(null)} teamName={data.allTeams.find(t => t.id === pendingJoin?.teamId)?.name || ''} onConfirm={async () => { if (pendingJoin) { await data.handleSignUp({ name: data.currentUser!.name, email: data.currentUser!.email, username: data.currentUser!.username }, '', pendingJoin.teamId, pendingJoin.isAdmin, pendingJoin.autoApprove); data.handleSwitchTeam(pendingJoin.teamId); setPendingJoin(null); } }} />
            <AddShoutOutModal isOpen={isShoutOutModalOpen} onClose={() => setIsShoutOutModalOpen(false)} onSave={data.handleAddShoutOut} teamMembers={data.currentTeam!.members} />
            <AddAnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} onSave={data.handleAddAnnouncement} />
            <EditEventModal 
                isOpen={isNewEventModalOpen} 
                onClose={() => setIsNewEventModalOpen(false)} 
                event={null} 
                allRoles={data.currentTeam!.roles} 
                onSave={data.handleUpdateEvent} 
                savedLocations={data.currentTeam!.savedLocations || []} 
                savedAttireThemes={data.currentTeam!.savedAttireThemes || []} 
                showAttire={data.currentTeam!.features.attire}
                teamCorporateChecklist={data.currentTeam!.corporateChecklist}
            />
            <CreateTeamModal isOpen={isCreateTeamModalOpen} onClose={() => setIsCreateTeamModalOpen(false)} onCreateTeam={data.handleCreateTeam} />
            {isMoreMenuOpen && <MoreMenuModal onClose={() => setIsMoreMenuOpen(false)} setCurrentView={setActiveView} activeView={activeView} features={data.currentTeam!.features} />}
        </div>
    );
};

export default App;
