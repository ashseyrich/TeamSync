import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember, ServiceEvent, Role, Skill, Announcement, ShoutOut, PrayerPoint, VideoAnalysis, FaqItem, TrainingVideo, Scripture, TeamType, TeamFeatures, Achievement, Child, InventoryItem, Department, Assignment } from '../types.ts';
import { Proficiency } from '../types.ts';
import { generateTeamTemplate } from '../services/geminiService.ts';
import { db } from '../lib/firebase.ts';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

const INITIAL_SKILLS: Skill[] = [
    { id: 's1', name: 'Camera Operation' },
    { id: 's2', name: 'Audio Mixing' },
    { id: 's3', name: 'ProPresenter / Slides' },
    { id: 's4', name: 'Video Directing' }
];

const INITIAL_ROLES: Role[] = [
    { id: 'r1', name: 'Main Camera', requiredSkillId: 's1' },
    { id: 'r2', name: 'FOH Audio', requiredSkillId: 's2' },
    { id: 'r3', name: 'ProPresenter', requiredSkillId: 's3' },
    { id: 'r4', name: 'Director', requiredSkillId: 's4' }
];

const SEED_MEMBERS: TeamMember[] = [
    {
        id: 'u1',
        name: 'Demo Admin',
        username: 'admin',
        email: 'admin@church.org',
        status: 'active',
        permissions: ['admin'],
        skills: [{ skillId: 's4', proficiency: Proficiency.MASTER_TRAINER }],
        checkIns: [],
        availability: {},
        awardedAchievements: ['ach1', 'ach2']
    },
    {
        id: 'u2',
        name: 'Carlos Volunteer',
        username: 'carlos',
        email: 'carlos@church.org',
        status: 'active',
        permissions: [],
        skills: [
            { skillId: 's1', proficiency: Proficiency.SOLO_OPERATOR },
            { skillId: 's2', proficiency: Proficiency.NOVICE }
        ],
        checkIns: [],
        availability: {},
        awardedAchievements: ['ach1']
    }
];

