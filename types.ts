
// types.ts

export type View =
  | 'my-schedule'
  | 'full-schedule'
  | 'team'
  | 'reports'
  | 'review'
  | 'training'
  | 'encouragement'
  | 'faq'
  | 'profile'
  | 'children'
  | 'inventory';

export enum Proficiency {
  TRAINEE = 'Trainee',
  NOVICE = 'Novice (Needs Supervision)',
  SOLO_OPERATOR = 'Solo Operator',
  MASTER_TRAINER = 'Master / Trainer',
}

export interface Skill {
  id: string;
  name: string;
}

export interface MemberSkill {
  skillId: string;
  proficiency: Proficiency;
}

export interface CheckIn {
  eventId: string;
  checkInTime: Date;
  location?: { latitude: number; longitude: number };
}

export interface PersonalGoal {
    id: string;
    text: string;
    status: 'todo' | 'in-progress' | 'completed';
}

export interface PushSubscriptionJSON {
    endpoint: string;
    keys?: {
        p256dh: string;
        auth: string;
    };
    expirationTime?: number | null;
}

export interface TeamMember {
  id: string;
  name:string;
  username: string;
  pronouns?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status: 'active' | 'pending-approval';
  permissions: ('admin' | 'scheduler')[];
  skills: MemberSkill[];
  checkIns: CheckIn[];
  availability: Record<string, 'available' | 'unavailable'>;
  aboutMe?: string;
  favoriteMoment?: string;
  personalGoals?: PersonalGoal[];
  strengths?: string[];
  growthAreas?: string[];
  suggestedGrowthAreas?: string[]; 
  awardedAchievements?: string[];
  pushSubscription?: PushSubscriptionJSON | null;
}

export type SignUpDetails = Omit<TeamMember, 'id' | 'status' | 'permissions' | 'skills' | 'checkIns' | 'availability' | 'awardedAchievements' | 'pushSubscription'>;

export interface Department {
    id: string;
    name: string;
}

export interface Role {
  id: string;
  name: string;
  requiredSkillId?: string;
  departmentId?: string;
}

export interface Briefing {
    keyFocusPoints: string[];
    potentialChallenges: string[];
    communicationCues: string[];
}

export interface Assignment {
  roleId: string;
  memberId: string | null;
  traineeId?: string | null;
  status?: 'pending' | 'accepted' | 'declined';
  declineReason?: string;
  briefing?: Briefing;
}

export interface MemberDebrief {
    memberId: string;
    whatWentWell: string;
    whatCouldBeImproved: string;
    actionItems: string;
}

export interface Attire {
    theme: string;
    description: string;
    colors: [string, string];
}

export interface Location {
    address: string;
    latitude?: number;
    longitude?: number;
}

export interface EventResource {
    id: string;
    title: string;
    url: string;
    type: 'link' | 'document' | 'music' | 'video';
}

export interface ServiceEvent {
  id: string;
  name: string;
  date: Date;
  endDate?: Date; 
  callTime: Date;
  assignments: Assignment[];
  debriefs?: MemberDebrief[];
  attire?: Attire;
  attireImages?: {
      men?: string;
      women?: string;
  };
  location?: Location;
  serviceNotes?: string;
  resources?: EventResource[];
}

export interface ReadReceipt {
    userId: string;
    timestamp: Date;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: Date;
    authorId: string;
    readBy?: ReadReceipt[];
}

export interface Scripture {
    reference: string;
    text: string;
}

export interface ShoutOut {
    id: string;
    fromId: string;
    toId: string;
    message: string;
    date: Date;
}

export interface PrayerPoint {
    id: string;
    text: string;
}

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

export interface TrainingVideo {
    id: string;
    title: string;
    description: string;
    videoUrl: string; 
    uploadedBy: string;
    dateAdded: Date;
    month?: string;
    subject?: string;
}

export interface SavedAttireTheme extends Attire {}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: 'trophy' | 'star' | 'sound' | 'camera' | 'presentation' | 'video';
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    status: 'available' | 'in-use' | 'maintenance' | 'lost';
    assignedTo?: string; 
    notes?: string;
    serialNumber?: string;
}

export interface TeamFeatures {
    videoAnalysis: boolean;
    attire: boolean;
    training: boolean;
    childCheckIn: boolean;
    inventory: boolean;
}

export type TeamType = 'media' | 'ushering' | 'worship' | 'general' | 'youth' | 'custom';

export interface TeacherNote {
    id: string;
    content: string;
    authorName: string;
    date: Date;
}

export interface CheckInLogEntry {
    id: string;
    timestamp: Date;
    type: 'in' | 'out';
    processedByName: string;
}

export interface Child {
    id: string;
    name: string;
    avatarUrl?: string;
    age?: string;
    birthday?: Date;
    grade?: string;
    guardianName: string;
    guardianPhone: string;
    medicalNotes?: string; 
    status: 'checked-in' | 'checked-out';
    lastCheckIn?: Date;
    lastCheckOut?: Date;
    lastProcessedByName?: string;
    checkInHistory?: CheckInLogEntry[];
    notes?: string;
    teacherNotes?: TeacherNote[];
}

export interface Team {
    id: string;
    name: string;
    type: TeamType;
    description?: string;
    features: TeamFeatures;
    members: TeamMember[];
    roles: Role[];
    skills: Skill[];
    departments?: Department[];
    inviteCode: string;
    inviteCodeCreatedAt?: Date;
    adminInviteCode: string;
    adminInviteCodeCreatedAt?: Date;
    announcements: Announcement[];
    scriptures: Scripture[];
    shoutOuts?: ShoutOut[];
    serviceEvents: ServiceEvent[];
    customPrayerPoints?: PrayerPoint[];
    deletedAiPrayerPointIds?: string[];
    videoAnalyses?: VideoAnalysis[];
    faqs?: FaqItem[];
    trainingVideos?: TrainingVideo[];
    savedLocations?: string[];
    savedAttireThemes?: SavedAttireTheme[];
    achievements?: Achievement[];
    children?: Child[];
    inventory?: InventoryItem[];
    brandColors?: {
        primary: string;
        secondary: string;
    };
}

export interface VideoAnalysisResult {
    summary: string;
    positiveFeedback: string[];
    areasForImprovement: string[];
    bestShot: string;
    shotForImprovement: string;
}

export interface VideoAnalysis {
    id: string;
    videoUrl: string;
    result: VideoAnalysisResult;
    requestedBy: string; 
    timestamp: Date;
}

export interface VideoAnalysisTrends {
    overallSummary: string;
    recurringStrengths: string[];
    recurringImprovementAreas: string[];
}

export interface SuggestedAssignment {
    roleId: string;
    memberId: string;
    reasoning: string;
}

export interface TrainingScenarioItem {
    scenario: string;
    question: string;
    options: {
        text: string;
        isCorrect: boolean;
        feedback: string;
    }[];
}

export interface DebriefAnalysisSummary {
    overallSummary: string;
    strengths: string[];
    areasForImprovement: string[];
    growthOpportunities: string[];
}

export interface GrowthResource {
    type: 'YouTube Video' | 'Book' | 'Article' | 'Tip';
    title: string;
    description: string;
    url?: string;
}

export interface AttendanceStats {
    totalAssignments: number;
    onTime: number;
    early: number;
    late: number;
    noShow: number;
    onTimePercentage: number;
    reliabilityScore: number;
}

export interface PerformanceAlert {
    type: 'lateness' | 'no-shows';
    level: 'warning' | 'critical';
    message: string;
}
