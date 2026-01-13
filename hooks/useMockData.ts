import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember, ServiceEvent, Role, Skill, Announcement, ShoutOut, PrayerPoint, VideoAnalysis, FaqItem, TrainingVideo, Scripture, TeamType, TeamFeatures, Achievement, Child, InventoryItem, Department, Assignment, CheckInLogEntry, SignUpDetails } from '../types.ts';
import { Proficiency } from '../types.ts';
import { generateTeamTemplate } from '../services/geminiService.ts';
import { db, auth } from '../lib/firebase.ts';
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

const reviveDates = (data: any): any => {
    if (Array.isArray(data)) return data.map(reviveDates);
    if (data && typeof data === 'object') {
        const newData: any = {};
        for (const key in data) {
            const value = data[key];
            if (value && typeof value === 'object' && 'seconds' in value) {
                // Firestore Timestamp
                newData[key] = new Date(value.seconds * 1000);
            } else if (value && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key === 'birthday' || key === 'timestamp' || key.toLowerCase().includes('createdat'))) {
                if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                    newData[key] = new Date(value);
                } else {
                    newData[key] = reviveDates(value);
                }
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
        
        let savedTeamsStr = localStorage.getItem('teams');
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
            if (!isDemoMode) setIsDataLoaded(true);
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
                if (!isDemoMode) setIsDataLoaded(true);
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
            let message = "Invalid email or password.";
            if (error.code === 'auth/user-not-found') message = "No account found with this email.";
            if (error.code === 'auth/wrong-password') message = "Incorrect password.";
            if (error.code === 'auth/network-request-failed') message = "Network error. Check your connection.";
            return message;
        }
    };

    const handleLogout = async () => {
        if (auth) await signOut(auth);
        setIsDemoMode(false);
        setCurrentUser(null);
        setCurrentTeam(null);
        setMyTeams([]);
        // Surgical cleanup to preserve other site data
        ['teams', 'is_demo_mode', 'demo_role', 'currentTeamId', 'currentUserId'].forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
    };

    const performUpdate = async (updateData: any) => {
        if (isDemoMode || !db || !currentTeam) {
            const updatedTeam = { ...currentTeam, ...updateData } as Team;
            const updatedAllTeams = allTeams.map(t => t.id === currentTeam?.id ? updatedTeam : t);
            setAllTeams(updatedAllTeams);
            setCurrentTeam(updatedTeam);
            saveLocalTeams(updatedAllTeams);
            return;
        }
        await updateDoc(doc(db, 'teams', currentTeam.id), updateData);
    };

    const handleJoinCode = (code: string): string | null => {
        const now = new Date().getTime();
        const team = allTeams.find(t => {
            if (t.inviteCode === code) {
                if (!t.inviteCodeCreatedAt) return true; // Legacy support
                const createdAt = new Date(t.inviteCodeCreatedAt).getTime();
                if (isNaN(createdAt)) return true; // Safety
                return (now - createdAt) < INVITE_EXPIRATION_MS;
            }
            if (t.adminInviteCode === code) {
                if (!t.adminInviteCodeCreatedAt) return true; // Legacy support
                const createdAt = new Date(t.adminInviteCodeCreatedAt).getTime();
                if (isNaN(createdAt)) return true; // Safety
                return (now - createdAt) < INVITE_EXPIRATION_MS;
            }
            return false;
        });
        return team?.id || null;
    };

    const handleRefreshInviteCodes = async () => {
        if (!currentTeam) return;
        await performUpdate({
            inviteCodeCreatedAt: new Date(),
            adminInviteCodeCreatedAt: new Date()
        });
    };

    const handleSignUp = async (details: any, password: string, teamId: string, isAdmin: boolean, autoApprove?: boolean) => {
        if (!db) return "Database connection missing.";
        try {
            let uid: string;
            if (auth?.currentUser) {
                uid = auth.currentUser.uid;
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
                uid = userCredential.user.uid;
            }

            const newUser: TeamMember = {
                ...details,
                id: uid, 
                status: (isAdmin || autoApprove) ? 'active' : 'pending-approval',
                permissions: isAdmin ? ['admin'] : [], 
                skills: [], 
                checkIns: [], 
                availability: {}, 
                awardedAchievements: []
            };

            const teamRef = doc(db, 'teams', teamId);
            const teamSnap = await getDoc(teamRef);
            if (!teamSnap.exists()) return "Team not found.";
            const teamData = teamSnap.data() as Team;
            
            if (teamData.members.some(m => m.id === uid)) return "You are already a member of this team.";
            
            await updateDoc(teamRef, { members: [...teamData.members, newUser] });
            return true;
        } catch (err: any) {
            return err.message || "Failed to sign up.";
        }
    };

    const handleAdminRegistration = async (teamName: string, type: TeamType, details: SignUpDetails, password: string, description?: string, focusAreas?: string[]): Promise<string | boolean> => {
        if (!auth && !isDemoMode) return "Firebase not initialized.";
        try {
            let uid = `local_${Date.now()}`;
            if (auth) {
                const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
                uid = userCredential.user.uid;
            }
            const newUser: TeamMember = { ...details, id: uid, status: 'active', permissions: ['admin'], skills: [], checkIns: [], availability: {}, awardedAchievements: [] };
            const template = await generateTeamTemplate(description || teamName, focusAreas).catch(() => ({ roles: [], skills: [], features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, achievements: [] }));
            const teamId = `team_${Date.now()}`;
            const newTeam: Team = {
                id: teamId, name: teamName, type, description,
                features: { ...template.features, childCheckIn: type === 'youth' && (focusAreas?.includes('childCheckIn') || false), inventory: focusAreas?.includes('inventory') || false },
                members: [newUser], roles: template.roles, skills: template.skills, achievements: template.achievements,
                inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                inviteCodeCreatedAt: new Date(),
                adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM',
                adminInviteCodeCreatedAt: new Date(),
                announcements: [], scriptures: [], serviceEvents: [],
            };
            if (isDemoMode || !db) {
                const updatedAllTeams = [...allTeams, newTeam];
                saveLocalTeams(updatedAllTeams);
                setAllTeams(updatedAllTeams);
                setMyTeams([newTeam]);
                setCurrentTeam(newTeam);
                setCurrentUser(newUser);
                return true;
            }
            await setDoc(doc(db, 'teams', teamId), newTeam);
            return true;
        } catch (err: any) {
            return err.message || "Failed to create team.";
        }
    };

    const handleForgotPassword = async (email: string) => {
        if (!auth) return "Auth service unavailable.";
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error: any) {
            return error.message || "Failed to send reset email.";
        }
    };

    const handleRemoveAnnouncement = async (announcementId: string) => {
        if (!currentTeam) return;
        const newAnnouncements = (currentTeam.announcements || []).filter(a => a.id !== announcementId);
        await performUpdate({ announcements: newAnnouncements });
    };

    const handleAddPrayerPoint = async (text: string) => {
        if (!currentTeam) return;
        const newPoint = { id: `prayer_${Date.now()}`, text };
        const newPoints = [...(currentTeam.customPrayerPoints || []), newPoint];
        await performUpdate({ customPrayerPoints: newPoints });
    };

    const handleRemovePrayerPoint = async (pointId: string) => {
        if (!currentTeam) return;
        if (pointId.startsWith('ai_')) {
            const deletedIds = [...(currentTeam.deletedAiPrayerPointIds || []), pointId];
            await performUpdate({ deletedAiPrayerPointIds: deletedIds });
        } else {
            const newPoints = (currentTeam.customPrayerPoints || []).filter(p => p.id !== pointId);
            await performUpdate({ customPrayerPoints: newPoints });
        }
    };

    const handleMarkAsRead = async (announcementIds: string[]) => {
        if (!currentTeam || !currentUser) return;
        const newAnnouncements = (currentTeam.announcements || []).map(ann => {
            if (announcementIds.includes(ann.id)) {
                const readBy = Array.from(new Set([...(ann.readBy || []), currentUser.id]));
                return { ...ann, readBy };
            }
            return ann;
        });
        await performUpdate({ announcements: newAnnouncements });
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!currentTeam) return;
        const newMembers = currentTeam.members.filter(m => m.id !== memberId);
        await performUpdate({ members: newMembers });
    };

    const handleResetTeam = async (teamId: string, adminToKeepId: string) => {
        if (!currentTeam) return;
        const admin = currentTeam.members.find(m => m.id === adminToKeepId);
        await performUpdate({
            members: admin ? [admin] : [],
            announcements: [],
            serviceEvents: [],
            customPrayerPoints: [],
            deletedAiPrayerPointIds: [],
            videoAnalyses: [],
            trainingVideos: [],
            children: [],
            inventory: []
        });
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (isDemoMode || !db) {
            const updatedAllTeams = allTeams.filter(t => t.id !== teamId);
            setAllTeams(updatedAllTeams);
            setMyTeams(myTeams.filter(t => t.id !== teamId));
            if (currentTeam?.id === teamId) setCurrentTeam(null);
            saveLocalTeams(updatedAllTeams);
            return;
        }
        await deleteDoc(doc(db, 'teams', teamId));
    };

    const handleUpdateCurrentUser = async (user: TeamMember) => {
        if (!currentTeam) return;
        setCurrentUser(user);
        const newMembers = currentTeam.members.map(m => m.id === user.id ? user : m);
        await performUpdate({ members: newMembers });
    };

    const handleLeaveTeam = async () => {
        if (!currentTeam || !currentUser) return;
        await handleRemoveMember(currentUser.id);
        setCurrentTeam(null);
        setCurrentUser(null);
    };

    const handleAddChild = async (childData: any) => {
        if (!currentTeam) return;
        const newChild = { ...childData, id: `child_${Date.now()}`, status: 'checked-out' };
        await performUpdate({ children: [...(currentTeam.children || []), newChild] });
    };

    const handleUpdateChild = async (child: Child) => {
        if (!currentTeam) return;
        const newChildren = (currentTeam.children || []).map(c => c.id === child.id ? child : c);
        await performUpdate({ children: newChildren });
    };

    const handleDeleteChild = async (childId: string) => {
        if (!currentTeam) return;
        const newChildren = (currentTeam.children || []).filter(c => c.id !== childId);
        await performUpdate({ children: newChildren });
    };

    const handleAddInventoryItem = async (itemData: any) => {
        if (!currentTeam) return;
        const newItem = { ...itemData, id: `inv_${Date.now()}`, status: 'available' };
        await performUpdate({ inventory: [...(currentTeam.inventory || []), newItem] });
    };

    const handleUpdateInventoryItem = async (item: InventoryItem) => {
        if (!currentTeam) return;
        const newInventory = (currentTeam.inventory || []).map(i => i.id === item.id ? item : i);
        await performUpdate({ inventory: newInventory });
    };

    const handleDeleteInventoryItem = async (itemId: string) => {
        if (!currentTeam) return;
        const newInventory = (currentTeam.inventory || []).filter(i => i.id !== itemId);
        await performUpdate({ inventory: newInventory });
    };

    const handleCheckOutItem = async (itemId: string, memberId: string) => {
        if (!currentTeam) return;
        const newInventory = (currentTeam.inventory || []).map(i => 
            i.id === itemId ? { ...i, status: 'in-use', assignedTo: memberId } : i
        );
        await performUpdate({ inventory: newInventory });
    };

    const handleCheckInItem = async (itemId: string) => {
        if (!currentTeam) return;
        const newInventory = (currentTeam.inventory || []).map(i => 
            i.id === itemId ? { ...i, status: 'available', assignedTo: undefined } : i
        );
        await performUpdate({ inventory: newInventory });
    };

    const handleAddShoutOut = async (toId: string, message: string) => {
        if (!currentTeam || !currentUser) return;
        const newShoutOut = {
            id: `so_${Date.now()}`,
            fromId: currentUser.id,
            toId,
            message,
            date: new Date()
        };
        await performUpdate({ shoutOuts: [...(currentTeam.shoutOuts || []), newShoutOut] });
    };

    const handleAddAnnouncement = async (title: string, content: string) => {
        if (!currentTeam || !currentUser) return;
        const newAnnouncement = {
            id: `ann_${Date.now()}`,
            title,
            content,
            date: new Date(),
            authorId: currentUser.id,
            readBy: []
        };
        await performUpdate({ announcements: [...(currentTeam.announcements || []), newAnnouncement] });
    };

    const handleCreateTeam = async (teamName: string, type: TeamType, description?: string, focusAreas?: string[]) => {
        if (!currentUser) return "Must be logged in.";
        const template = await generateTeamTemplate(description || teamName, focusAreas).catch(() => ({ roles: [], skills: [], features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, achievements: [] }));
        const teamId = `team_${Date.now()}`;
        const newTeam: Team = {
            id: teamId, name: teamName, type, description,
            features: { ...template.features, childCheckIn: type === 'youth' && (focusAreas?.includes('childCheckIn') || false), inventory: focusAreas?.includes('inventory') || false },
            members: [{ ...currentUser, status: 'active', permissions: ['admin'] }], 
            roles: template.roles, skills: template.skills, achievements: template.achievements,
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            inviteCodeCreatedAt: new Date(),
            adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM',
            adminInviteCodeCreatedAt: new Date(),
            announcements: [], scriptures: [], serviceEvents: [],
        };
        if (isDemoMode || !db) {
            const updatedAllTeams = [...allTeams, newTeam];
            saveLocalTeams(updatedAllTeams);
            setAllTeams(updatedAllTeams);
            setMyTeams([...myTeams, newTeam]);
            return true;
        }
        await setDoc(doc(db, 'teams', teamId), newTeam);
        return true;
    };

    const handleAddVideoAnalysis = async (analysis: VideoAnalysis) => {
        if (!currentTeam) return;
        await performUpdate({ videoAnalyses: [...(currentTeam.videoAnalyses || []), analysis] });
    };

    const handleAddTrainingVideo = async (videoData: any) => {
        if (!currentTeam || !currentUser) return;
        const newVideo = {
            ...videoData,
            id: `vid_${Date.now()}`,
            uploadedBy: currentUser.id,
            dateAdded: new Date()
        };
        await performUpdate({ trainingVideos: [...(currentTeam.trainingVideos || []), newVideo] });
    };

    const handleUpdateTrainingVideo = async (video: TrainingVideo) => {
        if (!currentTeam) return;
        const newVideos = (currentTeam.trainingVideos || []).map(v => v.id === video.id ? video : v);
        await performUpdate({ trainingVideos: newVideos });
    };

    const handleDeleteTrainingVideo = async (videoId: string) => {
        if (!currentTeam) return;
        const newVideos = (currentTeam.trainingVideos || []).filter(v => v.id !== videoId);
        await performUpdate({ trainingVideos: newVideos });
    };

    const handleAddFaq = async (item: FaqItem) => {
        if (!currentTeam) return;
        await performUpdate({ faqs: [...(currentTeam.faqs || []), item] });
    };

    const handleUpdateFaq = async (item: FaqItem) => {
        if (!currentTeam) return;
        const newFaqs = (currentTeam.faqs || []).map(f => f.id === item.id ? item : f);
        await performUpdate({ faqs: newFaqs });
    };

    const handleDeleteFaq = async (itemId: string) => {
        if (!currentTeam) return;
        const newFaqs = (currentTeam.faqs || []).filter(f => f.id !== itemId);
        await performUpdate({ faqs: newFaqs });
    };

    return {
        allUsers: allTeams.flatMap(t => t.members),
        allTeams: allTeams,
        myTeams: myTeams,
        currentUser, currentTeam, 
        isDataLoaded: isDataLoaded && !authLoading,
        isDemoMode,
        handleLogin, handleLogout, handleAdminRegistration, handleSignUp,
        handleJoinCode,
        handleRefreshInviteCodes,
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
                const userId = auth?.currentUser?.uid || localStorage.getItem('currentUserId');
                const member = team.members.find(m => m.id === userId);
                setCurrentUser(member || team.members[0]);
            }
        },
        handleChildCheckIn: (childId: string) => {
            if (!currentTeam || !currentUser) return;
            const newLog: CheckInLogEntry = { id: `log_${Date.now()}`, timestamp: new Date(), type: 'in', processedByName: currentUser.name };
            performUpdate({ children: (currentTeam.children || []).map(c => c.id === childId ? { ...c, status: 'checked-in', lastCheckIn: new Date(), lastProcessedByName: currentUser.name, checkInHistory: [newLog, ...(c.checkInHistory || [])] } : c) });
        },
        handleChildCheckOut: (childId: string) => {
            if (!currentTeam || !currentUser) return;
            const newLog: CheckInLogEntry = { id: `log_${Date.now()}`, timestamp: new Date(), type: 'out', processedByName: currentUser.name };
            performUpdate({ children: (currentTeam.children || []).map(c => c.id === childId ? { ...c, status: 'checked-out', lastCheckOut: new Date(), lastProcessedByName: currentUser.name, checkInHistory: [newLog, ...(c.checkInHistory || [])] } : c) });
        },
        handleCheckIn: async (eventId: string, location: { latitude: number; longitude: number; }) => {
            if (!currentUser || !currentTeam) return;
            const updatedUser = { ...currentUser, checkIns: [...(currentUser.checkIns || []), { eventId, checkInTime: new Date(), location }] };
            const newMembers = currentTeam.members.map(m => m.id === currentUser.id ? updatedUser : m);
            await performUpdate({ members: newMembers });
        },
        handleUpdateEvent: async (updatedEvent: ServiceEvent) => {
            if (!currentTeam) return;
            const newEvents = currentTeam.serviceEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e);
            await performUpdate({ serviceEvents: newEvents });
        },
        handleDemoMode,
        handleForgotPassword,
        handleRemoveAnnouncement,
        handleAddPrayerPoint,
        handleRemovePrayerPoint,
        handleMarkAsRead,
        handleRemoveMember,
        handleResetTeam,
        handleDeleteTeam,
        handleUpdateCurrentUser,
        handleLeaveTeam,
        handleAddChild,
        handleUpdateChild,
        handleDeleteChild,
        handleAddInventoryItem,
        handleUpdateInventoryItem,
        handleDeleteInventoryItem,
        handleCheckOutItem,
        handleCheckInItem,
        handleAddShoutOut,
        handleAddAnnouncement,
        handleCreateTeam,
        handleAddVideoAnalysis,
        handleAddTrainingVideo,
        handleUpdateTrainingVideo,
        handleDeleteTrainingVideo,
        handleAddFaq,
        handleUpdateFaq,
        handleDeleteFaq
    };
};