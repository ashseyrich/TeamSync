
import { useState, useEffect, useCallback } from 'react';
import type { Team, TeamMember, ServiceEvent, Role, Skill, Announcement, ShoutOut, PrayerPoint, VideoAnalysis, FaqItem, TrainingVideo, Scripture, TeamType, TeamFeatures, Achievement, Child, InventoryItem, Department } from '../types.ts';
import { Proficiency } from '../types.ts';
import { ALL_ACHIEVEMENTS } from '../utils/achievements.ts';
import { generateTeamTemplate } from '../services/geminiService.ts';

const MOCK_USERS: TeamMember[] = [
    { id: 'user1', name: 'Admin User', username: 'admin', pronouns: 'they/them', email: 'admin@example.com', phoneNumber: '555-0101', avatarUrl: '', status: 'active', permissions: ['admin', 'scheduler'], skills: [{ skillId: 'skill1', proficiency: Proficiency.MASTER_TRAINER }, { skillId: 'skill2', proficiency: Proficiency.SOLO_OPERATOR }], checkIns: [], availability: {}, personalGoals: [], awardedAchievements: ['ach1', 'ach2', 'ach5'] },
    { id: 'user2', name: 'Carlos Ray', username: 'carlos', pronouns: 'he/him', email: 'carlos@example.com', phoneNumber: '555-0102', avatarUrl: '', status: 'active', permissions: [], skills: [{ skillId: 'skill2', proficiency: Proficiency.SOLO_OPERATOR }], checkIns: [], availability: { '2024-08-18': 'unavailable' }, aboutMe: "I love running camera and getting the perfect shot!", favoriteMoment: "When we captured the baptism service perfectly.", personalGoals: [{ id: 'g1', text: 'Learn audio mixing', status: 'in-progress' }], strengths: ['Camera Operation'], growthAreas: ['Communication', 'Audio Mixing'] },
    { id: 'user3', name: 'Aisha Khan', username: 'aisha', pronouns: 'she/her', email: 'aisha@example.com', phoneNumber: '555-0103', avatarUrl: '', status: 'active', permissions: ['scheduler'], skills: [{ skillId: 'skill3', proficiency: Proficiency.NOVICE }], checkIns: [], availability: {}, suggestedGrowthAreas: ['Video Directing'] },
    { id: 'user4', name: 'Ben Carter', username: 'ben', pronouns: 'he/him', email: 'ben@example.com', phoneNumber: '555-0104', avatarUrl: '', status: 'pending-approval', permissions: [], skills: [], checkIns: [], availability: {} },
];

const MOCK_SKILLS: Skill[] = [
    { id: 'skill1', name: 'Audio Mixing' },
    { id: 'skill2', name: 'Camera Operation' },
    { id: 'skill3', name: 'ProPresenter' },
    { id: 'skill4', name: 'Video Directing' },
];

const MOCK_DEPARTMENTS: Department[] = [
    { id: 'dept1', name: 'Audio' },
    { id: 'dept2', name: 'Video' },
    { id: 'dept3', name: 'Lighting' },
];

const MOCK_ROLES: Role[] = [
    { id: 'role1', name: 'Audio Engineer', requiredSkillId: 'skill1', departmentId: 'dept1' },
    { id: 'role2', name: 'Camera 1', requiredSkillId: 'skill2', departmentId: 'dept2' },
    { id: 'role3', name: 'Camera 2', requiredSkillId: 'skill2', departmentId: 'dept2' },
    { id: 'role4', name: 'ProPresenter', requiredSkillId: 'skill3', departmentId: 'dept2' },
    { id: 'role5', name: 'Video Director', requiredSkillId: 'skill4', departmentId: 'dept2' },
];

const MOCK_EVENTS: ServiceEvent[] = [
    { id: 'event1', name: 'Sunday Morning Service', date: new Date(new Date().setDate(new Date().getDate() + 3)), callTime: new Date(new Date().setDate(new Date().getDate() + 3)), assignments: MOCK_ROLES.map(r => ({ roleId: r.id, memberId: null })), attire: { theme: 'Casual Sunday', description: 'Wear your favorite casual outfit.', colors: ['#3b82f6', '#eab308'] } },
    { id: 'event2', name: 'Mid-week Prayer', date: new Date(new Date().setDate(new Date().getDate() + 6)), callTime: new Date(new Date().setDate(new Date().getDate() + 6)), assignments: MOCK_ROLES.slice(0, 2).map(r => ({ roleId: r.id, memberId: null })) },
];
MOCK_EVENTS[0].assignments[1].memberId = 'user2'; // Assign Carlos to Camera 1