const DEFAULT_TEAM: Team = {
    id: 'demo_team_1',
    name: 'Grace Community Media',
    type: 'media',
    description: 'The primary production team for our Sunday services.',
    features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: true },
    members: SEED_MEMBERS,
    roles: INITIAL_ROLES,
    skills: INITIAL_SKILLS,
    inviteCode: 'GRACE2024',
    adminInviteCode: 'GRACEADMIN',
    announcements: [
        { id: 'ann1', title: 'New Camera Lenses!', content: 'We just received our new 50mm primes. Training session after service.', date: new Date(), authorId: 'u1', readBy: ['u1'] }
    ],
    scriptures: [{ reference: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord.' }],
    serviceEvents: [
        {
            id: 'e1',
            name: 'Sunday Morning Service',
            date: new Date(Date.now() + 86400000), // Tomorrow
            callTime: new Date(Date.now() + 80000000),
            assignments: [
                { roleId: 'r1', memberId: 'u2' },
                { roleId: 'r2', memberId: null },
                { roleId: 'r4', memberId: 'u1' }
            ],
            location: { address: 'Main Sanctuary' },
            serviceNotes: 'Special musical guest this week.'
        }
    ]
};

const reviveDates = (data: any): any => {
    if (Array.isArray(data)) return data.map(reviveDates);
    if (data && typeof data === 'object') {
        const newData: any = {};
        for (const key in data) {
            const value = data[key];
            if (value && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key === 'birthday' || key === 'timestamp')) {
                if (value.seconds) {
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

    useEffect(() => {
        if (db) {
            const unsubscribe = onSnapshot(collection(db, 'teams'), (snapshot) => {
                let loadedTeams = snapshot.docs.map(doc => reviveDates({ ...doc.data(), id: doc.id })) as Team[];
                
                // If cloud is empty, seed it with the default team
                if (loadedTeams.length === 0) {
                    loadedTeams = [DEFAULT_TEAM];
                    setDoc(doc(db, 'teams', DEFAULT_TEAM.id), DEFAULT_TEAM);
                }

                setTeams(loadedTeams);
                const savedUserId = localStorage.getItem('currentUserId');
                const savedTeamId = localStorage.getItem('currentTeamId');
                if (savedUserId && savedTeamId) {
                    const targetTeam = loadedTeams.find(t => t.id === savedTeamId);
                    if (targetTeam) {
                        const user = targetTeam.members.find(m => m.id === savedUserId);
                        setCurrentUser(user || null);
                        setCurrentTeam(targetTeam);
                    }
                }
                setIsDataLoaded(true);
            }, () => setIsDataLoaded(true));
            return () => unsubscribe();
        } else {
            const savedTeams = localStorage.getItem('teams');
            let parsed = [];
            if (savedTeams) {
                parsed = reviveDates(JSON.parse(savedTeams));
            } else {
                // If local storage is empty, use the seed
                parsed = [DEFAULT_TEAM];
                localStorage.setItem('teams', JSON.stringify(parsed));
            }

            setTeams(parsed);
            const savedUserId = localStorage.getItem('currentUserId');
            const savedTeamId = localStorage.getItem('currentTeamId');
            if (savedUserId && savedTeamId) {
                const targetTeam = parsed.find((t: Team) => t.id === savedTeamId);
                if (targetTeam) {
                    const user = targetTeam.members.find((m: TeamMember) => m.id === savedUserId);
                    setCurrentUser(user || null);
                    setCurrentTeam(targetTeam);
                }
            }
            setIsDataLoaded(true);
        }
    }, []);

    const saveData = useCallback((newTeams: Team[], newCurrentUser: TeamMember | null, newCurrentTeam: Team | null) => {
        if (newCurrentUser) {
            localStorage.setItem('currentUserId', newCurrentUser.id);
            localStorage.setItem('currentTeamId', newCurrentTeam?.id || '');
        } else {
            localStorage.removeItem('currentUserId');
            localStorage.removeItem('currentTeamId');
        }
        
        if (db) {
            newTeams.forEach(async (team) => {
                await setDoc(doc(db, 'teams', team.id), team);
            });
        } else {
            localStorage.setItem('teams', JSON.stringify(newTeams));
        }
    }, []);

    const updateState = (newTeams: Team[], newCurrentUser: TeamMember | null, newCurrentTeam: Team | null) => {
        if (!db) {
             setTeams(newTeams);
        }
        setCurrentUser(newCurrentUser);
        setCurrentTeam(newCurrentTeam);
        saveData(newTeams, newCurrentUser, newCurrentTeam);
    };

    const handleLogin = (username: string): Promise<string | boolean> => {
        return new Promise(resolve => {
            const user = teams.flatMap(t => t.members).find(m => m.username.toLowerCase() === username.toLowerCase());
            if (user && user.status === 'active') {
                const team = teams.find(t => t.members.some(m => m.id === user.id));
                updateState(teams, user, team || null);
                resolve(true);
            } else {
                resolve("Invalid user or pending approval.");
            }
        });
    };

    const handleLogout = () => updateState(teams, null, null);

    const handleUpdateEvent = (updatedEvent: ServiceEvent) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, serviceEvents: t.serviceEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleCheckIn = async (eventId: string, location: { latitude: number; longitude: number; }) => {
        if (!currentUser || !currentTeam) return;
        const updatedUser = { ...currentUser, checkIns: [...(currentUser.checkIns || []), { eventId, checkInTime: new Date(), location }] };
        const newTeams = teams.map(t => {
            if (t.id === currentTeam.id) {
                return { ...t, members: t.members.map(m => m.id === currentUser.id ? updatedUser : m) };
            }
            return t;
        });
        updateState(newTeams, updatedUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleExternalInvite = (code: string, teamName: string, teamType: TeamType, features?: TeamFeatures) => {
        if (teams.some(t => t.inviteCode === code || t.adminInviteCode === code)) return;
        const newTeam: Team = {
            id: `stub_${Date.now()}`,
            name: teamName,
            type: teamType,
            features: features || { videoAnalysis: true, attire: true, training: true, childCheckIn: teamType === 'youth', inventory: false },
            members: [],
            roles: [],
            skills: [],
            inviteCode: code,
            adminInviteCode: `${code}_ADMIN`,
            announcements: [],
            scriptures: [],
            serviceEvents: []
        };
        updateState([...teams, newTeam], currentUser, currentTeam);
    };

    const handleAdminRegistration = async (teamName: string, type: TeamType, details: any, password: string, description?: string, focusAreas?: string[]) => {
        let template;
        try {
            template = await generateTeamTemplate(description || teamName, focusAreas);
        } catch (e) {
            template = { roles: [], skills: [], features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, achievements: [] };
        }

        const teamId = `team_${Date.now()}`;
        const userId = `user_${Date.now()}`;
        const newAdmin: TeamMember = { id: userId, ...details, status: 'active', permissions: ['admin'], skills: [], checkIns: [], availability: {}, awardedAchievements: [] };
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
        updateState([...teams, newTeam], newAdmin, newTeam);
        return true;
    };

    const handleJoinCode = (code: string) => {
        const team = teams.find(t => t.inviteCode === code || t.adminInviteCode === code);
        return team?.id || null;
    };

    const isAdminCode = (code: string) => teams.some(t => t.adminInviteCode === code);

    const handleSignUp = (details: any, password: string, teamId: string, isAdmin: boolean, autoApprove?: boolean) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return "Team not found.";
        const userId = `user_${Date.now()}`;
        const newUser: TeamMember = {
            id: userId, ...details, status: (isAdmin || autoApprove) ? 'active' : 'pending-approval',
            permissions: isAdmin ? ['admin'] : [], skills: [], checkIns: [], availability: {}, awardedAchievements: []
        };
        const newTeams = teams.map(t => t.id === teamId ? { ...t, members: [...t.members, newUser] } : t);
        const updatedCurrentUser = (isAdmin || autoApprove) ? newUser : currentUser;
        const updatedCurrentTeam = (isAdmin || autoApprove) ? newTeams.find(t => t.id === teamId)! : currentTeam;
        updateState(newTeams, updatedCurrentUser, updatedCurrentTeam);
        return true;
    };

    const handleRemoveAnnouncement = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, announcements: (t.announcements || []).filter(a => a.id !== id) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleAddPrayerPoint = (text: string) => {
        if (!currentTeam) return;
        const newPoint = { id: `prayer_${Date.now()}`, text };
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, customPrayerPoints: [...(t.customPrayerPoints || []), newPoint] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleRemovePrayerPoint = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => {
            if (t.id === currentTeam.id) {
                if (id.startsWith('ai_')) {
                    return { ...t, deletedAiPrayerPointIds: [...(t.deletedAiPrayerPointIds || []), id] };
                } else {
                    return { ...t, customPrayerPoints: (t.customPrayerPoints || []).filter(p => p.id !== id) };
                }
            }
            return t;
        });
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleMarkAsRead = (ids: string[]) => {
        if (!currentTeam || !currentUser) return;
        const newTeams = teams.map(t => {
            if (t.id === currentTeam.id) {
                return {
                    ...t, announcements: (t.announcements || []).map(a => ids.includes(a.id) ? { ...a, readBy: Array.from(new Set([...(a.readBy || []), currentUser.id])) } : a)
                };
            }
            return t;
        });
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleUpdateTeam = (updatedData: Partial<Team>) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, ...updatedData } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleUpdateMember = (member: TeamMember) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, members: t.members.map(m => m.id === member.id ? member : m) } : t);
        const updatedCurrentUser = (currentUser && member.id === currentUser.id) ? member : currentUser;
        updateState(newTeams, updatedCurrentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleRemoveMember = (memberId: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, members: t.members.filter(m => m.id !== memberId) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleResetTeam = (teamId: string, adminToKeepId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;
        const admin = team.members.find(m => m.id === adminToKeepId);
        if (!admin) return;
        const resetTeam: Team = {
            ...team, members: [admin], announcements: [], serviceEvents: [], shoutOuts: [], customPrayerPoints: [], videoAnalyses: [], trainingVideos: [], children: [], inventory: []
        };
        updateState(teams.map(t => t.id === teamId ? resetTeam : t), admin, resetTeam);
    };

    const handleAddVideoAnalysis = (analysis: VideoAnalysis) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, videoAnalyses: [...(t.videoAnalyses || []), analysis] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleAddTrainingVideo = (videoData: any) => {
        if (!currentTeam || !currentUser) return;
        const newVideo: TrainingVideo = { id: `v_${Date.now()}`, uploadedBy: currentUser.id, dateAdded: new Date(), ...videoData };
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, trainingVideos: [...(t.trainingVideos || []), newVideo] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleUpdateTrainingVideo = (video: TrainingVideo) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, trainingVideos: (t.trainingVideos || []).map(v => v.id === video.id ? video : v) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleDeleteTrainingVideo = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, trainingVideos: (t.trainingVideos || []).filter(v => v.id !== id) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleAddFaq = (item: FaqItem) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, faqs: [...(t.faqs || []), item] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleUpdateFaq = (item: FaqItem) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, faqs: (t.faqs || []).map(f => f.id === item.id ? item : f) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleDeleteFaq = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, faqs: (t.faqs || []).filter(f => f.id !== id) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleUpdateCurrentUser = (user: TeamMember) => handleUpdateMember(user);

    const handleAddChild = (childData: any) => {
        if (!currentTeam) return;
        const newChild: Child = { id: `child_${Date.now()}`, status: 'checked-out', ...childData };
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, children: [...(t.children || []), newChild] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleUpdateChild = (child: Child) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, children: (t.children || []).map(c => c.id === child.id ? child : c) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleDeleteChild = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, children: (t.children || []).filter(c => c.id !== id) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleChildCheckIn = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, children: (t.children || []).map(c => c.id === id ? { ...c, status: 'checked-in', lastCheckIn: new Date() } : c) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleChildCheckOut = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, children: (t.children || []).map(c => c.id === id ? { ...c, status: 'checked-out', lastCheckOut: new Date() } : c) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleAddInventoryItem = (itemData: any) => {
        if (!currentTeam) return;
        const newItem: InventoryItem = { id: `inv_${Date.now()}`, status: 'available', ...itemData };
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, inventory: [...(t.inventory || []), newItem] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleUpdateInventoryItem = (item: InventoryItem) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, inventory: (t.inventory || []).map(i => i.id === item.id ? item : i) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleDeleteInventoryItem = (id: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, inventory: (t.inventory || []).filter(i => i.id !== id) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleCheckOutItem = (itemId: string, memberId: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, inventory: (t.inventory || []).map(i => i.id === itemId ? { ...i, status: 'in-use', assignedTo: memberId } : i) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleCheckInItem = (itemId: string) => {
        if (!currentTeam) return;
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, inventory: (t.inventory || []).map(i => i.id === itemId ? { ...i, status: 'available', assignedTo: undefined } : i) } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleSwitchTeam = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (team && currentUser) {
            const memberInTeam = team.members.find(m => m.username.toLowerCase() === currentUser.username.toLowerCase() || m.email?.toLowerCase() === currentUser.email?.toLowerCase());
            if (memberInTeam) updateState(teams, memberInTeam, team);
        }
    };

    const handleAddShoutOut = (toId: string, message: string) => {
        if (!currentTeam || !currentUser) return;
        const newShoutOut: ShoutOut = { id: `so_${Date.now()}`, fromId: currentUser.id, toId, message, date: new Date() };
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, shoutOuts: [...(t.shoutOuts || []), newShoutOut] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleAddAnnouncement = (title: string, content: string) => {
        if (!currentTeam || !currentUser) return;
        const newAnnouncement: Announcement = { id: `ann_${Date.now()}`, title, content, date: new Date(), authorId: currentUser.id, readBy: [currentUser.id] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? { ...t, announcements: [...(t.announcements || []), newAnnouncement] } : t);
        updateState(newTeams, currentUser, newTeams.find(t => t.id === currentTeam.id) || null);
    };

    const handleCreateTeam = async (teamName: string, type: TeamType, description?: string, focusAreas?: string[]) => {
        if (!currentUser) return "Not logged in.";
        let template;
        try {
            template = await generateTeamTemplate(description || teamName, focusAreas);
        } catch (e) {
            template = { roles: [], skills: [], features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: false }, achievements: [] };
        }
        const teamId = `team_${Date.now()}`;
        const adminCopy: TeamMember = { ...currentUser, status: 'active', permissions: ['admin'], skills: [], checkIns: [], availability: {}, awardedAchievements: [] };
        const newTeam: Team = {
            id: teamId, name: teamName, type, description,
            features: { 
                ...template.features, 
                childCheckIn: type === 'youth' && (focusAreas?.includes('childCheckIn') || false), 
                inventory: focusAreas?.includes('inventory') || false 
            },
            members: [adminCopy], roles: template.roles, skills: template.skills, achievements: template.achievements,
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            adminInviteCode: Math.random().toString(36).substring(2, 8).toUpperCase() + '_ADM',
            announcements: [], scriptures: [], serviceEvents: [],
        };
        updateState([...teams, newTeam], adminCopy, newTeam);
        return true;
    };

    return {
        allUsers: teams.flatMap(t => t.members),
        allTeams: teams,
        myTeams: teams.filter(t => t.members.some(m => m.id === currentUser?.id)),
        currentUser, currentTeam, isDataLoaded,
        handleLogin, handleLogout, handleUpdateEvent, handleCheckIn, handleExternalInvite, handleAdminRegistration, handleJoinCode, isAdminCode, handleSignUp,
        handleRemoveAnnouncement, handleAddPrayerPoint, handleRemovePrayerPoint, handleMarkAsRead, handleUpdateTeam, handleUpdateMember, handleRemoveMember,
        handleResetTeam, handleAddVideoAnalysis, handleAddTrainingVideo, handleUpdateTrainingVideo, handleDeleteTrainingVideo, handleAddFaq, handleUpdateFaq,
        handleDeleteFaq, handleUpdateCurrentUser, handleAddChild, handleUpdateChild, handleDeleteChild, handleChildCheckIn, handleChildCheckOut,
        handleAddInventoryItem, handleUpdateInventoryItem, handleDeleteInventoryItem, handleCheckOutItem, handleCheckInItem, handleSwitchTeam,
        handleAddShoutOut, handleAddAnnouncement, handleCreateTeam
    };
};