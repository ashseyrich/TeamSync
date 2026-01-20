import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember, ServiceEvent, Role, Skill, Announcement, ShoutOut, PrayerPoint, VideoAnalysis, FaqItem, TrainingVideo, Scripture, TeamType, TeamFeatures, Achievement, Child, InventoryItem, Department, Assignment, CheckInLogEntry, SignUpDetails, ReadReceipt } from '../types.ts';
import { Proficiency } from '../types.ts';
import { generateTeamTemplate } from '../services/geminiService.ts';
import { db, auth } from '../lib/firebase.ts';
import { sendLocalNotification } from '../utils/notifications.ts';
import { 
    collection, 
    onSnapshot, 
    doc, 
    setDoc, 
    updateDoc, 
    query, 
    where,
    getDoc,
    deleteDoc,
    getDocs
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
} from 'firebase/auth';

const INVITE_EXPIRATION_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CHURCH_ADDRESS = "816 e Whitney str Houston TX";

/**
 * Recursively converts Firestore Timestamps or ISO strings back into Date objects.
 */
const reviveDates = (data: any): any => {
    if (data === null || data === undefined) return data;
    
    if (Array.isArray(data)) {
        return data.map(reviveDates);
    }
    
    if (typeof data === 'object') {
        // Handle Firestore Timestamp
        if ('seconds' in data && 'nanoseconds' in data) {
            return new Date(data.seconds * 1000);
        }
        
        const newData: any = {};
        for (const key in data) {
            const value = data[key];
            
            // Check if key looks like a date field
            const isDateKey = key.toLowerCase().includes('date') || 
                              key.toLowerCase().includes('time') || 
                              key === 'birthday' || 
                              key === 'timestamp' || 
                              key.toLowerCase().includes('createdat');

            if (isDateKey && typeof value === 'string' && !isNaN(Date.parse(value))) {
                newData[key] = new Date(value);
            } else {
                newData[key] = reviveDates(value);
            }
        }
        return newData;
    }
    return data;
}

