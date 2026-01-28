
import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember, ServiceEvent, Role, Skill, Announcement, ShoutOut, PrayerPoint, VideoAnalysis, FaqItem, TrainingVideo, Scripture, TeamType, TeamFeatures, Achievement, Child, InventoryItem, Department, Assignment, CheckInLogEntry, SignUpDetails, ReadReceipt, CorporateTaskStatus } from '../types.ts';
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
const DEFAULT_CHURCH_ADDRESS = "816 E Whitney St, Houston, TX";

const reviveDates = (data: any): any => {
    if (data === null || data === undefined) return data;
    if (Object.prototype.toString.call(data) === '[object Date]') return data;
    if (typeof data === 'object' && 'seconds' in data && 'nanoseconds' in data) {
        return new Date(data.seconds * 1000);
    }
    if (Array.isArray(data)) return data.map(reviveDates);
    if (typeof data === 'object' && data.constructor === Object) {
        const newData: any = {};
        for (const key in data) {
            const value = data[key];
            const isKnownDateField = ['date', 'endDate', 'callTime', 'birthday', 'timestamp', 'createdAt', 'checkInTime', 'lastPagedAt'].includes(key) || 
                                     key.toLowerCase().endsWith('at') || 
                                     key.toLowerCase().endsWith('time');
            if (isKnownDateField && typeof value === 'string' && !isNaN(Date.parse(value))) {
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
    const roles: Role[] = [
        { id: 'r1', name: 'FOH Engineer', defaultChecklist: ['Ring out vocal monitors', 'Check battery levels', 'Test talkback'] },
        { id: 'r2', name: 'Camera 1 (Tight)', defaultChecklist: ['Format SD card', 'Clean lens'] },
        { id: 'r3', name: 'Lyrics / CG', defaultChecklist: ['Sync ProPresenter', 'Proofread lyrics'] }
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
            awardedAchievements: []
        }
    ];
    return {
        id: 'demo-team-id',
        name: 'Grace Community (Demo)',
        type: 'media',
        features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: true },
        members,
        roles,
        skills: [{ id: 's1', name: 'Audio' }],
        corporateChecklist: ['Power on stage lights', 'Clean stage debris'],
        inviteCode: 'DEMO123',
        inviteCodeCreatedAt: new Date(),
        adminInviteCode: 'DEMOADM',
        adminInviteCodeCreatedAt: new Date(),
        announcements: [],
        scriptures: [{ reference: 'Psalm 33:3', text: 'Sing to him a new song; play skillfully.' }],
        serviceEvents: [],
        savedLocations: [DEFAULT_CHURCH_ADDRESS],
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
        localStorage.setItem('currentUserId', userId);
        localStorage.setItem('currentTeamId', initialTeam.id);
    }, []);

    useEffect(() => {
        if (!auth) { setAuthLoading(false); return; }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsDemoMode(false);
                localStorage.setItem('currentUserId', user.uid);
            } else if (!isDemoMode) {
                setCurrentUser(null);
                setCurrentTeam(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, [isDemoMode]);

    useEffect(() => {
        if (isDemoMode || !db) {
            let savedTeamsStr = localStorage.getItem('teams');
            if (isDemoMode && !savedTeamsStr) {
                const initialTeam = createDemoTeam(true);
                saveLocalTeams([initialTeam]);
                savedTeamsStr = JSON.stringify([initialTeam]);
            }
            if (savedTeamsStr) {
                try {
                    const localTeams = reviveDates(JSON.parse(savedTeamsStr));
                    setAllTeams(localTeams);
                    const uid = localStorage.getItem('currentUserId');
                    const myTeamsList = localTeams.filter((t: Team) => t.members.some(m => m.id === uid));
                    setMyTeams(myTeamsList);
                    const savedTeamId = localStorage.getItem('currentTeamId');
                    const targetTeam = myTeamsList.find((t: Team) => t.id === savedTeamId) || myTeamsList[0];
                    if (targetTeam) {
                        setCurrentTeam(targetTeam);
                        setCurrentUser(targetTeam.members.find((m: TeamMember) => m.id === uid) || targetTeam.members[0]);
                    }
                } catch (e) { console.error(e); }
            }
            setIsDataLoaded(true);
            return;
        }

        const q = collection(db, 'teams');
        return onSnapshot(q, (snapshot) => {
            const allTeamsList = snapshot.docs.map(doc => reviveDates({ ...doc.data(), id: doc.id })) as Team[];
            setAllTeams(allTeamsList);
            const uid = auth.currentUser?.uid || localStorage.getItem('currentUserId');
            if (uid) {
                const myTeamsList = allTeamsList.filter(t => t.members.some(m => m.id === uid));
                setMyTeams(myTeamsList);
                const savedTeamId = localStorage.getItem('currentTeamId');
                const targetTeam = myTeamsList.find(t => t.id === savedTeamId) || myTeamsList[0];
                if (targetTeam) {
                    setCurrentUser(targetTeam.members.find(m => m.id === uid) || null);
                    setCurrentTeam(targetTeam);
                }
            }
            setIsDataLoaded(true);
        });
    }, [authLoading, isDemoMode]);

    const performUpdate = async (updateData: Partial<Team>) => {
        if (!currentTeam) return;
        const tid = currentTeam.id;
        
        // Deep copy the current state to avoid direct mutation
        const updatedTeams = allTeams.map(t => {
            if (t.id === tid) {
                return { ...t, ...updateData };
            }
            return t;
        });

        setAllTeams(updatedTeams);
        const nt = updatedTeams.find(t => t.id === tid);
        if (nt) {
            setCurrentTeam(nt);
            const uid = currentUser?.id || localStorage.getItem('currentUserId');
            if (uid) setMyTeams(updatedTeams.filter(t => t.members.some(m => m.id === uid)));
        }

        if (isDemoMode || !db) {
            saveLocalTeams(updatedTeams);
        } else {
            // Firestore update with selective keys to reduce payload
            await updateDoc(doc(db, 'teams', tid), updateData);
        }
    };

    const handleUpdateEvent = async (updatedEvent: ServiceEvent) => {
        if (!currentTeam) return;
        
        const eventId = updatedEvent.id || `event_${Date.now()}`;
        const finalEvent = { ...updatedEvent, id: eventId };
        
        // Data Healing & Initialization
        if (!finalEvent.corporateChecklistStatus && finalEvent.corporateChecklistTasks) {
            const status: Record<string, CorporateTaskStatus> = {};
            finalEvent.corporateChecklistTasks.forEach(task => { status[task] = { completed: false }; });
            finalEvent.corporateChecklistStatus = status;
        }

        finalEvent.assignments = finalEvent.assignments.map(a => {
            const role = currentTeam.roles.find(r => r.id === a.roleId);
            return {
                ...a,
                status: a.status || 'pending',
                checklistTasks: a.checklistTasks || role?.defaultChecklist || [],
                checklistProgress: a.checklistProgress || {}
            };
        });

        const currentEvents = currentTeam.serviceEvents || [];
        const exists = currentEvents.some(e => e.id === eventId);
        
        const newEvents = exists
            ? currentEvents.map(e => e.id === eventId ? finalEvent : e)
            : [...currentEvents, finalEvent];
            
        await performUpdate({ serviceEvents: newEvents });
    };

    const handleToggleChecklistItem = async (eventId: string, roleId: string, task: string, completed: boolean) => {
        if (!currentTeam) return;
        const newEvents = currentTeam.serviceEvents.map(e => {
            if (e.id === eventId) {
                const newAssignments = e.assignments.map(a => {
                    if (a.roleId === roleId) {
                        return { 
                            ...a, 
                            checklistProgress: { ...(a.checklistProgress || {}), [task]: completed } 
                        };
                    }
                    return a;
                });
                return { ...e, assignments: newAssignments };
            }
            return e;
        });
        await performUpdate({ serviceEvents: newEvents });
    };

    const handleToggleCorporateTask = async (eventId: string, task: string, completed: boolean) => {
        if (!currentTeam || !currentUser) return;
        const newEvents = currentTeam.serviceEvents.map(e => {
            if (e.id === eventId) {
                const status = { ...(e.corporateChecklistStatus || {}) };
                status[task] = { 
                    completed, 
                    memberId: completed ? currentUser.id : undefined, 
                    timestamp: completed ? new Date() : undefined 
                };
                return { ...e, corporateChecklistStatus: status };
            }
            return e;
        });
        await performUpdate({ serviceEvents: newEvents });
    };

    const handleUpdateAssignmentStatus = async (eventId: string, roleId: string, status: 'accepted' | 'declined', reason?: string) => {
        if (!currentTeam) return;
        const newEvents = currentTeam.serviceEvents.map(event => {
            if (event.id === eventId) {
                const newAssignments = event.assignments.map(a => a.roleId === roleId ? { ...a, status, declineReason: reason || a.declineReason } : a);
                return { ...event, assignments: newAssignments };
            }
            return event;
        });
        await performUpdate({ serviceEvents: newEvents });
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!currentTeam) return;
        await performUpdate({ serviceEvents: (currentTeam.serviceEvents || []).filter(e => e.id !== eventId) });
    };

    const handleCreateTeam = async (teamName: string, type: TeamType, description?: string, focusAreas?: string[]): Promise<string | boolean> => {
        try {
            if (!currentUser) return "Auth error.";
            const template = await generateTeamTemplate(description || teamName, focusAreas);
            const teamId = `team_${Date.now()}`;
            const newTeam: Team = { 
                id: teamId, name: teamName, type, description, features: template.features, members: [{...currentUser, permissions: ['admin']}], roles: template.roles, skills: template.skills, achievements: template.achievements, corporateChecklist: template.corporateChecklist, inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(), inviteCodeCreatedAt: new Date(), adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM', adminInviteCodeCreatedAt: new Date(), announcements: [], scriptures: [], serviceEvents: [], savedLocations: [DEFAULT_CHURCH_ADDRESS], brandColors: { primary: '#0d9488', secondary: '#f59e0b' }
            };
            if (isDemoMode || !db) {
                const updated = [...allTeams, newTeam];
                saveLocalTeams(updated); setAllTeams(updated); setMyTeams(prev => [...prev, newTeam]); setCurrentTeam(newTeam);
                return true;
            }
            await setDoc(doc(db, 'teams', teamId), newTeam);
            return true;
        } catch (err: any) { return "Failed to create team."; }
    };

    const handleAdminRegistration = async (teamName: string, type: TeamType, details: SignUpDetails, password: string, description?: string, focusAreas?: string[]): Promise<string | boolean> => {
        try {
            let uid = `local_${Date.now()}`;
            if (auth && !isDemoMode) {
                const cred = await createUserWithEmailAndPassword(auth, details.email, password);
                uid = cred.user.uid;
            }
            const newUser: TeamMember = { ...details, id: uid, status: 'active', permissions: ['admin'], skills: [], checkIns: [], availability: {}, awardedAchievements: [] };
            const template = await generateTeamTemplate(description || teamName, focusAreas);
            const teamId = `team_${Date.now()}`;
            const newTeam: Team = { 
                id: teamId, name: teamName, type, description, features: template.features, members: [newUser], roles: template.roles, skills: template.skills, achievements: template.achievements, corporateChecklist: template.corporateChecklist, inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(), inviteCodeCreatedAt: new Date(), adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM', adminInviteCodeCreatedAt: new Date(), announcements: [], scriptures: [], serviceEvents: [], savedLocations: [DEFAULT_CHURCH_ADDRESS], brandColors: { primary: '#0d9488', secondary: '#f59e0b' }
            };
            if (isDemoMode || !db) {
                const updated = [...allTeams, newTeam];
                saveLocalTeams(updated); setAllTeams(updated); setMyTeams(prev => [...prev, newTeam]); setCurrentTeam(newTeam); setCurrentUser(newUser); localStorage.setItem('currentUserId', uid); return true;
            }
            await setDoc(doc(db, 'teams', teamId), newTeam);
            return true;
        } catch (err: any) { return "Failed to register admin."; }
    };

    return {
        allUsers: allTeams.flatMap(t => t.members),
        allTeams, myTeams, currentUser, currentTeam, 
        isDataLoaded: isDataLoaded && !authLoading,
        isDemoMode,
        handleLogin: async (e: string, p: string) => {
            if (!auth) return "Auth unavailable.";
            try {
                const res = await signInWithEmailAndPassword(auth, e, p);
                localStorage.setItem('currentUserId', res.user.uid);
                return true;
            } catch (e) { return "Invalid login."; }
        },
        handleLogout: async () => {
            if (auth) await signOut(auth);
            setIsDemoMode(false);
            setCurrentUser(null);
            setCurrentTeam(null);
            localStorage.clear();
        },
        handleDemoMode,
        handleJoinCode: (code: string) => {
            const clean = code.trim().toUpperCase();
            return allTeams.find(t => (t.inviteCode === clean || t.adminInviteCode === clean))?.id || null;
        },
        isAdminCode: (code: string) => allTeams.some(t => t.adminInviteCode === code.trim().toUpperCase()),
        handleUpdateTeam: (data: Partial<Team>) => performUpdate(data),
        handleUpdateMember: (member: TeamMember) => {
            if (!currentTeam) return;
            performUpdate({ members: currentTeam.members.map(m => m.id === member.id ? member : m) });
        },
        handleSwitchTeam: (teamId: string) => {
            const team = allTeams.find(t => t.id === teamId);
            if (team) {
                setCurrentTeam(team);
                localStorage.setItem('currentTeamId', teamId);
                const uid = localStorage.getItem('currentUserId');
                if (uid) setCurrentUser(team.members.find(m => m.id === uid) || team.members[0]);
            }
        },
        handleUpdateEvent, handleUpdateAssignmentStatus, handleDeleteEvent, handleCreateTeam, handleAdminRegistration,
        handleToggleChecklistItem, handleToggleCorporateTask,
        handleCheckIn: async (eventId: string, location: { latitude: number; longitude: number; }, isUnverified: boolean = false) => {
            if (!currentUser || !currentTeam) return;
            const updatedUser = { ...currentUser, checkIns: [...(currentUser.checkIns || []), { eventId, checkInTime: new Date(), location, isUnverifiedLocation: isUnverified }] };
            const newMembers = currentTeam.members.map(m => m.id === currentUser.id ? updatedUser : m);
            setCurrentUser(updatedUser);
            await performUpdate({ members: newMembers });
        },
        handleSignUp: async (details: any, password: string, teamId: string, isAdmin: boolean, autoApprove?: boolean) => {
             try {
                 let uid = `local_${Date.now()}`;
                 if (auth && !isDemoMode) {
                    const cred = await createUserWithEmailAndPassword(auth, details.email, password);
                    uid = cred.user.uid;
                 }
                 const newUser: TeamMember = { ...details, id: uid, status: (isAdmin || autoApprove) ? 'active' : 'pending-approval', permissions: isAdmin ? ['admin'] : [], skills: [], checkIns: [], availability: {}, awardedAchievements: [] };
                 localStorage.setItem('currentUserId', uid);
                 if (isDemoMode) {
                    const up = allTeams.map(t => t.id === teamId ? { ...t, members: [...t.members, newUser] } : t);
                    setAllTeams(up); saveLocalTeams(up); return true;
                 }
                 const teamRef = doc(db, 'teams', teamId);
                 const teamSnap = await getDoc(teamRef);
                 if (!teamSnap.exists()) return "Team not found.";
                 await updateDoc(teamRef, { members: [...teamSnap.data().members, newUser] });
                 return true;
             } catch (err: any) { return "Failed sign up."; }
        },
        handleForgotPassword: async (email: string) => { if (auth) await sendPasswordResetEmail(auth, email); return true; },
        handleRemoveAnnouncement: async (id: string) => { if (currentTeam) await performUpdate({ announcements: currentTeam.announcements.filter(a => a.id !== id) }); },
        handleAddPrayerPoint: async (text: string) => { if (currentTeam) await performUpdate({ customPrayerPoints: [...(currentTeam.customPrayerPoints || []), { id: `pr_${Date.now()}`, text }] }); },
        handleRemovePrayerPoint: async (id: string) => { if (currentTeam) { if (id.startsWith('ai_')) { await performUpdate({ deletedAiPrayerPointIds: [...(currentTeam.deletedAiPrayerPointIds || []), id] }); } else { await performUpdate({ customPrayerPoints: currentTeam.customPrayerPoints?.filter(p => p.id !== id) }); } } },
        handleMarkAsRead: async (ids: string[]) => { 
            if (currentTeam && currentUser) {
                await performUpdate({ announcements: currentTeam.announcements.map(a => ids.includes(a.id) && !(a.readBy || []).some(r => r.userId === currentUser.id) ? { ...a, readBy: [...(a.readBy || []), { userId: currentUser.id, timestamp: new Date() }] } : a) }); 
            }
        },
        handleRemoveMember: async (mid: string) => { if (currentTeam) await performUpdate({ members: currentTeam.members.filter(m => m.id !== mid) }); },
        handleResetTeam: async (tid: string, aid: string) => { if (currentTeam) { const admin = currentTeam.members.find(m => m.id === aid); await performUpdate({ members: admin ? [admin] : [], serviceEvents: [], announcements: [], customPrayerPoints: [], trainingVideos: [], children: [], inventory: [] }); } },
        handleDeleteTeam: async (tid: string) => { if (isDemoMode) { const up = allTeams.filter(t => t.id !== tid); setAllTeams(up); saveLocalTeams(up); return; } await deleteDoc(doc(db, 'teams', tid)); },
        handleUpdateCurrentUser: async (u: TeamMember) => { if (currentTeam) { setCurrentUser(u); await performUpdate({ members: currentTeam.members.map(m => m.id === u.id ? u : m) }); } },
        handleLeaveTeam: async () => { if (currentTeam && currentUser) { await performUpdate({ members: currentTeam.members.filter(m => m.id !== currentUser.id) }); setCurrentTeam(null); setCurrentUser(null); } },
        handleAddChild: async (d: any) => { if (currentTeam) await performUpdate({ children: [...(currentTeam.children || []), { ...d, id: `c_${Date.now()}`, status: 'checked-out' }] }); },
        handleUpdateChild: async (c: Child) => { if (currentTeam) await performUpdate({ children: currentTeam.children?.map(child => child.id === c.id ? c : child) }); },
        handleDeleteChild: async (id: string) => { if (currentTeam) await performUpdate({ children: currentTeam.children?.filter(c => c.id !== id) }); },
        handleChildCheckIn: async (id: string) => { if (currentTeam && currentUser) await performUpdate({ children: currentTeam.children?.map(c => c.id === id ? { ...c, status: 'checked-in' as const, lastCheckIn: new Date(), lastProcessedByName: currentUser.name, checkInHistory: [{ id: `l_${Date.now()}`, timestamp: new Date(), type: 'in' as const, processedByName: currentUser.name }, ...(c.checkInHistory || [])] } : c) }); },
        handleChildCheckOut: async (id: string) => { if (currentTeam && currentUser) await performUpdate({ children: currentTeam.children?.map(c => c.id === id ? { ...c, status: 'checked-out' as const, lastCheckOut: new Date(), lastProcessedByName: currentUser.name, checkInHistory: [{ id: `l_${Date.now()}`, timestamp: new Date(), type: 'out' as const, processedByName: currentUser.name }, ...(c.checkInHistory || [])] } : c) }); },
        handleAddInventoryItem: async (d: any) => { if (currentTeam) await performUpdate({ inventory: [...(currentTeam.inventory || []), { ...d, id: `i_${Date.now()}`, status: 'available' }] }); },
        handleUpdateInventoryItem: async (i: InventoryItem) => { if (currentTeam) await performUpdate({ inventory: currentTeam.inventory?.map(it => it.id === i.id ? i : it) }); },
        handleDeleteInventoryItem: async (id: string) => { if (currentTeam) await performUpdate({ inventory: currentTeam.inventory?.filter(i => i.id !== id) }); },
        handleCheckOutItem: async (id: string, mid: string) => { if (currentTeam) await performUpdate({ inventory: currentTeam.inventory?.map(it => it.id === id ? { ...it, status: 'in-use' as const, assignedTo: mid } : it) }); },
        handleCheckInItem: async (id: string) => { if (currentTeam) await performUpdate({ inventory: currentTeam.inventory?.map(it => it.id === id ? { ...it, status: 'available' as const, assignedTo: undefined } : it) }); },
        handleAddShoutOut: async (tid: string, msg: string) => { if (currentTeam && currentUser) await performUpdate({ shoutOuts: [...(currentTeam.shoutOuts || []), { id: `so_${Date.now()}`, fromId: currentUser.id, toId: tid, message: msg, date: new Date() }] }); },
        handleAddAnnouncement: async (ann: { title: string; content: string }, notify: { email: boolean, sms: boolean, push: boolean }) => {
            if (currentTeam && currentUser) {
                const na: Announcement = { id: `a_${Date.now()}`, title: ann.title, content: ann.content, date: new Date(), authorId: currentUser.id, readBy: [] };
                if (notify.push) await sendLocalNotification(`Team Sync: ${ann.title}`, ann.content);
                await performUpdate({ announcements: [...(currentTeam.announcements || []), na] });
            }
        },
        handleRefreshInviteCodes: async () => { if (currentTeam) await performUpdate({ inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(), inviteCodeCreatedAt: new Date(), adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM', adminInviteCodeCreatedAt: new Date() }); },
        handleAddVideoAnalysis: async (a: VideoAnalysis) => { if (currentTeam && currentUser) await performUpdate({ videoAnalyses: [...(currentTeam.videoAnalyses || []), a], announcements: [...(currentTeam.announcements || []), { id: `a_va_${Date.now()}`, title: "🎥 New Service Review", content: `${currentUser.name} added AI technical feedback.`, date: new Date(), authorId: currentUser.id, readBy: [] }] }); },
        handleAddTrainingVideo: async (d: any) => { if (currentTeam && currentUser) await performUpdate({ trainingVideos: [...(currentTeam.trainingVideos || []), { ...d, id: `v_${Date.now()}`, uploadedBy: currentUser.id, dateAdded: new Date() }] }); },
        handleUpdateTrainingVideo: async (v: TrainingVideo) => { if (currentTeam) await performUpdate({ trainingVideos: currentTeam.trainingVideos?.map(vid => vid.id === v.id ? v : vid) }); },
        handleDeleteTrainingVideo: async (id: string) => { if (currentTeam) await performUpdate({ trainingVideos: currentTeam.trainingVideos?.filter(v => v.id !== id) }); },
        handleAddFaq: async (f: FaqItem) => { if (currentTeam) await performUpdate({ faqs: [...(currentTeam.faqs || []), f] }); },
        handleUpdateFaq: async (f: FaqItem) => { if (currentTeam) await performUpdate({ faqs: currentTeam.faqs?.map(it => it.id === f.id ? f : it) }); },
        handleDeleteFaq: async (id: string) => { if (currentTeam) await performUpdate({ faqs: currentTeam.faqs?.filter(f => f.id !== id) }); }
    };
};
