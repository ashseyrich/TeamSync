
import React, { useState, useEffect } from 'react';
import { useMockData } from './hooks/useMockData.ts';
import type { View, TeamType, TeamFeatures } from './types.ts';
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
import { ResetPasswordView } from './components/ResetPasswordView.tsx';
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

type AuthState = 
  | { status: 'logged-out'; screen: 'login'; message?: string }
  | { status: 'logged-out'; screen: 'forgot-password' }
  | { status: 'logged-out'; screen: 'reset-password'; userId: string }
  | { status: 'logged-out'; screen: 'join-team'; initialCode?: string | null; autoApprove?: boolean }
  | { status: 'logged-out'; screen: 'sign-up'; teamId: string; isAdmin: boolean; autoApprove?: boolean }
  | { status: 'setup'; screen: 'access-code' }
  | { status: 'setup'; screen: 'register-admin' };


const App: React.FC = () => {
    const data = useMockData();
    const [authState, setAuthState] = useState<AuthState | null>(null);
    const [activeView, setActiveView] = useState<View>('my-schedule');
    
    // Modals
    const [isShoutOutModalOpen, setIsShoutOutModalOpen] = useState(false);
    const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    useEffect(() => {
        if (!data.isDataLoaded) return; // Wait for data to be loaded

        // This effect should only run once on load to set the initial state.
        if (authState !== null) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const joinCode = urlParams.get('join_code');
        const teamName = urlParams.get('team_name');
        const teamType = urlParams.get('team_type') as TeamType | null;
        const featuresParam = urlParams.get('features');
        const autoApprove = urlParams.get('auto_approve') === 'true';
        
        let features: TeamFeatures | undefined;
        if (featuresParam) {
            try {
                features = JSON.parse(decodeURIComponent(featuresParam));
            } catch (e) {
                console.error("Failed to parse features from URL", e);
            }
        }

        if (joinCode) {
            // If we have a team name, try to hydrate a stub team for new users
            if (teamName) {
                 data.handleExternalInvite(joinCode, teamName, teamType || 'general', features);
            }

            setAuthState({ status: 'logged-out', screen: 'join-team', initialCode: joinCode, autoApprove });
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        // If there are no teams and no invite code, it's a fresh setup.
        if (data.allTeams.length === 0) {
            setAuthState({ status: 'setup', screen: 'access-code' });
            return;
        }

        setAuthState({ status: 'logged-out', screen: 'login' });
    }, [data.isDataLoaded]);

    useEffect(() => {
        const root = document.documentElement;
        const primaryDefault = '#0d9488'; // Matches Tailwind's teal-600
        const secondaryDefault = '#f59e0b'; // Matches Tailwind's amber-500
        const lightDefault = '#f0fdfa'; // Matches Tailwind's teal-50
        const darkDefault = '#134e4a'; // Matches Tailwind's teal-900

        if (data.currentTeam?.brandColors) {
            const primary = data.currentTeam.brandColors.primary;
            const secondary = data.currentTeam.brandColors.secondary;
            
            root.style.setProperty('--brand-primary', primary);
            root.style.setProperty('--brand-primary-dark', shadeColor(primary, -15));
            root.style.setProperty('--brand-secondary', secondary);
            root.style.setProperty('--brand-secondary-dark', shadeColor(secondary, -15));
            root.style.setProperty('--brand-light', shadeColor(primary, 88)); // Very light tint for backgrounds
            root.style.setProperty('--brand-dark', shadeColor(primary, -60)); // Dark shade for text
        } else {
            // Revert to defaults if no custom colors are set or user logs out
            root.style.setProperty('--brand-primary', primaryDefault);
            root.style.setProperty('--brand-primary-dark', shadeColor(primaryDefault, -15));
            root.style.setProperty('--brand-secondary', secondaryDefault);
            root.style.setProperty('--brand-secondary-dark', shadeColor(secondaryDefault, -15));
            root.style.setProperty('--brand-light', lightDefault);
            root.style.setProperty('--brand-dark', darkDefault);
        }
    }, [data.currentTeam]);

    if (!authState) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    if (authState.status === 'setup') {
        switch (authState.screen) {
            case 'access-code':
                return <AccessCodeView 
                    onAccessGranted={(code) => {
                        // In a real app, this code would be validated. Here, we'll just check a mock code.
                        if (code === 'SETUPNOW') {
                            setAuthState({ status: 'setup', screen: 'register-admin' });
                            return true;
                        }
                        return false;
                    }}
                    onNoCodeClick={() => setAuthState({ status: 'logged-out', screen: 'login' })}
                />;
            case 'register-admin':
                return <AdminRegistrationView 
                    onRegister={data.handleAdminRegistration}
                    onRegistrationComplete={() => setAuthState({ status: 'logged-out', screen: 'login', message: 'Team created! Please log in.' })}
                />;
        }
    }


    if (!data.currentUser || !data.currentTeam) {
        // Not logged in
        switch (authState.screen) {
            case 'login':
                return <LoginView 
                    onLogin={data.handleLogin} 
                    onForgotPasswordClick={() => setAuthState({ status: 'logged-out', screen: 'forgot-password' })}
                    onRequestAccessClick={() => setAuthState({ status: 'logged-out', screen: 'join-team' })}
                    successMessage={authState.message}
                    onBackToSetupClick={() => setAuthState({ status: 'setup', screen: 'access-code' })}
                    onImportData={data.handleImportTeam}
                />;
            case 'forgot-password':
                return <ForgotPasswordView 
                    users={data.allUsers}
                    onUserFound={(user) => setAuthState({ status: 'logged-out', screen: 'reset-password', userId: user.id })}
                    onCancel={() => setAuthState({ status: 'logged-out', screen: 'login' })}
                />;
            case 'reset-password':
                 const userToReset = data.allUsers.find(u => u.id === authState.userId);
                 if (!userToReset) return <div>Error: User not found.</div>;
                 return <ResetPasswordView 
                    user={userToReset}
                    onPasswordReset={() => {
                        alert("Password reset successfully!");
                        setAuthState({ status: 'logged-out', screen: 'login' });
                    }}
                    onCancel={() => setAuthState({ status: 'logged-out', screen: 'login' })}
                 />
            case 'join-team':
                return <JoinTeamView 
                    onJoin={async (code) => {
                        const teamId = data.handleJoinCode(code);
                        // Retrieve autoApprove flag from current state
                        const isAutoApprove = (authState as any).autoApprove || false;

                        if (teamId) {
                            setAuthState({ status: 'logged-out', screen: 'sign-up', teamId, isAdmin: data.isAdminCode(code), autoApprove: isAutoApprove });
                            return true;
                        }
                        return false;
                    }}
                    onBackToLogin={() => setAuthState({ status: 'logged-out', screen: 'login' })}
                    initialCode={authState.initialCode || null}
                />
            case 'sign-up':
                 const teamToJoin = data.allTeams.find(t => t.id === authState.teamId);
                 if (!teamToJoin) return <div>Error: Team not found.</div>;
                 return <SignUpView 
                    teamToJoin={teamToJoin}
                    onSignUp={(details, password) => {
                        return data.handleSignUp(details, password, authState.teamId, authState.isAdmin, authState.autoApprove);
                    }}
                    onBackToLogin={() => {
                        // If approved automatically, message is different
                        const msg = (authState.isAdmin || authState.autoApprove) 
                            ? "Account created! Please log in." 
                            : "Sign up successful! Please log in.";
                        setAuthState({ status: 'logged-out', screen: 'login', message: msg })
                    }}
                    isAdminSignUp={authState.isAdmin}
                 />
        }
    }

    const features = data.currentTeam.features || { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false };
    
    // Calculate pending members count
    const pendingMemberCount = data.currentTeam.members.filter(m => m.status === 'pending-approval').length;

    const renderView = () => {
        switch (activeView) {
            case 'my-schedule':
                return <MyScheduleView 
                    serviceEvents={data.currentTeam!.serviceEvents}
                    roles={data.currentTeam!.roles}
                    currentUser={data.currentUser!}
                    teamMembers={data.currentTeam!.members}
                    onCheckIn={data.handleCheckIn}
                    onUpdateEvent={data.handleUpdateEvent}
                    onRemoveAnnouncement={data.handleRemoveAnnouncement}
                    currentTeam={data.currentTeam!}
                    onAddPrayerPoint={(text) => data.handleAddPrayerPoint(text)}
                    onRemovePrayerPoint={(id) => data.handleRemovePrayerPoint(id)}
                    onMarkAsRead={(ids) => data.handleMarkAsRead(ids)}
                    pendingMemberCount={pendingMemberCount}
                    onNavigateToTeam={() => setActiveView('team')}
                />;
            case 'full-schedule':
                return <ScheduleView 
                    serviceEvents={data.currentTeam!.serviceEvents}
                    currentTeam={data.currentTeam!}
                    onUpdateEvent={data.handleUpdateEvent}
                    currentUser={data.currentUser!}
                />;
            case 'team':
                 return <TeamView 
                    team={data.currentTeam!}
                    serviceEvents={data.currentTeam!.serviceEvents}
                    currentUser={data.currentUser!}
                    onUpdateTeam={data.handleUpdateTeam}
                    onUpdateMember={data.handleUpdateMember}
                    onRemoveMember={data.handleRemoveMember}
                    onResetTeam={data.handleResetTeam}
                    onExportTeam={data.handleExportTeam}
                    onImportTeam={data.handleImportTeam}
                 />;
            case 'reports':
                return <ReportsView serviceEvents={data.currentTeam!.serviceEvents} teamMembers={data.currentTeam!.members} currentTeam={data.currentTeam!} currentUser={data.currentUser!} />;
            case 'review':
                if (!features.videoAnalysis) return <div>Feature Disabled</div>;
                return <ReviewView team={data.currentTeam!} onAddAnalysis={data.handleAddVideoAnalysis} currentUser={data.currentUser!} />;
            case 'training':
                if (!features.training) return <div>Feature Disabled</div>;
                return <TrainingView 
                    team={data.currentTeam!} 
                    currentUser={data.currentUser!} 
                    onAddVideo={data.handleAddTrainingVideo} 
                    onUpdateVideo={data.handleUpdateTrainingVideo} 
                    onDeleteVideo={data.handleDeleteTrainingVideo}
                />;
            case 'encouragement':
                return <EncouragementView team={data.currentTeam!} currentUser={data.currentUser!} />;
            case 'faq':
                return <FAQView team={data.currentTeam!} currentUser={data.currentUser!} onAddFaqItem={data.handleAddFaq} onUpdateFaqItem={data.handleUpdateFaq} onDeleteFaqItem={data.handleDeleteFaq} />;
            case 'profile':
                return <ProfileView currentUser={data.currentUser!} onUpdateUser={data.handleUpdateCurrentUser} serviceEvents={data.currentTeam!.serviceEvents} currentTeam={data.currentTeam!} />;
            case 'children':
                if (!features.childCheckIn) return <div>Feature Disabled</div>;
                return <ChildrenView 
                    team={data.currentTeam!} 
                    currentUser={data.currentUser!} 
                    onAddChild={data.handleAddChild} 
                    onUpdateChild={data.handleUpdateChild} 
                    onDeleteChild={data.handleDeleteChild}
                    onCheckIn={data.handleChildCheckIn}
                    onCheckOut={data.handleChildCheckOut}
                />;
            case 'inventory':
                 if (!features.inventory) return <div>Feature Disabled</div>;
                 return <InventoryView 
                    team={data.currentTeam!}
                    currentUser={data.currentUser!}
                    onAddInventoryItem={data.handleAddInventoryItem}
                    onUpdateInventoryItem={data.handleUpdateInventoryItem}
                    onDeleteInventoryItem={data.handleDeleteInventoryItem}
                    onCheckOutItem={data.handleCheckOutItem}
                    onCheckInItem={data.handleCheckInItem}
                 />
            default:
                return <div>View not found</div>;
        }
    };

    return (
        <div className="min-h-screen">
            <Header 
                currentUser={data.currentUser}
                setCurrentView={setActiveView}
                activeView={activeView}
                onLogout={data.handleLogout}
                currentTeam={data.currentTeam}
                myTeams={data.myTeams}
                onSwitchTeam={data.handleSwitchTeam}
                onCreateTeam={() => setIsCreateTeamModalOpen(true)}
                pendingMemberCount={pendingMemberCount}
            />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mb-16 md:mb-0">
                {renderView()}
            </main>
            <FloatingActionButton 
                currentUser={data.currentUser}
                onShoutOutClick={() => setIsShoutOutModalOpen(true)}
                onNewEventClick={() => setIsNewEventModalOpen(true)}
                onNewAnnouncementClick={() => setIsAnnouncementModalOpen(true)}
            />
             <BottomNavBar 
                activeView={activeView}
                setCurrentView={setActiveView}
                onMoreClick={() => setIsMoreMenuOpen(true)}
                pendingMemberCount={pendingMemberCount}
            />
            
            {/* Modals */}
            <AddShoutOutModal 
                isOpen={isShoutOutModalOpen}
                onClose={() => setIsShoutOutModalOpen(false)}
                onSave={(toId, message) => data.handleAddShoutOut(toId, message)}
                teamMembers={data.currentTeam.members}
            />
            <AddAnnouncementModal 
                isOpen={isAnnouncementModalOpen}
                onClose={() => setIsAnnouncementModalOpen(false)}
                onSave={(announcement, notify) => {
                    console.log('Notify options:', notify); // Placeholder for notification logic
                    data.handleAddAnnouncement(announcement.title, announcement.content);
                }}
            />
            <EditEventModal
                isOpen={isNewEventModalOpen}
                onClose={() => setIsNewEventModalOpen(false)}
                event={null}
                allRoles={data.currentTeam.roles}
                onSave={data.handleUpdateEvent}
                savedLocations={data.currentTeam.savedLocations || []}
                savedAttireThemes={data.currentTeam.savedAttireThemes || []}
                showAttire={features.attire}
            />
            <CreateTeamModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                onCreateTeam={data.handleCreateTeam}
            />
             {isMoreMenuOpen && (
                <MoreMenuModal 
                    onClose={() => setIsMoreMenuOpen(false)}
                    setCurrentView={setActiveView}
                    activeView={activeView}
                    features={features}
                />
            )}
        </div>
    );
};

export default App;