const createDemoTeam = (isAdmin: boolean): Team => {
    const skills: Skill[] = [
        { id: 's1', name: 'Audio Mixing' },
        { id: 's2', name: 'Camera Operation' },
        { id: 's3', name: 'ProPresenter' }
    ];

    const roles: Role[] = [
        { id: 'r1', name: 'FOH Engineer', requiredSkillId: 's1' },
        { id: 'r2', name: 'Camera 1 (Tight)', requiredSkillId: 's2' },
        { id: 'r3', name: 'Lyrics / CG', requiredSkillId: 's3' }
    ];

    const members: TeamMember[] = [
        {
            id: 'demo-admin-id',
            name: 'Sarah Admin',
            username: 'sarah',
            email: 'sarah@example.com',
            status: 'active',
            permissions: ['admin'],
            skills: [{ skillId: 's1', proficiency: Proficiency.MASTER_TRAINER }],
            checkIns: [],
            availability: {},
            aboutMe: 'Passionate about clear sound and team growth.',
            awardedAchievements: ['ach1', 'ach2']
        },
        {
            id: 'demo-member-id',
            name: 'John Volunteer',
            username: 'john',
            email: 'john@example.com',
            status: 'active',
            permissions: [],
            skills: [{ skillId: 's2', proficiency: Proficiency.NOVICE }],
            checkIns: [],
            availability: {},
            aboutMe: 'Learning the ropes of video production!',
            awardedAchievements: ['ach1']
        }
    ];

    const pastEventId = 'past-1';
    members[0].checkIns.push({ eventId: pastEventId, checkInTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });
    members[1].checkIns.push({ eventId: pastEventId, checkInTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000) });

    return {
        id: 'demo-team-id',
        name: 'Grace Community Media (Demo)',
        type: 'media',
        features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: true },
        members,
        roles,
        skills,
        inviteCode: 'DEMO123',
        inviteCodeCreatedAt: new Date(),
        adminInviteCode: 'DEMOADM',
        adminInviteCodeCreatedAt: new Date(),
        announcements: [
            { id: 'ann1', title: 'New Camera Lenses!', content: 'We just received two new 70-200mm lenses for cameras 1 and 2.', date: new Date(), authorId: 'demo-admin-id', readBy: [] }
        ],
        scriptures: [
            { reference: 'Psalm 33:3', text: 'Sing to him a new song; play skillfully, and shout for joy.' }
        ],
        serviceEvents: [
            {
                id: pastEventId,
                name: 'Last Sunday Service',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                callTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
                assignments: [
                    { roleId: 'r1', memberId: 'demo-admin-id' },
                    { roleId: 'r2', memberId: 'demo-member-id' }
                ],
                serviceNotes: 'Great service last week everyone!'
            },
            {
                id: 'future-1',
                name: 'Upcoming Sunday Morning',
                date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                callTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
                assignments: [
                    { roleId: 'r1', memberId: 'demo-admin-id' },
                    { roleId: 'r2', memberId: 'demo-member-id', traineeId: null }
                ],
                attire: { theme: 'Business Casual', description: 'Dark jeans and collared shirts preferred.', colors: ['#1e293b', '#ffffff'] }
            }
        ],
        savedLocations: [DEFAULT_CHURCH_ADDRESS],
        achievements: [
            { id: 'ach1', name: 'First Service', description: 'Completed first assigned service.', icon: 'star' },
            { id: 'ach2', name: 'Technical Excellence', description: 'Handled a technical difficulty with grace.', icon: 'trophy' }
        ],
        inventory: [
            { id: 'inv1', name: 'Blackmagic URSA Mini', category: 'Video', status: 'available' },
            { id: 'inv2', name: 'Behringer X32', category: 'Audio', status: 'in-use', assignedTo: 'demo-admin-id' }
        ]
    };
};

