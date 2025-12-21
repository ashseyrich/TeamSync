
import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember, ServiceEvent, Role, Skill, Announcement, ShoutOut, PrayerPoint, VideoAnalysis, FaqItem, TrainingVideo, Scripture, TeamType, TeamFeatures, Achievement, Child, InventoryItem, Department, Assignment, CheckInLogEntry } from '../types.ts';
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
    deleteDoc
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    deleteUser
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
    const [isDemoMode, setIsDemoMode] = useState(localStorage.getItem('is_demo_mode') === 'true');

    // Persistence helper for local mode
    const saveLocalTeams = (updatedTeams: Team[]) => {
        localStorage.setItem('teams', JSON.stringify(updatedTeams));
    };

    // 1. Listen for Auth Changes
    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            setIsDataLoaded(true);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsDemoMode(false);
                setAuthLoading(false);
            } else {
                if (!isDemoMode) {
                    setCurrentUser(null);
                    setCurrentTeam(null);
                }
                setAuthLoading(false);
                setIsDataLoaded(true);
            }
        });

        return () => unsubscribe();
    }, [isDemoMode]);

    // 2. Listen for Teams data
    useEffect(() => {
        if (isDemoMode || !db || !auth?.currentUser) {
            const savedTeamsStr = localStorage.getItem('teams');
            if (savedTeamsStr) {
                try {
                    const localTeams = reviveDates(JSON.parse(savedTeamsStr));
                    setTeams(localTeams);
                    const savedTeamId = localStorage.getItem('currentTeamId');
                    const savedUserId = localStorage.getItem('currentUserId');
                    
                    const targetTeam = localTeams.find((t: Team) => t.id === savedTeamId) || localTeams[0];
                    if (targetTeam) {
                        setCurrentTeam(targetTeam);
                        const member = targetTeam.members.find((m: TeamMember) => m.id === savedUserId);
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
            } else {
                setCurrentTeam(null);
                setCurrentUser(null);
            }
            setIsDataLoaded(true);
        });

        return () => unsubscribe();
    }, [authLoading, isDemoMode]);

    const handleLogin = async (email: string, password: string): Promise<string | boolean> => {
        if (!auth) return "Firebase not configured.";
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setIsDemoMode(false);
            localStorage.removeItem('is_demo_mode');
            return true;
        } catch (error: any) {
            return error.message || "Invalid email or password.";
        }
    };

    const handleForgotPassword = async (email: string): Promise<string | boolean> => {
        if (isDemoMode || !auth) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(true), 1000);
            });
        }
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error: any) {
            return error.message || "Failed to send reset email.";
        }
    };

    const handleDemoMode = (roleType: 'admin' | 'member') => {
        setIsDemoMode(true);
        localStorage.setItem('is_demo_mode', 'true');
        
        const demoTeamId = 'demo_team_123';
        const demoAdmin: TeamMember = {
            id: 'demo_admin',
            name: 'Guest Admin',
            username: 'admin',
            status: 'active',
            permissions: ['admin'],
            skills: [{ skillId: 'skill1', proficiency: Proficiency.MASTER_TRAINER }],
            checkIns: [],
            availability: {},
        };
        const demoMember: TeamMember = {
            id: 'demo_member',
            name: 'Guest Volunteer',
            username: 'volunteer',
            status: 'active',
            permissions: [],
            skills: [{ skillId: 'skill2', proficiency: Proficiency.NOVICE }],
            checkIns: [],
            availability: {},
            suggestedGrowthAreas: ['Audio Mixing', 'Timeliness']
        };
        const pendingMember: TeamMember = {
            id: 'demo_pending',
            name: 'New Applicant',
            username: 'newbie',
            email: 'newbie@example.com',
            status: 'pending-approval',
            permissions: [],
            skills: [],
            checkIns: [],
            availability: {},
        };

        const roles = [
            { id: 'role1', name: 'Lead Audio Engineer', requiredSkillId: 'skill1' },
            { id: 'role2', name: 'Camera Operator', requiredSkillId: 'skill2' }
        ];

        const nextSunday = new Date();
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
        nextSunday.setHours(10, 0, 0, 0);
        const callTime = new Date(nextSunday);
        callTime.setHours(8, 30, 0, 0);

        const demoTeam: Team = {
            id: demoTeamId,
            name: 'Demo Church Media',
            type: 'media',
            features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: true },
            members: [demoAdmin, demoMember, pendingMember],
            roles,
            skills: [{ id: 'skill1', name: 'Audio Mixing' }, { id: 'skill2', name: 'Camera Operation' }],
            inviteCode: 'DEMO123',
            adminInviteCode: 'DEMOADM',
            announcements: [{ id: 'ann1', title: 'Welcome to TeamSync!', content: 'Check out the AI Review tab to analyze your last service.', date: new Date(), authorId: 'demo_admin', readBy: [] }],
            scriptures: [],
            serviceEvents: [{
                id: 'event1',
                name: 'Sunday Worship Service',
                date: nextSunday,
                callTime: callTime,
                assignments: [
                    { roleId: 'role1', memberId: 'demo_admin' },
                    { roleId: 'role2', memberId: 'demo_member' }
                ],
                location: { address: '123 Church Way' }
            }],
        };

        const activeTeams = [demoTeam];
        setTeams(activeTeams);
        saveLocalTeams(activeTeams);
        setCurrentTeam(demoTeam);
        
        const activeUser = roleType === 'admin' ? demoAdmin : demoMember;
        setCurrentUser(activeUser);
        localStorage.setItem('currentTeamId', demoTeamId);
        localStorage.setItem('currentUserId', activeUser.id);
    };

    const handleLogout = async () => {
        if (auth) await signOut(auth);
        setIsDemoMode(false);
        setCurrentUser(null);
        setCurrentTeam(null);
        localStorage.removeItem('currentTeamId');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('is_demo_mode');
    };

    const performUpdate = async (updateData: any) => {
        if (isDemoMode || !db || !currentTeam) {
            const updatedTeam = { ...currentTeam, ...updateData } as Team;
            const updatedTeams = teams.map(t => t.id === currentTeam?.id ? updatedTeam : t);
            setTeams(updatedTeams);
            setCurrentTeam(updatedTeam);
            saveLocalTeams(updatedTeams);
            return;
        }
        await updateDoc(doc(db, 'teams', currentTeam.id), updateData);
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!currentTeam || currentTeam.id !== teamId) return;

        if (isDemoMode || !db) {
            const updatedTeams = teams.filter(t => t.id !== teamId);
            setTeams(updatedTeams);
            saveLocalTeams(updatedTeams);
            
            if (updatedTeams.length === 0) {
                await handleLogout();
            } else {
                setCurrentTeam(updatedTeams[0]);
                setCurrentUser(updatedTeams[0].members[0] || null);
            }
            return;
        }

        // Real Firebase delete
        await deleteDoc(doc(db, 'teams', teamId));
        // The onSnapshot will automatically update 'teams' and clear currentTeam if no teams remain.
    };

    const handleUpdateEvent = async (updatedEvent: ServiceEvent) => {
        if (!currentTeam) return;
        const newEvents = currentTeam.serviceEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e);
        await performUpdate({ serviceEvents: newEvents });
    };

    const handleCheckIn = async (eventId: string, location: { latitude: number; longitude: number; }) => {
        if (!currentUser || !currentTeam) return;
        const updatedUser = { ...currentUser, checkIns: [...(currentUser.checkIns || []), { eventId, checkInTime: new Date(), location }] };
        const newMembers = currentTeam.members.map(m => m.id === currentUser.id ? updatedUser : m);
        await performUpdate({ members: newMembers });
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
            const teamRef = doc(db, 'teams', teamId);
            const teamSnap = await getDoc(teamRef);
            if (!teamSnap.exists()) return "Team not found.";
            const teamData = teamSnap.data() as Team;
            await updateDoc(teamRef, { members: [...teamData.members, newUser] });
            return true;
        } catch (err: any) {
            return err.message || "Failed to sign up.";
        }
    };

    const handleLeaveTeam = async () => {
        if (!currentUser || !currentTeam) return;
        
        // Safety check for last admin
        const adminCount = currentTeam.members.filter(m => m.permissions.includes('admin')).length;
        if (currentUser.permissions.includes('admin') && adminCount <= 1) {
            throw new Error("You are the last administrator. Please promote someone else to administrator before leaving the team.");
        }

        const newMembers = currentTeam.members.filter(m => m.id !== currentUser.id);
        
        // If it's a real database, we update Firestore
        if (!isDemoMode && db) {
            await updateDoc(doc(db, 'teams', currentTeam.id), { members: newMembers });
            // If they were only in this one team, log them out
            if (teams.length <= 1) {
                await handleLogout();
            } else {
                // Switch to another team if available
                const otherTeam = teams.find(t => t.id !== currentTeam.id);
                if (otherTeam) {
                    setCurrentTeam(otherTeam);
                    localStorage.setItem('currentTeamId', otherTeam.id);
                }
            }
        } else {
            // Local mode
            const updatedTeam = { ...currentTeam, members: newMembers };
            const updatedTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
            setTeams(updatedTeams);
            
            if (updatedTeams.length === 0 || (updatedTeams.length === 1 && updatedTeams[0].members.length === 0)) {
                setIsDemoMode(false);
                setCurrentUser(null);
                setCurrentTeam(null);
                localStorage.removeItem('teams');
                localStorage.removeItem('is_demo_mode');
            } else {
                const otherTeam = updatedTeams.find(t => t.members.length > 0);
                if (otherTeam) {
                    setCurrentTeam(otherTeam);
                    setCurrentUser(otherTeam.members[0]);
                }
            }
        }
    };

    const handleAddAnnouncement = async (title: string, content: string) => {
        if (!currentTeam || !currentUser) return;
        const newAnnouncement: Announcement = { 
            id: `ann_${Date.now()}`, 
            title, 
            content, 
            date: new Date(), 
            authorId: currentUser.id, 
            readBy: [currentUser.id] 
        };
        await performUpdate({ announcements: [...(currentTeam.announcements || []), newAnnouncement] });
    };

    const handleAdminRegistration = async (
        teamName: string, 
        type: TeamType, 
        details: any, 
        password: string, 
        description?: string, 
        focusAreas?: string[]
    ): Promise<string | boolean> => {
        if (!auth && !isDemoMode) return "Firebase not configured.";
        try {
            let uid = `local_${Date.now()}`;
            if (auth) {
                const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
                uid = userCredential.user.uid;
            }
            
            const newUser: TeamMember = {
                ...details,
                id: uid,
                status: 'active',
                permissions: ['admin'],
                skills: [],
                checkIns: [],
                availability: {},
                awardedAchievements: []
            };

            const template = await generateTeamTemplate(description || teamName, focusAreas).catch(() => ({ 
                roles: [], 
                skills: [], 
                features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, 
                achievements: [] 
            }));

            const teamId = `team_${Date.now()}`;
            const newTeam: Team = {
                id: teamId, 
                name: teamName, 
                type, 
                description,
                features: { 
                    ...template.features, 
                    childCheckIn: type === 'youth' && (focusAreas?.includes('childCheckIn') || false), 
                    inventory: focusAreas?.includes('inventory') || false 
                },
                members: [newUser],
                roles: template.roles, 
                skills: template.skills, 
                achievements: template.achievements,
                inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM',
                announcements: [], 
                scriptures: [], 
                serviceEvents: [],
            };

            if (isDemoMode || !db) {
                const updatedTeams = [...teams, newTeam];
                saveLocalTeams(updatedTeams);
                setTeams(updatedTeams);
                setCurrentTeam(newTeam);
                setCurrentUser(newUser);
                return true;
            }
            
            await setDoc(doc(db, 'teams', teamId), newTeam);
            return true;
        } catch (err: any) {
            return err.message || "Failed to register admin.";
        }
    };

    return {
        allUsers: teams.flatMap(t => t.members),
        allTeams: teams,
        myTeams: teams,
        currentUser, currentTeam, 
        isDataLoaded: isDataLoaded && !authLoading,
        isDemoMode,
        handleLogin, handleLogout, handleDemoMode, handleUpdateEvent, handleCheckIn, handleForgotPassword, handleLeaveTeam, handleDeleteTeam,
        handleJoinCode: (code: string) => teams.find(t => t.inviteCode === code || t.adminInviteCode === code)?.id || null, 
        isAdminCode: (code: string) => teams.some(t => t.adminInviteCode === code), 
        handleSignUp, handleAddAnnouncement, handleAdminRegistration,
        handleUpdateTeam: (data: Partial<Team>) => performUpdate(data),
        handleUpdateMember: (member: TeamMember) => {
            if (!currentTeam) return;
            const newMembers = currentTeam.members.map(m => m.id === member.id ? member : m);
            performUpdate({ members: newMembers });
        },
        handleRemoveAnnouncement: (id: string) => {
            if (!currentTeam) return;
            performUpdate({ announcements: currentTeam.announcements.filter(a => a.id !== id) });
        },
        handleAddPrayerPoint: (text: string) => {
            if (!currentTeam) return;
            const newPoint = { id: `prayer_${Date.now()}`, text };
            performUpdate({ customPrayerPoints: [...(currentTeam.customPrayerPoints || []), newPoint] });
        },
        handleRemovePrayerPoint: (id: string) => {
            if (!currentTeam) return;
            performUpdate({ customPrayerPoints: (currentTeam.customPrayerPoints || []).filter(p => p.id !== id) });
        },
        handleMarkAsRead: (announcementIds: string[]) => {
            if (!currentTeam || !currentUser) return;
            const updatedAnnouncements = currentTeam.announcements.map(ann => {
                if (announcementIds.includes(ann.id)) {
                    const readBy = new Set(ann.readBy || []);
                    readBy.add(currentUser.id);
                    return { ...ann, readBy: Array.from(readBy) };
                }
                return ann;
            });
            performUpdate({ announcements: updatedAnnouncements });
        },
        handleRemoveMember: (memberId: string) => {
            if (!currentTeam) return;
            performUpdate({ members: currentTeam.members.filter(m => m.id !== memberId) });
        },
        handleUpdateCurrentUser: (user: TeamMember) => {
            if (!currentTeam) return;
            const newMembers = currentTeam.members.map(m => m.id === user.id ? user : m);
            performUpdate({ members: newMembers });
        },
        handleAddShoutOut: (toId: string, message: string) => {
            if (!currentTeam || !currentUser) return;
            const newShoutOut: ShoutOut = { id: `so_${Date.now()}`, fromId: currentUser.id, toId, message, date: new Date() };
            performUpdate({ shoutOuts: [...(currentTeam.shoutOuts || []), newShoutOut] });
        },
        handleResetTeam: async (teamId: string, adminToKeepId: string) => {
            const adminToKeep = currentTeam?.members.find(m => m.id === adminToKeepId);
            if (!adminToKeep) return;
            await performUpdate({
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
        handleAddVideoAnalysis: (analysis: VideoAnalysis) => {
            if (!currentTeam) return;
            performUpdate({ videoAnalyses: [...(currentTeam.videoAnalyses || []), analysis] });
        },
        handleAddTrainingVideo: (videoData: any) => {
            if (!currentTeam || !currentUser) return;
            const newVideo = { ...videoData, id: `vid_${Date.now()}`, uploadedBy: currentUser.id, dateAdded: new Date() };
            performUpdate({ trainingVideos: [...(currentTeam.trainingVideos || []), newVideo] });
        },
        handleUpdateTrainingVideo: (video: TrainingVideo) => {
            if (!currentTeam) return;
            performUpdate({ trainingVideos: (currentTeam.trainingVideos || []).map(v => v.id === video.id ? video : v) });
        },
        handleDeleteTrainingVideo: (videoId: string) => {
            if (!currentTeam) return;
            performUpdate({ trainingVideos: (currentTeam.trainingVideos || []).filter(v => v.id !== videoId) });
        },
        handleAddFaq: (item: FaqItem) => {
            if (!currentTeam) return;
            performUpdate({ faqs: [...(currentTeam.faqs || []), item] });
        },
        handleUpdateFaq: (item: FaqItem) => {
            if (!currentTeam) return;
            performUpdate({ faqs: (currentTeam.faqs || []).map(f => f.id === item.id ? item : f) });
        },
        handleDeleteFaq: (itemId: string) => {
            if (!currentTeam) return;
            performUpdate({ faqs: (currentTeam.faqs || []).filter(f => f.id !== itemId) });
        },
        handleAddChild: (childData: any) => {
            if (!currentTeam) return;
            const newChild = { ...childData, id: `child_${Date.now()}`, status: 'checked-out' };
            performUpdate({ children: [...(currentTeam.children || []), newChild] });
        },
        handleUpdateChild: (child: Child) => {
            if (!currentTeam) return;
            performUpdate({ children: (currentTeam.children || []).map(c => c.id === child.id ? child : c) });
        },
        handleDeleteChild: (childId: string) => {
            if (!currentTeam) return;
            performUpdate({ children: (currentTeam.children || []).filter(c => c.id !== childId) });
        },
        handleChildCheckIn: (childId: string) => {
            if (!currentTeam || !currentUser) return;
            const newLog: CheckInLogEntry = {
                id: `log_${Date.now()}`,
                timestamp: new Date(),
                type: 'in',
                processedByName: currentUser.name
            };
            performUpdate({ 
                children: (currentTeam.children || []).map(c => c.id === childId ? { 
                    ...c, 
                    status: 'checked-in', 
                    lastCheckIn: new Date(),
                    lastProcessedByName: currentUser.name,
                    checkInHistory: [newLog, ...(c.checkInHistory || [])]
                } : c) 
            });
        },
        handleChildCheckOut: (childId: string) => {
            if (!currentTeam || !currentUser) return;
            const newLog: CheckInLogEntry = {
                id: `log_${Date.now()}`,
                timestamp: new Date(),
                type: 'out',
                processedByName: currentUser.name
            };
            performUpdate({ 
                children: (currentTeam.children || []).map(c => c.id === childId ? { 
                    ...c, 
                    status: 'checked-out', 
                    lastCheckOut: new Date(),
                    lastProcessedByName: currentUser.name,
                    checkInHistory: [newLog, ...(c.checkInHistory || [])]
                } : c) 
            });
        },
        handleAddInventoryItem: (itemData: any) => {
            if (!currentTeam) return;
            const newItem = { ...itemData, id: `inv_${Date.now()}`, status: 'available' };
            performUpdate({ inventory: [...(currentTeam.inventory || []), newItem] });
        },
        handleUpdateInventoryItem: (item: InventoryItem) => {
            if (!currentTeam) return;
            performUpdate({ inventory: (currentTeam.inventory || []).map(i => i.id === item.id ? item : i) });
        },
        handleDeleteInventoryItem: (itemId: string) => {
            if (!currentTeam) return;
            performUpdate({ inventory: (currentTeam.inventory || []).filter(i => i.id !== itemId) });
        },
        handleCheckOutItem: (itemId: string, memberId: string) => {
            if (!currentTeam) return;
            performUpdate({ inventory: (currentTeam.inventory || []).map(i => i.id === itemId ? { ...i, status: 'in-use', assignedTo: memberId } : i) });
        },
        handleCheckInItem: (itemId: string) => {
            if (!currentTeam) return;
            performUpdate({ inventory: (currentTeam.inventory || []).map(i => i.id === itemId ? { ...i, status: 'available', assignedTo: undefined } : i) });
        },
        handleCreateTeam: async (teamName: string, type: TeamType, description?: string, focusAreas?: string[]) => {
            if (!currentUser) return "Not logged in.";
            const template = await generateTeamTemplate(description || teamName, focusAreas).catch(() => ({ roles: [], skills: [], features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, achievements: [] }));
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
            if (isDemoMode || !db) {
                const updatedTeams = [...teams, newTeam];
                saveLocalTeams(updatedTeams);
                setTeams(updatedTeams);
                setCurrentTeam(newTeam);
                return true;
            }
            await setDoc(doc(db, 'teams', teamId), newTeam);
            return true;
        },
        handleExternalInvite: (joinCode: string, teamName: string, teamType: TeamType, features?: TeamFeatures) => {
            if (teams.some(t => t.inviteCode === joinCode || t.adminInviteCode === joinCode)) return;
            const stubTeam: Team = {
                id: `external_${joinCode}`, name: teamName, type: teamType, inviteCode: joinCode, adminInviteCode: `${joinCode}_ADM`,
                features: features || { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false },
                members: [], roles: [], skills: [], announcements: [], scriptures: [], serviceEvents: []
            };
            setTeams(prev => [...prev, stubTeam]);
        },
        handleSwitchTeam: (teamId: string) => {
            const team = teams.find(t => t.id === teamId);
            if (team) {
                setCurrentTeam(team);
                localStorage.setItem('currentTeamId', teamId);
            }
        }
    };
};
