import React, { useState, useMemo } from 'react';
import type { TeamMember, ServiceEvent, GrowthResource, Team } from '../types.ts';
import { Proficiency } from '../types.ts';
import { calculateAttendanceStats, detectPerformanceIssues } from '../utils/performance.ts';
import { Avatar } from './Avatar.tsx';
import { EditableSection } from './EditableSection.tsx';
import { ProfilePictureModal } from './ProfilePictureModal.tsx';
import { AvailabilityCalendar } from './AvailabilityCalendar.tsx';
import { PersonalGoalsCard } from './PersonalGoalsCard.tsx';
import { AchievementBadge } from './AchievementBadge.tsx';
import { StrengthsGrowthCard } from './StrengthsGrowthCard.tsx';
import { PracticeScenarioModal } from './PracticeScenarioModal.tsx';
import { PerformanceAlerts } from './PerformanceAlerts.tsx';
import { MyAttendanceCard } from './MyAttendanceCard.tsx';
import { GrowthPlan } from './GrowthPlan.tsx';
import { generateGrowthPlan } from '../services/geminiService.ts';
import { NotificationSettings } from './NotificationSettings.tsx';

interface ProfileViewProps {
  currentUser: TeamMember;
  onUpdateUser: (user: TeamMember) => void;
  serviceEvents: ServiceEvent[];
  currentTeam: Team;
}