export const useMockData = () => {
    const [allTeams, setAllTeams] = useState<Team[]>([]); 
    const [myTeams, setMyTeams] = useState<Team[]>([]);   
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(localStorage.getItem('is_demo_mode') === 'true');

    const saveLocalTeams = (updatedTeams: Team[]) => {
        localStorage.setItem('teams', JSON.stringify(updatedTeams));
    };

    const handleDemoMode = useCallback((role: 'admin' | 'member') => {
        setIsDemoMode(true);
        localStorage.setItem('is_demo_mode', 'true');
        localStorage.setItem('demo_role', role);
        const initialTeam = createDemoTeam(role === 'admin');
        const teams = [initialTeam];
        saveLocalTeams(teams);
        setAllTeams(teams);
        setMyTeams(teams);
        setCurrentTeam(initialTeam);
        const userId = role === 'admin' ? 'demo-admin-id' : 'demo-member-id';
        const member = initialTeam.members.find(m => m.id === userId) || initialTeam.members[0];
        setCurrentUser(member);
        localStorage.setItem('currentUserId', member.id);
        localStorage.setItem('currentTeamId', initialTeam.id);
    }, []);

    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsDemoMode(false);
                setAuthLoading(false);
            } else {
                if (!isDemoMode) {
                    setCurrentUser(null);
                    setCurrentTeam(null);
                }
                setAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, [isDemoMode]);

    useEffect(() => {
        if (isDemoMode || !db) {
            let savedTeamsStr = localStorage.getItem('teams');
            if (isDemoMode && !savedTeamsStr) {
                const demoRole = (localStorage.getItem('demo_role') as 'admin' | 'member') || 'admin';
                const initialTeam = createDemoTeam(demoRole === 'admin');
                const teams = [initialTeam];
                saveLocalTeams(teams);
                savedTeamsStr = JSON.stringify(teams);
            }

            if (savedTeamsStr) {
                try {
                    const localTeams = reviveDates(JSON.parse(savedTeamsStr));
                    setAllTeams(localTeams);
                    const userId = isDemoMode 
                        ? (localStorage.getItem('demo_role') === 'admin' ? 'demo-admin-id' : 'demo-member-id')
                        : (auth?.currentUser?.uid || localStorage.getItem('currentUserId'));
                    const myTeamsList = localTeams.filter((t: Team) => t.members.some(m => m.id === userId));
                    setMyTeams(myTeamsList);
                    const savedTeamId = localStorage.getItem('currentTeamId');
                    const targetTeam = myTeamsList.find((t: Team) => t.id === savedTeamId) || myTeamsList[0];
                    if (targetTeam) {
                        setCurrentTeam(targetTeam);
                        const member = targetTeam.members.find((m: TeamMember) => m.id === userId);
                        setCurrentUser(member || targetTeam.members[0]);
                    }
                } catch (e) {
                    console.error("Failed to parse local teams", e);
                }
            }
            setIsDataLoaded(true);
            return;
        }

        const q = collection(db, 'teams');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allTeamsList = snapshot.docs.map(doc => reviveDates({ ...doc.data(), id: doc.id })) as Team[];
            setAllTeams(allTeamsList);

            if (auth.currentUser) {
                const myTeamsList = allTeamsList.filter(t => t.members.some(m => m.id === auth.currentUser?.uid));
                setMyTeams(myTeamsList);
                const savedTeamId = localStorage.getItem('currentTeamId');
                const targetTeam = myTeamsList.find(t => t.id === savedTeamId) || myTeamsList[0];
                if (targetTeam) {
                    const member = targetTeam.members.find(m => m.id === auth.currentUser?.uid);
                    setCurrentUser(member || null);
                    setCurrentTeam(targetTeam);
                } else {
                    setCurrentTeam(null);
                    setCurrentUser(null);
                }
            }
            setIsDataLoaded(true);
        }, (error) => {
            console.error("Teams snapshot listener error:", error);
            setIsDataLoaded(true);
        });
        return () => unsubscribe();
    }, [authLoading, isDemoMode]);

    const handleLogin = async (email: string, password: string): Promise<string | boolean> => {
        if (!auth) return "Auth service unavailable.";
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            setIsDemoMode(false);
            localStorage.removeItem('is_demo_mode');
            localStorage.removeItem('demo_role');
            return true;
        } catch (error: any) {
            return "Invalid email or password.";
        }
    };

    const handleLogout = async () => {
        if (auth) await signOut(auth);
        setIsDemoMode(false);
        setCurrentUser(null);
        setCurrentTeam(null);
        setMyTeams([]);
        ['teams', 'is_demo_mode', 'demo_role', 'currentTeamId', 'currentUserId'].forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
    };

    const performUpdate = async (updateData: any) => {
        if (!currentTeam) return;
        
        // Optimistic UI update: Apply changes to local state immediately
        const updatedTeam = { ...currentTeam, ...updateData } as Team;
        const updatedAllTeams = allTeams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        
        setAllTeams(updatedAllTeams);
        setCurrentTeam(updatedTeam);

        if (isDemoMode || !db) {
            saveLocalTeams(updatedAllTeams);
            return;
        }
        
        // In cloud mode, also push to DB
        await updateDoc(doc(db, 'teams', currentTeam.id), updateData);
    };

    const handleJoinCode = (code: string): string | null => {
        const now = new Date().getTime();
        const team = allTeams.find(t => {
            if (t.inviteCode === code || t.adminInviteCode === code) {
                const createdAt = new Date(t.inviteCodeCreatedAt || t.adminInviteCodeCreatedAt || 0).getTime();
                return (now - createdAt) < INVITE_EXPIRATION_MS;
            }
            return false;
        });
        return team?.id || null;
    };

    const handleUpdateEvent = async (updatedEvent: ServiceEvent) => {
        if (!currentTeam) return;
        const currentEvents = currentTeam.serviceEvents || [];
        
        let finalEvent = { ...updatedEvent };
        if (!finalEvent.id || finalEvent.id === '') {
            finalEvent.id = `event_${Date.now()}`;
        }

        const eventExists = currentEvents.some(e => e.id === finalEvent.id);
        const newEvents = eventExists 
            ? currentEvents.map(e => e.id === finalEvent.id ? finalEvent : e)
            : [...currentEvents, finalEvent];
        
        await performUpdate({ serviceEvents: newEvents });
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!currentTeam) return;
        const newEvents = currentTeam.serviceEvents.filter(e => e.id !== eventId);
        await performUpdate({ serviceEvents: newEvents });
    };

    const handleRefreshInviteCodes = async () => {
        if (!currentTeam) return;
        const newCodes = {
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            inviteCodeCreatedAt: new Date(),
            adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM',
            adminInviteCodeCreatedAt: new Date(),
        };
        await performUpdate(newCodes);
    };

    const handleAddAnnouncement = async (ann: { title: string; content: string }, notify: { email: boolean, sms: boolean, push: boolean }) => {
        if (!currentTeam || !currentUser) return;
        const newAnnouncement: Announcement = { 
            id: `a_${Date.now()}`, 
            title: ann.title, 
            content: ann.content, 
            date: new Date(), 
            authorId: currentUser.id, 
            readBy: [] 
        };
        
        if (notify.push) {
            await sendLocalNotification(`TeamSync: ${ann.title}`, ann.content);
        }

        await performUpdate({ announcements: [...(currentTeam.announcements || []), newAnnouncement] });
    };

    return {
        allUsers: allTeams.flatMap(t => t.members),
        allTeams: allTeams,
        myTeams: myTeams,
        currentUser, currentTeam, 
        isDataLoaded: isDataLoaded && !authLoading,
        isDemoMode,
        handleLogin, handleLogout, handleDemoMode,
        handleJoinCode,
        isAdminCode: (code: string) => allTeams.some(t => t.adminInviteCode === code), 
        handleUpdateTeam: (data: Partial<Team>) => performUpdate(data),
        handleUpdateMember: (member: TeamMember) => {
            if (!currentTeam) return;
            const newMembers = currentTeam.members.map(m => m.id === member.id ? member : m);
            performUpdate({ members: newMembers });
        },
        handleSwitchTeam: (teamId: string) => {
            const team = allTeams.find(t => t.id === teamId);
            if (team) {
                setCurrentTeam(team);
                localStorage.setItem('currentTeamId', teamId);
                const userId = (isDemoMode && teamId === 'demo-team-id') 
                    ? (localStorage.getItem('demo_role') === 'admin' ? 'demo-admin-id' : 'demo-member-id')
                    : (auth?.currentUser?.uid || localStorage.getItem('currentUserId'));
                const member = team.members.find(m => m.id === userId);
                setCurrentUser(member || team.members[0]);
            }
        },
        handleCheckIn: async (eventId: string, location: { latitude: number; longitude: number; }) => {
            if (!currentUser || !currentTeam) return;
            const updatedUser = { ...currentUser, checkIns: [...(currentUser.checkIns || []), { eventId, checkInTime: new Date(), location }] };
            const newMembers = currentTeam.members.map(m => m.id === currentUser.id ? updatedUser : m);
            
            // Critical: Update currentUser immediately to reflect check-in without waiting for DB snapshot
            setCurrentUser(updatedUser);
            await performUpdate({ members: newMembers });
        },
        handleUpdateEvent,
        handleDeleteEvent,
        handleSignUp: async (details: any, password: string, teamId: string, isAdmin: boolean, autoApprove?: boolean) => {
             if (!db && !isDemoMode) return "Database connection missing.";
             try {
                 let uid = `local_${Date.now()}`;
                 if (auth && !isDemoMode) {
                    const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
                    uid = userCredential.user.uid;
                 }
                 const newUser: TeamMember = { ...details, id: uid, status: (isAdmin || autoApprove) ? 'active' : 'pending-approval', permissions: isAdmin ? ['admin'] : [], skills: [], checkIns: [], availability: {}, awardedAchievements: [] };
                 
                 if (isDemoMode) {
                    const updatedAll = allTeams.map(t => {
                        if (t.id === teamId) {
                            return { ...t, members: [...t.members, newUser] };
                        }
                        return t;
                    });
                    setAllTeams(updatedAll);
                    saveLocalTeams(updatedAll);
                    return true;
                 }

                 const teamRef = doc(db, 'teams', teamId);
                 const teamSnap = await getDoc(teamRef);
                 if (!teamSnap.exists()) return "Team not found.";
                 const teamData = teamSnap.data() as Team;
                 await updateDoc(teamRef, { members: [...teamData.members, newUser] });
                 return true;
             } catch (err: any) { return err.message || "Failed to sign up."; }
        },
        handleAdminRegistration: async (teamName: string, type: TeamType, details: SignUpDetails, password: string, description?: string, focusAreas?: string[]): Promise<string | boolean> => {
            try {
                let uid = `local_${Date.now()}`;
                if (auth && !isDemoMode) {
                    const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
                    uid = userCredential.user.uid;
                }
                const newUser: TeamMember = { ...details, id: uid, status: 'active', permissions: ['admin'], skills: [], checkIns: [], availability: {}, awardedAchievements: [] };
                const template = await generateTeamTemplate(description || teamName, focusAreas);
                const teamId = `team_${Date.now()}`;
                const newTeam: Team = { 
                    id: teamId, 
                    name: teamName, 
                    type, 
                    description, 
                    features: template.features, 
                    members: [newUser], 
                    roles: template.roles, 
                    skills: template.skills, 
                    achievements: template.achievements, 
                    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(), 
                    inviteCodeCreatedAt: new Date(), 
                    adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM', 
                    adminInviteCodeCreatedAt: new Date(), 
                    announcements: [], 
                    scriptures: [], 
                    serviceEvents: [],
                    savedLocations: [DEFAULT_CHURCH_ADDRESS]
                };
                if (isDemoMode || !db) {
                    const updated = [...allTeams, newTeam];
                    saveLocalTeams(updated);
                    setAllTeams(updated);
                    setMyTeams([newTeam]);
                    setCurrentTeam(newTeam);
                    setCurrentUser(newUser);
                    return true;
                }
                await setDoc(doc(db, 'teams', teamId), newTeam);
                return true;
            } catch (err: any) { return err.message || "Failed to create team."; }
        },
        handleForgotPassword: async (email: string) => { if (!auth) return "Auth unavailable."; try { await sendPasswordResetEmail(auth, email); return true; } catch (e: any) { return e.message; } },
        handleRemoveAnnouncement: async (annId: string) => { if (!currentTeam) return; await performUpdate({ announcements: currentTeam.announcements.filter(a => a.id !== annId) }); },
        handleAddPrayerPoint: async (text: string) => { if (!currentTeam) return; const p = { id: `pr_${Date.now()}`, text }; await performUpdate({ customPrayerPoints: [...(currentTeam.customPrayerPoints || []), p] }); },
        handleRemovePrayerPoint: async (id: string) => { if (!currentTeam) return; if (id.startsWith('ai_')) { await performUpdate({ deletedAiPrayerPointIds: [...(currentTeam.deletedAiPrayerPointIds || []), id] }); } else { await performUpdate({ customPrayerPoints: currentTeam.customPrayerPoints?.filter(p => p.id !== id) }); } },
        handleMarkAsRead: async (ids: string[]) => { 
            if (!currentTeam || !currentUser || ids.length === 0) return; 
            const now = new Date();
            const updated = currentTeam.announcements.map(a => {
                if (ids.includes(a.id)) {
                    const alreadyRead = (a.readBy || []).some(r => r.userId === currentUser.id);
                    if (!alreadyRead) {
                        return { ...a, readBy: [...(a.readBy || []), { userId: currentUser.id, timestamp: now }] };
                    }
                }
                return a;
            }); 
            await performUpdate({ announcements: updated }); 
        },
        handleRemoveMember: async (mid: string) => { if (!currentTeam) return; await performUpdate({ members: currentTeam.members.filter(m => m.id !== mid) }); },
        handleResetTeam: async (tid: string, aid: string) => { if (!currentTeam) return; const admin = currentTeam.members.find(m => m.id === aid); await performUpdate({ members: admin ? [admin] : [], serviceEvents: [], announcements: [], customPrayerPoints: [], trainingVideos: [], children: [], inventory: [] }); },
        handleDeleteTeam: async (tid: string) => { if (isDemoMode || !db) { const up = allTeams.filter(t => t.id !== tid); setAllTeams(up); setMyTeams(myTeams.filter(t => t.id !== tid)); if (currentTeam?.id === tid) setCurrentTeam(null); saveLocalTeams(up); return; } await deleteDoc(doc(db, 'teams', tid)); },
        handleUpdateCurrentUser: async (u: TeamMember) => { if (!currentTeam) return; setCurrentUser(u); await performUpdate({ members: currentTeam.members.map(m => m.id === u.id ? u : m) }); },
        handleLeaveTeam: async () => { if (!currentTeam || !currentUser) return; await performUpdate({ members: currentTeam.members.filter(m => m.id !== currentUser.id) }); setCurrentTeam(null); setCurrentUser(null); },
        handleAddChild: async (d: any) => { if (!currentTeam) return; await performUpdate({ children: [...(currentTeam.children || []), { ...d, id: `c_${Date.now()}`, status: 'checked-out' }] }); },
        handleUpdateChild: async (c: Child) => { if (!currentTeam) return; await performUpdate({ children: currentTeam.children?.map(ch => ch.id === c.id ? c : ch) }); },
        handleDeleteChild: async (id: string) => { if (!currentTeam) return; await performUpdate({ children: currentTeam.children?.filter(c => c.id !== id) }); },
        handleChildCheckIn: async (id: string) => { if (!currentTeam || !currentUser) return; const log = { id: `l_${Date.now()}`, timestamp: new Date(), type: 'in' as const, processedByName: currentUser.name }; await performUpdate({ children: currentTeam.children?.map(c => c.id === id ? { ...c, status: 'checked-in' as const, lastCheckIn: new Date(), lastProcessedByName: currentUser.name, checkInHistory: [log, ...(c.checkInHistory || [])] } : c) }); },
        handleChildCheckOut: async (id: string) => { if (!currentTeam || !currentUser) return; const log = { id: `l_${Date.now()}`, timestamp: new Date(), type: 'out' as const, processedByName: currentUser.name }; await performUpdate({ children: currentTeam.children?.map(c => c.id === id ? { ...c, status: 'checked-out' as const, lastCheckOut: new Date(), lastProcessedByName: currentUser.name, checkInHistory: [log, ...(c.checkInHistory || [])] } : c) }); },
        handleAddInventoryItem: async (d: any) => { if (!currentTeam) return; await performUpdate({ inventory: [...(currentTeam.inventory || []), { ...d, id: `i_${Date.now()}`, status: 'available' }] }); },
        handleUpdateInventoryItem: async (i: InventoryItem) => { if (!currentTeam) return; await performUpdate({ inventory: currentTeam.inventory?.map(it => it.id === i.id ? i : it) }); },
        handleDeleteInventoryItem: async (id: string) => { if (!currentTeam) return; await performUpdate({ inventory: currentTeam.inventory?.filter(i => i.id !== id) }); },
        handleCheckOutItem: async (id: string, mid: string) => { if (!currentTeam) return; await performUpdate({ inventory: currentTeam.inventory?.map(it => it.id === id ? { ...it, status: 'in-use' as const, assignedTo: mid } : it) }); },
        handleCheckInItem: async (id: string) => { if (!currentTeam) return; await performUpdate({ inventory: currentTeam.inventory?.map(it => it.id === id ? { ...it, status: 'available' as const, assignedTo: undefined } : it) }); },
        handleAddShoutOut: async (tid: string, msg: string) => { if (!currentTeam || !currentUser) return; await performUpdate({ shoutOuts: [...(currentTeam.shoutOuts || []), { id: `so_${Date.now()}`, fromId: currentUser.id, toId: tid, message: msg, date: new Date() }] }); },
        handleAddAnnouncement,
        handleCreateTeam: async (n: string, t: TeamType, d?: string, f?: string[]) => { if (!currentUser) return "Login required."; const temp = await generateTeamTemplate(d || n, f); const id = `team_${Date.now()}`; const nt: Team = { id, name: n, type: t, description: d, features: temp.features, members: [{ ...currentUser, status: 'active' as const, permissions: ['admin' as const] }], roles: temp.roles, skills: temp.skills, achievements: temp.achievements, inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(), inviteCodeCreatedAt: new Date(), adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM', adminInviteCodeCreatedAt: new Date(), announcements: [], scriptures: [], serviceEvents: [], savedLocations: [DEFAULT_CHURCH_ADDRESS] }; if (isDemoMode || !db) { const up = [...allTeams, nt]; saveLocalTeams(up); setAllTeams(up); setMyTeams([...myTeams, nt]); return true; } await setDoc(doc(db, 'teams', id), nt); return true; },
        handleAddVideoAnalysis: async (a: VideoAnalysis) => { 
            if (!currentTeam || !currentUser) return; 
            
            // Create a team announcement for the new review
            const newAnnouncement: Announcement = {
                id: `a_va_${Date.now()}`,
                title: "🎥 New Service Review Generated",
                content: `${currentUser.name} just ran a new AI broadcast analysis. Highlights: ${a.result.summary.substring(0, 120)}... Head to the 'Review' tab to see full technical feedback.`,
                date: new Date(),
                authorId: currentUser.id,
                readBy: []
            };

            // Trigger actual push notification (simulation)
            await sendLocalNotification("Team Feedback Posted", `${currentUser.name} added a new AI service review. Check it out now.`);

            await performUpdate({ 
                videoAnalyses: [...(currentTeam.videoAnalyses || []), a],
                announcements: [...(currentTeam.announcements || []), newAnnouncement]
            }); 
        },
        handleAddTrainingVideo: async (d: any) => { if (!currentTeam || !currentUser) return; await performUpdate({ trainingVideos: [...(currentTeam.trainingVideos || []), { ...d, id: `v_${Date.now()}`, uploadedBy: currentUser.id, dateAdded: new Date() }] }); },
        handleUpdateTrainingVideo: async (v: TrainingVideo) => { if (!currentTeam) return; await performUpdate({ trainingVideos: currentTeam.trainingVideos?.map(vid => vid.id === v.id ? v : vid) }); },
        handleDeleteTrainingVideo: async (id: string) => { if (!currentTeam) return; await performUpdate({ trainingVideos: currentTeam.trainingVideos?.filter(v => v.id !== id) }); },
        handleAddFaq: async (f: FaqItem) => { if (!currentTeam) return; await performUpdate({ faqs: [...(currentTeam.faqs || []), f] }); },
        handleUpdateFaq: async (f: FaqItem) => { if (!currentTeam) return; await performUpdate({ faqs: currentTeam.faqs?.map(it => it.id === f.id ? f : it) }); },
        handleDeleteFaq: async (id: string) => { if (!currentTeam) return; await performUpdate({ faqs: currentTeam.faqs?.filter(f => f.id !== id) }); },
        handleRefreshInviteCodes
    };
};