const MOCK_SCRIPTURES: Scripture[] = [{ reference: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.' }];

// To enable the initial setup flow, the default state should have no teams.
const MOCK_TEAMS: Team[] = [];

const USHER_ACHIEVEMENTS: Achievement[] = [
    { id: 'ach_u1', name: 'First Smile', description: 'Serve as a greeter for the first time.', icon: 'star' },
    { id: 'ach_u2', name: 'Head Counter', description: 'Accurately count attendance.', icon: 'presentation' },
    { id: 'ach_u3', name: 'Crisis Averted', description: 'Handle a difficult situation with grace.', icon: 'trophy' },
];

const WORSHIP_ACHIEVEMENTS: Achievement[] = [
    { id: 'ach_w1', name: 'First Note', description: 'Play or sing in your first service.', icon: 'sound' },
    { id: 'ach_w2', name: 'Soloist', description: 'Perform a solo or lead a song.', icon: 'star' },
    { id: 'ach_w3', name: 'Band Leader', description: 'Lead the band for a service.', icon: 'trophy' },
];

const YOUTH_ACHIEVEMENTS: Achievement[] = [
    { id: 'ach_y1', name: 'Mentor', description: 'Lead a small group discussion.', icon: 'star' },
    { id: 'ach_y2', name: 'Game Master', description: 'Organize and lead a group game.', icon: 'trophy' },
    { id: 'ach_y3', name: 'Safety First', description: 'Complete child safety training.', icon: 'presentation' },
];

const GENERAL_ACHIEVEMENTS: Achievement[] = [
    { id: 'ach_g1', name: 'Volunteer', description: 'Complete your first task.', icon: 'star' },
    { id: 'ach_g2', name: 'Dependable', description: 'Serve 5 times in a row.', icon: 'trophy' },
];

const TEAM_TEMPLATES: Record<Exclude<TeamType, 'custom'>, { roles: Role[], skills: Skill[], features: TeamFeatures, achievements: Achievement[] }> = {
    media: {
        roles: MOCK_ROLES,
        skills: MOCK_SKILLS,
        features: { videoAnalysis: true, attire: true, training: true, childCheckIn: false, inventory: true },
        achievements: ALL_ACHIEVEMENTS
    },
    ushering: {
        roles: [
            { id: 'r_head_usher', name: 'Head Usher' },
            { id: 'r_greeter', name: 'Door Greeter', requiredSkillId: 's_hospitality' },
            { id: 'r_aisle', name: 'Aisle Usher' },
            { id: 'r_communion', name: 'Communion Server' }
        ],
        skills: [
            { id: 's_hospitality', name: 'Hospitality' },
            { id: 's_security', name: 'Basic Security' },
            { id: 's_firstaid', name: 'First Aid' }
        ],
        features: { videoAnalysis: false, attire: true, training: true, childCheckIn: false, inventory: false },
        achievements: USHER_ACHIEVEMENTS
    },
    worship: {
         roles: [
            { id: 'r_wl', name: 'Worship Leader' },
            { id: 'r_vocals', name: 'Vocalist', requiredSkillId: 's_vocals' },
            { id: 'r_keys', name: 'Keys', requiredSkillId: 's_instrument' },
            { id: 'r_drums', name: 'Drums', requiredSkillId: 's_instrument' },
            { id: 'r_bass', name: 'Bass', requiredSkillId: 's_instrument' }
        ],
        skills: [
            { id: 's_vocals', name: 'Vocals' },
            { id: 's_instrument', name: 'Instrument Proficiency' },
            { id: 's_theory', name: 'Music Theory' }
        ],
        features: { videoAnalysis: false, attire: true, training: true, childCheckIn: false, inventory: true },
        achievements: WORSHIP_ACHIEVEMENTS
    },
    youth: {
        roles: [
            { id: 'r_yl', name: 'Youth Leader' },
            { id: 'r_small_group', name: 'Small Group Leader', requiredSkillId: 's_teaching' },
            { id: 'r_checkin', name: 'Check-in Station', requiredSkillId: 's_safety' },
            { id: 'r_activity', name: 'Activity Coordinator' }
        ],
        skills: [
            { id: 's_safety', name: 'Child Safety' },
            { id: 's_teaching', name: 'Teaching/Mentoring' },
            { id: 's_firstaid', name: 'First Aid' }
        ],
        features: { videoAnalysis: false, attire: true, training: true, childCheckIn: true, inventory: false },
        achievements: YOUTH_ACHIEVEMENTS
    },
    general: {
        roles: [{ id: 'r_lead', name: 'Team Lead' }, { id: 'r_member', name: 'Team Member' }],
        skills: [{ id: 's_general', name: 'General Competency' }],
        features: { videoAnalysis: false, attire: false, training: true, childCheckIn: false, inventory: false },
        achievements: GENERAL_ACHIEVEMENTS
    }
}

export const useMockData = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        // Load from localStorage or initialize
        const savedTeams = localStorage.getItem('teams');
        const savedUser = localStorage.getItem('currentUser');
        const savedTeamId = localStorage.getItem('currentTeamId');

        if (savedTeams) {
            const parsedTeams = JSON.parse(savedTeams, (key, value) => {
                if (key === 'date' || key === 'endDate' || key === 'callTime' || key === 'checkInTime' || key === 'timestamp' || key === 'dateAdded' || key === 'lastCheckIn' || key === 'lastCheckOut' || key === 'birthday') {
                    return value ? new Date(value) : undefined;
                }
                return value;
            });
            
            // Migrate old teams to have features, type and children
            const migratedTeams = parsedTeams.map((t: any) => ({
                ...t,
                type: t.type || 'media',
                description: t.description || '',
                features: {
                    videoAnalysis: t.features?.videoAnalysis ?? true,
                    attire: t.features?.attire ?? true,
                    training: t.features?.training ?? true,
                    childCheckIn: t.features?.childCheckIn ?? (t.type === 'youth'),
                    inventory: t.features?.inventory ?? (t.type === 'media' || t.type === 'worship'),
                },
                children: t.children || [],
                inventory: t.inventory || [],
                departments: t.departments || [],
            }));

            setTeams(migratedTeams);
            if (savedUser && savedTeamId) {
                const user = JSON.parse(savedUser);
                
                // Ensure we load the user relative to the current team to maintain consistency
                const targetTeam = migratedTeams.find((t: Team) => t.id === savedTeamId);
                if (targetTeam) {
                    const userInTeam = targetTeam.members.find((m: TeamMember) => m.id === user.id);
                    setCurrentUser(userInTeam || user);
                    setCurrentTeam(targetTeam);
                } else {
                     // Fallback
                    setCurrentUser(user);
                    setCurrentTeam(null);
                }
            }
        } else {
            setTeams(MOCK_TEAMS);
        }
        setIsDataLoaded(true);
    }, []);

    const saveData = useCallback((newTeams: Team[], newCurrentUser: TeamMember | null, newCurrentTeam: Team | null) => {
        localStorage.setItem('teams', JSON.stringify(newTeams));
        if (newCurrentUser) {
            localStorage.setItem('currentUser', JSON.stringify(newCurrentUser));
            localStorage.setItem('currentTeamId', newCurrentTeam?.id || '');
        } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentTeamId');
        }
    }, []);

    const handleLogin = (username: string, password: string): Promise<string | boolean> => {
        return new Promise(resolve => {
            setTimeout(() => {
                let currentTeams = [...teams];
                // If this is a demo login on a fresh app (no teams exist), populate with demo data.
                if (currentTeams.length === 0 && (username.toLowerCase() === 'admin' || username.toLowerCase() === 'carlos')) {
                    const demoTeam: Team = {
                        id: 'team_demo_1',
                        name: 'Demo Media Team',
                        type: 'media',
                        features: TEAM_TEMPLATES['media'].features,
                        members: MOCK_USERS,
                        roles: MOCK_ROLES,
                        skills: MOCK_SKILLS,
                        departments: MOCK_DEPARTMENTS,
                        inviteCode: `JOIN${Date.now()}`.slice(-8),
                        adminInviteCode: `ADMIN${Date.now()}`.slice(-9),
                        announcements: [],
                        scriptures: MOCK_SCRIPTURES,
                        serviceEvents: MOCK_EVENTS,
                        achievements: ALL_ACHIEVEMENTS,
                        children: [],
                        inventory: [
                            { id: 'inv1', name: 'Sony A7III Camera', category: 'Video', status: 'available', serialNumber: 'SN12345' },
                            { id: 'inv2', name: 'Shure SM58 Mic', category: 'Audio', status: 'in-use', assignedTo: 'user2' },
                        ]
                    };
                    currentTeams = [demoTeam];
                    setTeams(currentTeams);
                }

                const user = currentTeams.flatMap(t => t.members).find(m => m.username.toLowerCase() === username.toLowerCase());
                // In this mock setup, we're not checking the password, only if the user exists.
                if (user && user.status === 'active') {
                    // Find the team this user instance belongs to (demo logic simplification)
                    const team = currentTeams.find(t => t.members.some(m => m.id === user.id));
                    setCurrentUser(user);
                    setCurrentTeam(team || null);
                    saveData(currentTeams, user, team || null);
                    resolve(true);
                } else if (user && user.status === 'pending-approval') {
                    resolve("Your account is pending approval from an administrator.");
                } else {
                    resolve("Invalid username or password.");
                }
            }, 500);
        });
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentTeam(null);
        saveData(teams, null, null);
    };
    
    const handleUpdateEvent = (updatedEvent: ServiceEvent) => {
        const newTeams = teams.map(team => {
            if (team.id === currentTeam?.id) {
                const eventExists = team.serviceEvents.some(e => e.id === updatedEvent.id);
                const serviceEvents = eventExists
                    ? team.serviceEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e)
                    : [...team.serviceEvents, { ...updatedEvent, id: `evt_${Date.now()}` }];
                
                let savedLocations = team.savedLocations || [];
                if (updatedEvent.location?.address && !savedLocations.includes(updatedEvent.location.address)) {
                    savedLocations = [...savedLocations, updatedEvent.location.address];
                }

                let savedAttireThemes = team.savedAttireThemes || [];
                if (updatedEvent.attire?.theme && !savedAttireThemes.some(t => t.theme === updatedEvent.attire!.theme)) {
                    savedAttireThemes = [...savedAttireThemes, updatedEvent.attire];
                }

                return { ...team, serviceEvents, savedLocations, savedAttireThemes };
            }
            return team;
        });
        setTeams(newTeams);
        setCurrentTeam(newTeams.find(t => t.id === currentTeam?.id) || null);
        saveData(newTeams, currentUser, newTeams.find(t => t.id === currentTeam?.id) || null);
    };
    
     const handleCheckIn = async (eventId: string, location: { latitude: number; longitude: number; }): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (!currentUser || !currentTeam) return;

                // Update user's check-in status
                const updatedUser = { ...currentUser, checkIns: [...currentUser.checkIns, { eventId, checkInTime: new Date(), location }] };
                
                const newTeams = teams.map(team => ({
                    ...team,
                    members: team.members.map(m => m.id === currentUser.id ? updatedUser : m)
                }));
                
                setCurrentUser(updatedUser);
                setTeams(newTeams);
                const updatedTeam = newTeams.find(t => t.id === currentTeam.id) || null;
                setCurrentTeam(updatedTeam);
                saveData(newTeams, updatedUser, updatedTeam);
                
                resolve();
            }, 1000);
        });
    };
    
    const handleUpdateCurrentUser = (updatedUser: TeamMember) => {
        if (!currentUser) return;
        
        const newTeams = teams.map(team => {
            if (team.members.some(m => m.id === currentUser.id)) {
                return { ...team, members: team.members.map(m => m.id === currentUser.id ? updatedUser : m) };
            }
            return team;
        });
        
        setCurrentUser(updatedUser);
        setTeams(newTeams);
        saveData(newTeams, updatedUser, currentTeam);
    };
    
     const handleAddShoutOut = (toId: string, message: string) => {
        if (!currentUser || !currentTeam) return;
        const newShoutOut: ShoutOut = { id: `so_${Date.now()}`, fromId: currentUser.id, toId, message, date: new Date() };
        const updatedTeam = { ...currentTeam, shoutOuts: [...(currentTeam.shoutOuts || []), newShoutOut] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleAddAnnouncement = (title: string, content: string) => {
        if (!currentUser || !currentTeam) return;
        const newAnnouncement: Announcement = { id: `an_${Date.now()}`, title, content, date: new Date(), authorId: currentUser.id, readBy: [currentUser.id] };
        const updatedTeam = { ...currentTeam, announcements: [...currentTeam.announcements, newAnnouncement] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };
    
    const handleRemoveAnnouncement = (announcementId: string) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, announcements: currentTeam.announcements.filter(a => a.id !== announcementId) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleMarkAsRead = (announcementIds: string[]) => {
        if (!currentUser || !currentTeam) return;
        const updatedTeam = { 
            ...currentTeam, 
            announcements: currentTeam.announcements.map(ann => {
                if (announcementIds.includes(ann.id) && !(ann.readBy || []).includes(currentUser.id)) {
                    return { ...ann, readBy: [...(ann.readBy || []), currentUser.id] };
                }
                return ann;
            }) 
        };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleAddPrayerPoint = (text: string) => {
        if (!currentTeam) return;
        const newPoint: PrayerPoint = { id: `pp_${Date.now()}`, text };
        const updatedTeam = { ...currentTeam, customPrayerPoints: [...(currentTeam.customPrayerPoints || []), newPoint] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleRemovePrayerPoint = (pointId: string) => {
         if (!currentTeam) return;
        let updatedTeam: Team;
        if (pointId.startsWith('ai_')) {
            updatedTeam = { ...currentTeam, deletedAiPrayerPointIds: [...(currentTeam.deletedAiPrayerPointIds || []), pointId] };
        } else {
            updatedTeam = { ...currentTeam, customPrayerPoints: (currentTeam.customPrayerPoints || []).filter(p => p.id !== pointId) };
        }
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };
    
    const handleUpdateTeam = (updatedData: Partial<Team>) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, ...updatedData };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleUpdateMember = (updatedMember: TeamMember) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, members: currentTeam.members.map(m => m.id === updatedMember.id ? updatedMember : m) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };
    
     const handleRemoveMember = (memberId: string) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, members: currentTeam.members.filter(m => m.id !== memberId) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleAddVideoAnalysis = (analysis: VideoAnalysis) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, videoAnalyses: [...(currentTeam.videoAnalyses || []), analysis] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };
    
    const handleAddFaq = (item: FaqItem) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, faqs: [...(currentTeam.faqs || []), item] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleUpdateFaq = (item: FaqItem) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, faqs: (currentTeam.faqs || []).map(f => f.id === item.id ? item : f) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };
    
     const handleDeleteFaq = (itemId: string) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, faqs: (currentTeam.faqs || []).filter(f => f.id !== itemId) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleAddTrainingVideo = (videoData: Omit<TrainingVideo, 'id' | 'uploadedBy' | 'dateAdded'>) => {
        if (!currentUser || !currentTeam) return;
        const newVideo: TrainingVideo = {
            ...videoData,
            id: `vid_${Date.now()}`,
            uploadedBy: currentUser.id,
            dateAdded: new Date(),
        };
        const updatedTeam = { ...currentTeam, trainingVideos: [...(currentTeam.trainingVideos || []), newVideo] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleUpdateTrainingVideo = (videoToUpdate: TrainingVideo) => {
        if (!currentTeam) return;
        const updatedVideos = (currentTeam.trainingVideos || []).map(v => v.id === videoToUpdate.id ? videoToUpdate : v);
        const updatedTeam = { ...currentTeam, trainingVideos: updatedVideos };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleDeleteTrainingVideo = (videoId: string) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, trainingVideos: (currentTeam.trainingVideos || []).filter(v => v.id !== videoId) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };
    
    const handleSwitchTeam = (teamId: string) => {
        const newTeam = teams.find(t => t.id === teamId);
        if (newTeam && currentUser) {
             // Find the user's profile within this specific team to get correct permissions/roles
             const userInTeam = newTeam.members.find(m => m.id === currentUser.id);
             if (userInTeam) {
                 setCurrentUser(userInTeam);
             }
            setCurrentTeam(newTeam);
            saveData(teams, userInTeam || currentUser, newTeam);
        }
    };

    const handleCreateTeam = async (teamName: string, type: TeamType = 'media', description?: string, focusAreas?: string[]): Promise<string | boolean> => {
        if (!currentUser) return 'You must be logged in to create a team.';
        if (teams.some(t => t.name.toLowerCase() === teamName.toLowerCase())) return 'A team with this name already exists.';

        let template;

        if (type === 'custom' && description) {
            try {
                template = await generateTeamTemplate(description, focusAreas);
            } catch (error) {
                 console.error("Failed to generate custom template:", error);
                 return "Failed to generate custom team structure. Please try again or select a preset.";
            }
        } else if (type !== 'custom') {
             template = TEAM_TEMPLATES[type];
        } else {
            // Fallback if custom but no description
            template = TEAM_TEMPLATES['general'];
        }

        // Ensure the creator is an ADMIN in the new team, regardless of their status in other teams.
        // Also reset team-specific data like skills and check-ins for the new context.
        const newAdminUser: TeamMember = {
            ...currentUser,
            permissions: Array.from(new Set([...currentUser.permissions, 'admin', 'scheduler'])),
            skills: [], 
            checkIns: [],
            // Keep personal info (name, contact, availability)
        };

        const newTeam: Team = {
            id: `team_${Date.now()}`,
            name: teamName,
            type,
            description: type === 'custom' ? description : undefined,
            features: template.features,
            members: [newAdminUser], // Use the new admin user instance
            roles: template.roles, 
            skills: template.skills,
            inviteCode: `JOIN${Date.now()}`.slice(-8),
            adminInviteCode: `ADMIN${Date.now()}`.slice(-9),
            announcements: [],
            scriptures: MOCK_SCRIPTURES,
            serviceEvents: [],
            achievements: template.achievements,
            children: [],
            inventory: [],
            departments: [],
        };
        const newTeams = [...teams, newTeam];
        setTeams(newTeams);
        setCurrentTeam(newTeam); 
        setCurrentUser(newAdminUser); // Switch context to the new team admin
        saveData(newTeams, newAdminUser, newTeam);
        return true;
    };
    
    const handleResetTeam = (teamId: string, adminToKeepId: string) => {
        const admin = teams.find(t => t.id === teamId)?.members.find(m => m.id === adminToKeepId);
        if (!admin) return;

        const newTeams = teams.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    members: [admin],
                    serviceEvents: [],
                    announcements: [],
                    shoutOuts: [],
                    customPrayerPoints: [],
                    videoAnalyses: [],
                    faqs: [],
                    trainingVideos: [],
                    children: [],
                    inventory: [],
                    departments: [],
                };
            }
            return t;
        });
        setTeams(newTeams);
        setCurrentTeam(newTeams.find(t => t.id === teamId) || null);
        saveData(newTeams, currentUser, newTeams.find(t => t.id === teamId) || null);
    };
    
    const handleJoinCode = (code: string) => {
        const team = teams.find(t => t.inviteCode === code || t.adminInviteCode === code);
        return team?.id || null;
    };

    const handleExternalInvite = (code: string, teamName: string, teamType: TeamType = 'general', features?: TeamFeatures) => {
        let team = teams.find(t => t.inviteCode === code || t.adminInviteCode === code);
        if (team) return team.id;

        if (teamName) {
             // Safely decode URI component
             let decodedName = teamName;
             try {
                 decodedName = decodeURIComponent(teamName);
             } catch (e) {
                 console.error("Failed to decode team name from URL", e);
             }

             try {
                // Determine template based on type
                let template = TEAM_TEMPLATES['general'];
                if (teamType && teamType !== 'custom' && TEAM_TEMPLATES[teamType]) {
                    template = TEAM_TEMPLATES[teamType];
                }
                
                // Use provided features if available (e.g., from custom team link), otherwise fallback to template
                const teamFeatures = features || template.features;

                const stubTeam: Team = {
                    id: `team_${Date.now()}`,
                    name: decodedName,
                    type: teamType,
                    features: teamFeatures,
                    members: [],
                    roles: template.roles,
                    skills: template.skills,
                    inviteCode: code,
                    adminInviteCode: `ADMIN${Date.now()}`,
                    announcements: [],
                    scriptures: MOCK_SCRIPTURES,
                    serviceEvents: [],
                    achievements: template.achievements,
                    children: [],
                    inventory: [],
                    departments: [],
                };
                const newTeams = [...teams, stubTeam];
                setTeams(newTeams);
                saveData(newTeams, currentUser, currentTeam);
                return stubTeam.id;
             } catch (error) {
                 console.error("Error creating stub team", error);
                 return null;
             }
        }
        return null;
    }
    
    const isAdminCode = (code: string) => {
        return teams.some(t => t.adminInviteCode === code);
    };

    const handleSignUp = (details: Omit<TeamMember, 'id' | 'status' | 'permissions' | 'skills' | 'checkIns' | 'availability'>, password: string, teamId: string, isAdmin: boolean, autoApprove: boolean = false) => {
        if(teams.flatMap(t => t.members).some(m => m.username.toLowerCase() === details.username.toLowerCase())) {
            return 'Username already exists.';
        }
        
        const newMember: TeamMember = {
            ...details,
            id: `user_${Date.now()}`,
            status: (isAdmin || autoApprove) ? 'active' : 'pending-approval',
            permissions: isAdmin ? ['admin', 'scheduler'] : [],
            skills: [],
            checkIns: [],
            availability: {},
        };
        
        const newTeams = teams.map(t => {
            if (t.id === teamId) {
                return { ...t, members: [...t.members, newMember] };
            }
            return t;
        });
        
        setTeams(newTeams);
        saveData(newTeams, currentUser, currentTeam);
        return true;
    }

    const handleAdminRegistration = async (teamName: string, type: TeamType, details: Omit<TeamMember, 'id' | 'status' | 'permissions' | 'skills' | 'checkIns' | 'availability'>, password: string, description?: string, focusAreas?: string[]): Promise<string | boolean> => {
        if (teams.some(t => t.name.toLowerCase() === teamName.toLowerCase())) {
            return 'A team with this name already exists.';
        }
        if(teams.flatMap(t => t.members).some(m => m.username.toLowerCase() === details.username.toLowerCase())) {
            return 'Username already exists.';
        }

        const newAdmin: TeamMember = {
            ...details,
            id: `user_${Date.now()}`,
            status: 'active',
            permissions: ['admin', 'scheduler'],
            skills: [],
            checkIns: [],
            availability: {},
        };

        let template;
        if (type === 'custom' && description) {
            try {
                template = await generateTeamTemplate(description, focusAreas);
            } catch (error) {
                 console.error("Failed to generate custom template:", error);
                 return "Failed to generate custom team structure. Please try again or select a preset.";
            }
        } else if (type !== 'custom') {
             template = TEAM_TEMPLATES[type] || TEAM_TEMPLATES['media'];
        } else {
             template = TEAM_TEMPLATES['general'];
        }

        const newTeam: Team = {
            id: `team_${Date.now()}`,
            name: teamName,
            type,
            description: type === 'custom' ? description : undefined,
            features: template.features,
            members: [newAdmin],
            roles: template.roles,
            skills: template.skills,
            inviteCode: `JOIN${Date.now()}`.slice(-8),
            adminInviteCode: `ADMIN${Date.now()}`.slice(-9),
            announcements: [],
            scriptures: MOCK_SCRIPTURES,
            serviceEvents: [],
            achievements: template.achievements,
            children: [],
            inventory: [],
            departments: [],
        };

        const newTeams = [...teams, newTeam];
        setTeams(newTeams);
        saveData(newTeams, null, null); 
        return true;
    };

    // Child Management Functions
    const handleAddChild = (childData: Omit<Child, 'id' | 'status' | 'lastCheckIn' | 'lastCheckOut' | 'checkedInBy'>) => {
        if (!currentTeam) return;
        const newChild: Child = {
            ...childData,
            id: `child_${Date.now()}`,
            status: 'checked-out'
        };
        const updatedTeam = { ...currentTeam, children: [...(currentTeam.children || []), newChild] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleUpdateChild = (child: Child) => {
         if (!currentTeam) return;
         const updatedTeam = { 
             ...currentTeam, 
             children: (currentTeam.children || []).map(c => c.id === child.id ? child : c) 
         };
         const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
         setTeams(newTeams);
         setCurrentTeam(updatedTeam);
         saveData(newTeams, currentUser, updatedTeam);
    };

    const handleDeleteChild = (childId: string) => {
        if (!currentTeam) return;
        const updatedTeam = {
            ...currentTeam,
            children: (currentTeam.children || []).filter(c => c.id !== childId)
        };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    }

    const handleChildCheckIn = (childId: string) => {
        if (!currentTeam || !currentUser) return;
        const updatedTeam = {
            ...currentTeam,
            children: (currentTeam.children || []).map(c => {
                if (c.id === childId) {
                    return { 
                        ...c, 
                        status: 'checked-in' as const, 
                        lastCheckIn: new Date(), 
                        checkedInBy: currentUser.id 
                    };
                }
                return c;
            })
        };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleChildCheckOut = (childId: string) => {
        if (!currentTeam) return;
         const updatedTeam = {
            ...currentTeam,
            children: (currentTeam.children || []).map(c => {
                if (c.id === childId) {
                    return { 
                        ...c, 
                        status: 'checked-out' as const, 
                        lastCheckOut: new Date(),
                        checkedInBy: undefined
                    };
                }
                return c;
            })
        };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    // Inventory Management
    const handleAddInventoryItem = (item: Omit<InventoryItem, 'id' | 'status'>) => {
        if (!currentTeam) return;
        const newItem: InventoryItem = {
            ...item,
            id: `inv_${Date.now()}`,
            status: 'available'
        };
        const updatedTeam = { ...currentTeam, inventory: [...(currentTeam.inventory || []), newItem] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    };

    const handleUpdateInventoryItem = (item: InventoryItem) => {
        if (!currentTeam) return;
        
        // Logic ensuring item integrity: if status is not in-use, clear assignment
        let finalItem = { ...item };
        if (item.status !== 'in-use' && item.assignedTo) {
            const { assignedTo, ...rest } = item;
            finalItem = rest as InventoryItem;
        }

        const updatedTeam = { ...currentTeam, inventory: (currentTeam.inventory || []).map(i => i.id === finalItem.id ? finalItem : i) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    }

    const handleDeleteInventoryItem = (itemId: string) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, inventory: (currentTeam.inventory || []).filter(i => i.id !== itemId) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    }

    const handleCheckOutItem = (itemId: string, memberId: string) => {
        if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, inventory: (currentTeam.inventory || []).map(i => i.id === itemId ? { ...i, status: 'in-use' as const, assignedTo: memberId } : i) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    }

    const handleCheckInItem = (itemId: string) => {
         if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, inventory: (currentTeam.inventory || []).map(i => i.id === itemId ? { ...i, status: 'available' as const, assignedTo: undefined } : i) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    }

    // Departments Management
    const handleAddDepartment = (name: string) => {
        if (!currentTeam) return;
        const newDept: Department = { id: `dept_${Date.now()}`, name };
        const updatedTeam = { ...currentTeam, departments: [...(currentTeam.departments || []), newDept] };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    }

    const handleRemoveDepartment = (id: string) => {
         if (!currentTeam) return;
        const updatedTeam = { ...currentTeam, departments: (currentTeam.departments || []).filter(d => d.id !== id) };
        const newTeams = teams.map(t => t.id === currentTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        setCurrentTeam(updatedTeam);
        saveData(newTeams, currentUser, updatedTeam);
    }
    
    const handleExportTeam = () => {
        if (!currentTeam) return;
        const jsonString = JSON.stringify(currentTeam, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentTeam.name.replace(/\s+/g, '_')}_Data.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportTeam = (jsonString: string) => {
        try {
            const importedTeam = JSON.parse(jsonString, (key, value) => {
                if (key === 'date' || key === 'endDate' || key === 'callTime' || key === 'checkInTime' || key === 'timestamp' || key === 'dateAdded' || key === 'lastCheckIn' || key === 'lastCheckOut' || key === 'birthday') {
                    return value ? new Date(value) : undefined;
                }
                return value;
            });

            if (!importedTeam.id || !importedTeam.name) {
                alert("Invalid team file format.");
                return false;
            }

            const existingTeamIndex = teams.findIndex(t => t.id === importedTeam.id);
            let newTeams = [...teams];

            if (existingTeamIndex >= 0) {
                if (window.confirm(`Team "${importedTeam.name}" already exists. Overwrite?`)) {
                    newTeams[existingTeamIndex] = importedTeam;
                } else {
                    return false;
                }
            } else {
                newTeams.push(importedTeam);
            }

            setTeams(newTeams);
            saveData(newTeams, currentUser, currentTeam);
            alert("Team data imported successfully!");
            return true;
        } catch (e) {
            console.error("Import error:", e);
            alert("Failed to import team data. File might be corrupted.");
            return false;
        }
    };


    return {
        allUsers: teams.flatMap(t => t.members),
        allTeams: teams,
        myTeams: teams.filter(t => t.members.some(m => m.id === currentUser?.id)),
        currentUser,
        currentTeam,
        isDataLoaded,
        handleLogin,
        handleLogout,
        handleUpdateEvent,
        handleCheckIn,
        handleUpdateCurrentUser,
        handleAddShoutOut,
        handleAddAnnouncement,
        handleRemoveAnnouncement,
        handleMarkAsRead,
        handleAddPrayerPoint,
        handleRemovePrayerPoint,
        handleUpdateTeam,
        handleUpdateMember,
        handleRemoveMember,
        handleAddVideoAnalysis,
        handleAddFaq,
        handleUpdateFaq,
        handleDeleteFaq,
        handleAddTrainingVideo,
        handleUpdateTrainingVideo,
        handleDeleteTrainingVideo,
        handleSwitchTeam,
        handleCreateTeam,
        handleResetTeam,
        handleJoinCode,
        handleExternalInvite,
        isAdminCode,
        handleSignUp,
        handleAdminRegistration,
        handleAddChild,
        handleUpdateChild,
        handleDeleteChild,
        handleChildCheckIn,
        handleChildCheckOut,
        handleAddInventoryItem,
        handleUpdateInventoryItem,
        handleDeleteInventoryItem,
        handleCheckOutItem,
        handleCheckInItem,
        handleAddDepartment,
        handleRemoveDepartment,
        handleExportTeam,
        handleImportTeam,
    };
};
