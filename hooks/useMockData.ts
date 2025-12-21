
import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember, ServiceEvent, Role, Skill, Announcement, ShoutOut, PrayerPoint, VideoAnalysis, FaqItem, TrainingVideo, Scripture, TeamType, TeamFeatures, Achievement, Child, InventoryItem, Department, Assignment } from '../types.ts';
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
    getDoc
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';

const reviveDates = (data: any): any => {
    if (Array.isArray(data)) return data.map(reviveDates);
    if (data && typeof data === 'object') {
        const newData: any = {};
        for (const key in data) {
            const value = data[key];
            if (value && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key === 'birthday' || key === 'timestamp')) {
                if (value && typeof value === 'object' && 'seconds' in value) {
                    newData[key] = new Date(value.seconds * 1000);
                } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
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

export const useMockData = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    // 1. Listen for Auth Changes
    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            setIsDataLoaded(true);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, we'll wait for the teams snapshot to find them
                setAuthLoading(false);
            } else {
                setCurrentUser(null);
                setCurrentTeam(null);
                setAuthLoading(false);
                setIsDataLoaded(true);
            }
        });

        return () => unsubscribe();
    }, []);

    // 2. Listen for Teams data (Filtered for current user)
    useEffect(() => {
        if (!db || !auth?.currentUser) {
            // Local mode fallback
            if (!db) {
                const savedTeams = localStorage.getItem('teams');
                if (savedTeams) setTeams(reviveDates(JSON.parse(savedTeams)));
                setIsDataLoaded(true);
            }
            return;
        }

        // Only listen for teams where the user is a member
        const q = collection(db, 'teams');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allTeams = snapshot.docs.map(doc => reviveDates({ ...doc.data(), id: doc.id })) as Team[];
            const myTeamsList = allTeams.filter(t => t.members.some(m => m.id === auth.currentUser?.uid));
            
            setTeams(myTeamsList);
            
            const savedTeamId = localStorage.getItem('currentTeamId');
            const targetTeam = myTeamsList.find(t => t.id === savedTeamId) || myTeamsList[0];
            
            if (targetTeam) {
                const member = targetTeam.members.find(m => m.id === auth.currentUser?.uid);
                setCurrentUser(member || null);
                setCurrentTeam(targetTeam);
                if (targetTeam.id) localStorage.setItem('currentTeamId', targetTeam.id);
            }

            setIsDataLoaded(true);
        });

        return () => unsubscribe();
    }, [authLoading]);

    const handleLogin = async (email: string, password: string): Promise<string | boolean> => {
        if (!auth) return "Firebase not configured.";
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error: any) {
            return error.message || "Invalid email or password.";
        }
    };

    const handleLogout = async () => {
        if (auth) await signOut(auth);
        setCurrentUser(null);
        setCurrentTeam(null);
        localStorage.removeItem('currentTeamId');
    };

    const handleUpdateEvent = async (updatedEvent: ServiceEvent) => {
        if (!currentTeam || !db) return;
        const newEvents = currentTeam.serviceEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e);
        await updateDoc(doc(db, 'teams', currentTeam.id), { serviceEvents: newEvents });
    };

    const handleCheckIn = async (eventId: string, location: { latitude: number; longitude: number; }) => {
        if (!currentUser || !currentTeam || !db) return;
        const updatedUser = { ...currentUser, checkIns: [...(currentUser.checkIns || []), { eventId, checkInTime: new Date(), location }] };
        const newMembers = currentTeam.members.map(m => m.id === currentUser.id ? updatedUser : m);
        await updateDoc(doc(db, 'teams', currentTeam.id), { members: newMembers });
    };

    const handleAdminRegistration = async (teamName: string, type: TeamType, details: any, password: string, description?: string, focusAreas?: string[]) => {
        if (!auth || !db) return "Firebase not configured.";
        
        let template;
        try {
            template = await generateTeamTemplate(description || teamName, focusAreas);
        } catch (e) {
            template = { roles: [], skills: [], features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, achievements: [] };
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
            const uid = userCredential.user.uid;
            const teamId = `team_${Date.now()}`;
            
            const newAdmin: TeamMember = { 
                ...details, 
                id: uid, 
                status: 'active', 
                permissions: ['admin'], 
                skills: [], 
                checkIns: [], 
                availability: {}, 
                awardedAchievements: [] 
            };

            const newTeam: Team = {
                id: teamId, name: teamName, type, description,
                features: { 
                    ...template.features, 
                    childCheckIn: type === 'youth' && (focusAreas?.includes('childCheckIn') || false), 
                    inventory: focusAreas?.includes('inventory') || false 
                },
                members: [newAdmin], roles: template.roles, skills: template.skills, achievements: template.achievements,
                inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM',
                announcements: [], scriptures: [], serviceEvents: [],
            };

            await setDoc(doc(db, 'teams', teamId), newTeam);
            return true;
        } catch (err: any) {
            return err.message || "Failed to create account.";
        }
    };

    const handleSignUp = async (details: any, password: string, teamId: string, isAdmin: boolean, autoApprove?: boolean) => {
        if (!auth || !db) return "Firebase not configured.";
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
            const uid = userCredential.user.uid;
            
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

            // Get current team data to append
            const teamRef = doc(db, 'teams', teamId);
            const teamSnap = await getDoc(teamRef);
            if (!teamSnap.exists()) return "Team not found.";
            
            const teamData = teamSnap.data() as Team;
            await updateDoc(teamRef, {
                members: [...teamData.members, newUser]
            });

            return true;
        } catch (err: any) {
            return err.message || "Failed to sign up.";
        }
    };

    const handleUpdateTeam = async (updatedData: Partial<Team>) => {
        if (!currentTeam || !db) return;
        await updateDoc(doc(db, 'teams', currentTeam.id), updatedData);
    };

    const handleUpdateMember = async (member: TeamMember) => {
        if (!currentTeam || !db) return;
        const newMembers = currentTeam.members.map(m => m.id === member.id ? member : m);
        await updateDoc(doc(db, 'teams', currentTeam.id), { members: newMembers });
    };

    const handleAddAnnouncement = async (title: string, content: string) => {
        if (!currentTeam || !currentUser || !db) return;
        const newAnnouncement: Announcement = { 
            id: `ann_${Date.now()}`, 
            title, 
            content, 
            date: new Date(), 
            authorId: currentUser.id, 
            readBy: [currentUser.id] 
        };
        await updateDoc(doc(db, 'teams', currentTeam.id), {
            announcements: [...(currentTeam.announcements || []), newAnnouncement]
        });
    };

    const handleSwitchTeam = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setCurrentTeam(team);
            localStorage.setItem('currentTeamId', teamId);
        }
    };

    const handleJoinCode = (code: string) => {
        // This remains client-side lookup because invite codes are shared
        const team = teams.find(t => t.inviteCode === code || t.adminInviteCode === code);
        return team?.id || null;
    };

    return {
        allUsers: teams.flatMap(t => t.members),
        allTeams: teams,
        myTeams: teams, // already filtered by auth query
        currentUser, currentTeam, isDataLoaded: isDataLoaded && !authLoading,
        handleLogin, handleLogout, handleUpdateEvent, handleCheckIn, handleAdminRegistration, handleJoinCode, 
        isAdminCode: (code: string) => teams.some(t => t.adminInviteCode === code), 
        handleSignUp, handleUpdateTeam, handleUpdateMember, handleAddAnnouncement, handleSwitchTeam,
        // FIX: Implemented missing data handlers required by App.tsx
        handleExternalInvite: (joinCode: string, teamName: string, teamType: TeamType, features?: TeamFeatures) => {
            if (teams.some(t => t.inviteCode === joinCode || t.adminInviteCode === joinCode)) return;
            const stubTeam: Team = {
                id: `external_${joinCode}`,
                name: teamName,
                type: teamType,
                inviteCode: joinCode,
                adminInviteCode: `${joinCode}_ADM`,
                features: features || { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false },
                members: [],
                roles: [],
                skills: [],
                announcements: [],
                scriptures: [],
                serviceEvents: []
            };
            setTeams(prev => [...prev, stubTeam]);
        },
        handleRemoveAnnouncement: async (id: string) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { announcements: currentTeam.announcements.filter(a => a.id !== id) });
        },
        handleAddPrayerPoint: async (text: string) => {
            if (!currentTeam || !db) return;
            const newPoint = { id: `prayer_${Date.now()}`, text };
            await updateDoc(doc(db, 'teams', currentTeam.id), { customPrayerPoints: [...(currentTeam.customPrayerPoints || []), newPoint] });
        },
        handleRemovePrayerPoint: async (id: string) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { customPrayerPoints: (currentTeam.customPrayerPoints || []).filter(p => p.id !== id) });
        },
        handleMarkAsRead: async (announcementIds: string[]) => {
            if (!currentTeam || !currentUser || !db) return;
            const updatedAnnouncements = currentTeam.announcements.map(ann => {
                if (announcementIds.includes(ann.id)) {
                    const readBy = new Set(ann.readBy || []);
                    readBy.add(currentUser.id);
                    return { ...ann, readBy: Array.from(readBy) };
                }
                return ann;
            });
            await updateDoc(doc(db, 'teams', currentTeam.id), { announcements: updatedAnnouncements });
        },
        handleRemoveMember: async (memberId: string) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { members: currentTeam.members.filter(m => m.id !== memberId) });
        },
        handleUpdateCurrentUser: (user: TeamMember) => handleUpdateMember(user),
        handleAddShoutOut: async (toId: string, message: string) => {
            if (!currentTeam || !currentUser || !db) return;
            const newShoutOut: ShoutOut = { id: `so_${Date.now()}`, fromId: currentUser.id, toId, message, date: new Date() };
            await updateDoc(doc(db, 'teams', currentTeam.id), { shoutOuts: [...(currentTeam.shoutOuts || []), newShoutOut] });
        },
        handleResetTeam: async (teamId: string, adminToKeepId: string) => {
            if (!db) return;
            const teamRef = doc(db, 'teams', teamId);
            const teamSnap = await getDoc(teamRef);
            if (!teamSnap.exists()) return;
            const teamData = teamSnap.data() as Team;
            const adminToKeep = teamData.members.find(m => m.id === adminToKeepId);
            if (!adminToKeep) return;
            await updateDoc(teamRef, {
                members: [adminToKeep],
                serviceEvents: [],
                announcements: [],
                shoutOuts: [],
                customPrayerPoints: [],
                videoAnalyses: [],
                children: [],
                inventory: []
            });
        },
        handleAddVideoAnalysis: async (analysis: VideoAnalysis) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { videoAnalyses: [...(currentTeam.videoAnalyses || []), analysis] });
        },
        handleAddTrainingVideo: async (videoData: Omit<TrainingVideo, 'id' | 'uploadedBy' | 'dateAdded'>) => {
            if (!currentTeam || !currentUser || !db) return;
            const newVideo: TrainingVideo = { ...videoData, id: `vid_${Date.now()}`, uploadedBy: currentUser.id, dateAdded: new Date() };
            await updateDoc(doc(db, 'teams', currentTeam.id), { trainingVideos: [...(currentTeam.trainingVideos || []), newVideo] });
        },
        handleUpdateTrainingVideo: async (video: TrainingVideo) => {
            if (!currentTeam || !db) return;
            const updatedVideos = (currentTeam.trainingVideos || []).map(v => v.id === video.id ? video : v);
            await updateDoc(doc(db, 'teams', currentTeam.id), { trainingVideos: updatedVideos });
        },
        handleDeleteTrainingVideo: async (videoId: string) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { trainingVideos: (currentTeam.trainingVideos || []).filter(v => v.id !== videoId) });
        },
        handleAddFaq: async (item: FaqItem) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { faqs: [...(currentTeam.faqs || []), item] });
        },
        handleUpdateFaq: async (item: FaqItem) => {
            if (!currentTeam || !db) return;
            const updatedFaqs = (currentTeam.faqs || []).map(f => f.id === item.id ? item : f);
            await updateDoc(doc(db, 'teams', currentTeam.id), { faqs: updatedFaqs });
        },
        handleDeleteFaq: async (itemId: string) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { faqs: (currentTeam.faqs || []).filter(f => f.id !== itemId) });
        },
        handleAddChild: async (childData: Omit<Child, 'id' | 'status' | 'lastCheckIn' | 'lastCheckOut' | 'checkedInBy'>) => {
            if (!currentTeam || !db) return;
            const newChild: Child = { ...childData, id: `child_${Date.now()}`, status: 'checked-out' };
            await updateDoc(doc(db, 'teams', currentTeam.id), { children: [...(currentTeam.children || []), newChild] });
        },
        handleUpdateChild: async (child: Child) => {
            if (!currentTeam || !db) return;
            const updatedChildren = (currentTeam.children || []).map(c => c.id === child.id ? child : c);
            await updateDoc(doc(db, 'teams', currentTeam.id), { children: updatedChildren });
        },
        handleDeleteChild: async (childId: string) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { children: (currentTeam.children || []).filter(c => c.id !== childId) });
        },
        handleChildCheckIn: async (childId: string) => {
            if (!currentTeam || !db) return;
            const updatedChildren = (currentTeam.children || []).map(c => c.id === childId ? { ...c, status: 'checked-in' as const, lastCheckIn: new Date() } : c);
            await updateDoc(doc(db, 'teams', currentTeam.id), { children: updatedChildren });
        },
        handleChildCheckOut: async (childId: string) => {
            if (!currentTeam || !db) return;
            const updatedChildren = (currentTeam.children || []).map(c => c.id === childId ? { ...c, status: 'checked-out' as const, lastCheckOut: new Date() } : c);
            await updateDoc(doc(db, 'teams', currentTeam.id), { children: updatedChildren });
        },
        handleAddInventoryItem: async (itemData: Omit<InventoryItem, 'id' | 'status'>) => {
            if (!currentTeam || !db) return;
            const newItem: InventoryItem = { ...itemData, id: `inv_${Date.now()}`, status: 'available' };
            await updateDoc(doc(db, 'teams', currentTeam.id), { inventory: [...(currentTeam.inventory || []), newItem] });
        },
        handleUpdateInventoryItem: async (item: InventoryItem) => {
            if (!currentTeam || !db) return;
            const updatedInventory = (currentTeam.inventory || []).map(i => i.id === item.id ? item : i);
            await updateDoc(doc(db, 'teams', currentTeam.id), { inventory: updatedInventory });
        },
        handleDeleteInventoryItem: async (itemId: string) => {
            if (!currentTeam || !db) return;
            await updateDoc(doc(db, 'teams', currentTeam.id), { inventory: (currentTeam.inventory || []).filter(i => i.id !== itemId) });
        },
        handleCheckOutItem: async (itemId: string, memberId: string) => {
            if (!currentTeam || !db) return;
            const updatedInventory = (currentTeam.inventory || []).map(i => i.id === itemId ? { ...i, status: 'in-use' as const, assignedTo: memberId } : i);
            await updateDoc(doc(db, 'teams', currentTeam.id), { inventory: updatedInventory });
        },
        handleCheckInItem: async (itemId: string) => {
            if (!currentTeam || !db) return;
            const updatedInventory = (currentTeam.inventory || []).map(i => i.id === itemId ? { ...i, status: 'available' as const, assignedTo: undefined } : i);
            await updateDoc(doc(db, 'teams', currentTeam.id), { inventory: updatedInventory });
        },
        handleCreateTeam: async (teamName: string, type: TeamType, description?: string, focusAreas?: string[]) => {
            if (!currentUser || !db) return "Not logged in.";
            let template;
            try {
                template = await generateTeamTemplate(description || teamName, focusAreas);
            } catch (e) {
                template = { roles: [], skills: [], features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, achievements: [] };
            }
            const teamId = `team_${Date.now()}`;
            const newTeam: Team = {
                id: teamId, name: teamName, type, description,
                features: { ...template.features, childCheckIn: type === 'youth' && (focusAreas?.includes('childCheckIn') || false), inventory: focusAreas?.includes('inventory') || false },
                members: [{...currentUser, permissions: ['admin']}],
                roles: template.roles, skills: template.skills, achievements: template.achievements,
                inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM',
                announcements: [], scriptures: [], serviceEvents: [],
            };
            try {
                await setDoc(doc(db, 'teams', teamId), newTeam);
                return true;
            } catch (err: any) {
                return err.message || "Failed to create team.";
            }
        },
    };
};