const ProficiencyProgressBar: React.FC<{ skillName: string, proficiency: Proficiency }> = ({ skillName, proficiency }) => {
    const levels = {
        [Proficiency.TRAINEE]: { width: '25%', color: 'bg-gray-400', label: 'Level 1: Trainee' },
        [Proficiency.NOVICE]: { width: '50%', color: 'bg-blue-500', label: 'Level 2: Novice' },
        [Proficiency.SOLO_OPERATOR]: { width: '75%', color: 'bg-green-500', label: 'Level 3: Solo' },
        [Proficiency.MASTER_TRAINER]: { width: '100%', color: 'bg-purple-600', label: 'Level 4: Master' },
    };
    
    const config = levels[proficiency];

    return (
        <div className="mb-4">
            <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-gray-700">{skillName}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{config.label}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border">
                <div className={`${config.color} h-full transition-all duration-1000`} style={{ width: config.width }}></div>
            </div>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUpdateUser, serviceEvents, currentTeam }) => {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [practiceScenarioArea, setPracticeScenarioArea] = useState<string | null>(null);
  const [growthPlan, setGrowthPlan] = useState<GrowthResource[] | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const myAchievements = useMemo(() => {
    const allTeamAchievements = currentTeam.achievements || [];
    return allTeamAchievements.filter(ach => currentUser.awardedAchievements?.includes(ach.id));
  }, [currentUser.awardedAchievements, currentTeam.achievements]);
  
  const attendanceStats = useMemo(() => calculateAttendanceStats(currentUser, serviceEvents), [currentUser, serviceEvents]);
  const performanceAlerts = useMemo(() => detectPerformanceIssues(attendanceStats), [attendanceStats]);

  const handleGeneratePlan = async () => {
    if (!currentUser.growthAreas || currentUser.growthAreas.length === 0) return;
    setIsGeneratingPlan(true);
    setPlanError(null);
    setGrowthPlan(null);
    try {
      const plan = await generateGrowthPlan(currentUser.growthAreas);
      setGrowthPlan(plan);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Failed to generate growth plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const skillBreakdown = useMemo(() => {
      return currentUser.skills.map(s => {
          const name = currentTeam.skills.find(sk => sk.id === s.skillId)?.name || 'Unknown Skill';
          return { name, proficiency: s.proficiency };
      });
  }, [currentUser.skills, currentTeam.skills]);

  return (
    <div className="space-y-8 p-4 sm:p-0">
        {performanceAlerts.length > 0 && <PerformanceAlerts alerts={performanceAlerts} />}
        
        <div id="guide-profile-header" className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative">
                    <Avatar avatarUrl={currentUser.avatarUrl} name={currentUser.name} sizeClassName="w-32 h-32 text-5xl" />
                    <button onClick={() => setIsAvatarModalOpen(true)} className="absolute -bottom-2 -right-2 bg-brand-primary text-white rounded-full p-2 hover:bg-brand-primary-dark border-2 border-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    </button>
                </div>
                <div className="flex-grow text-center sm:text-left">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">{currentUser.name}</h2>
                            <p className="text-md text-gray-600">{currentUser.pronouns}</p>
                            <div className="mt-2 text-sm text-gray-500">
                                <p>{currentUser.email}</p>
                                <p>{currentUser.phoneNumber}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MyAttendanceCard stats={attendanceStats} />
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-brand-secondary">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Skillset Maturity</h3>
                <p className="text-sm text-gray-500 mb-6">Tracking your technical growth in the ministry.</p>
                {skillBreakdown.length > 0 ? (
                    <div className="space-y-4">
                        {skillBreakdown.map(s => (
                            <ProficiencyProgressBar key={s.name} skillName={s.name} proficiency={s.proficiency} />
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center bg-gray-50 rounded border-2 border-dashed">
                        <p className="text-sm text-gray-500 italic">No technical skills recorded yet. Master a role to see progress!</p>
                    </div>
                )}
            </div>
        </div>

        <NotificationSettings 
            onSubscriptionChange={(sub) => onUpdateUser({ ...currentUser, pushSubscription: sub ? JSON.parse(JSON.stringify(sub)) : null })}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EditableSection title="About Me" content={currentUser.aboutMe || ''} onSave={val => onUpdateUser({...currentUser, aboutMe: val})} placeholder="Tell us a bit about yourself..." isTextarea />
            <EditableSection title="Favorite Serving Moment" content={currentUser.favoriteMoment || ''} onSave={val => onUpdateUser({...currentUser, favoriteMoment: val})} placeholder="What's a memorable moment you've had while serving?" isTextarea />
        </div>

        <div id="guide-personal-goals">
            <PersonalGoalsCard goals={currentUser.personalGoals || []} onUpdateGoals={goals => onUpdateUser({ ...currentUser, personalGoals: goals })} />
        </div>
        
        <div id="guide-strengths-growth">
          <StrengthsGrowthCard user={currentUser} onUpdateUser={onUpdateUser} />
        </div>

        <div id="guide-growth-plan" className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Personalized Growth Plan</h3>
            <p className="text-sm text-gray-600 mb-4">Get AI-generated resources to help you in your selected growth areas.</p>
            {(currentUser.growthAreas && currentUser.growthAreas.length > 0) ? (
                <button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400">
                    {isGeneratingPlan ? 'Generating...' : 'Generate My Growth Plan'}
                </button>
            ) : <p className="text-sm text-gray-500 italic">Add some 'Areas for Growth' above to unlock a personalized growth plan!</p>}
            <GrowthPlan isLoading={isGeneratingPlan} error={planError} resources={growthPlan} />
        </div>
        
        <div id="guide-availability-calendar" className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">My Availability</h3>
          <p className="text-sm text-gray-600 mb-4">Click dates on the calendar to mark yourself as unavailable. Schedulers will see this and do their best to accommodate.</p>
          <AvailabilityCalendar 
            availability={currentUser.availability} 
            onUpdate={newAvailability => onUpdateUser({ ...currentUser, availability: newAvailability })} 
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Practice Scenarios</h3>
            <p className="text-sm text-gray-600 mb-4">Sharpen your skills with AI-generated practice scenarios based on your selected growth areas.</p>
            {(currentUser.growthAreas && currentUser.growthAreas.length > 0) ? (
                <div className="flex flex-wrap gap-2">
                    {currentUser.growthAreas.map(area => (
                        <button key={area} onClick={() => setPracticeScenarioArea(area)} className="px-3 py-1.5 bg-brand-secondary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark">
                            Practice: {area}
                        </button>
                    ))}
                </div>
            ) : <p className="text-sm text-gray-500 italic">Add some 'Areas for Growth' above to unlock practice scenarios!</p>}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">My Achievements</h3>
          {myAchievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {myAchievements.map(ach => <AchievementBadge key={ach.id} achievement={ach} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No achievements earned yet. Keep serving to unlock them!</p>
          )}
        </div>

        <ProfilePictureModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSave={base64 => onUpdateUser({ ...currentUser, avatarUrl: base64 })} />
        {practiceScenarioArea && (
            <PracticeScenarioModal 
                isOpen={!!practiceScenarioArea} 
                onClose={() => setPracticeScenarioArea(null)} 
                growthArea={practiceScenarioArea}
                teamType={currentTeam.type}
                teamDescription={currentTeam.description}
            />
        )}
    </div>
  );
};