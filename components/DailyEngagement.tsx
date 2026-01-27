
import React, { useState, useEffect, useMemo } from 'react';
import { generateDailyPrayerPoints, generateTeamMission } from '../services/geminiService.ts';
import type { PrayerPoint, Team, TeamMember, TeamMission } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';

const DAILY_QUESTIONS = [
    "Did you pray for the team today?",
    "What is one area you're intentionally growing in this week?",
    "Who is someone on the team you can encourage today?",
    "How have you seen God at work in our services recently?",
    "What's one practical way you can improve your craft this week?"
];

const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

interface DailyEngagementProps {
    team: Team;
    currentUser: TeamMember;
    onAddPrayerPoint: (text: string) => void;
    onRemovePrayerPoint: (pointId: string) => void;
}


export const DailyEngagement: React.FC<DailyEngagementProps> = ({ team, currentUser, onAddPrayerPoint, onRemovePrayerPoint }) => {
    const [aiPrayerPoints, setAiPrayerPoints] = useState<PrayerPoint[]>([]);
    const [teamMission, setTeamMission] = useState<TeamMission | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMissionLoading, setIsMissionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newPointText, setNewPointText] = useState('');

    const isAdmin = useMemo(() => hasPermission(currentUser, 'admin'), [currentUser]);

    useEffect(() => {
        const fetchData = async () => {
            const today = new Date().toISOString().split('T')[0];
            const prayerCacheKey = `daily_engagement_${team.id}_${today}`;
            const missionCacheKey = `team_mission_${team.id}_${today}`;
            
            const cachedPrayers = localStorage.getItem(prayerCacheKey);
            const cachedMission = localStorage.getItem(missionCacheKey);

            if (cachedPrayers) setAiPrayerPoints(JSON.parse(cachedPrayers));
            if (cachedMission) setTeamMission(JSON.parse(cachedMission));
            
            setIsLoading(true);
            setError(null);

            try {
                // Fetch Prayers if not cached
                if (!cachedPrayers) {
                    const pointsFromApi = await generateDailyPrayerPoints(team.type, team.description);
                    const pointsWithIds = pointsFromApi.map((p, index) => ({ ...p, id: `ai_${index}`}));
                    setAiPrayerPoints(pointsWithIds);
                    localStorage.setItem(prayerCacheKey, JSON.stringify(pointsWithIds));
                }

                // Fetch Mission if not cached and history exists
                if (!cachedMission && team.videoAnalyses && team.videoAnalyses.length > 0) {
                    setIsMissionLoading(true);
                    const mission = await generateTeamMission(team.videoAnalyses);
                    setTeamMission(mission);
                    localStorage.setItem(missionCacheKey, JSON.stringify(mission));
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load engagement data.");
            } finally {
                setIsLoading(false);
                setIsMissionLoading(false);
            }
        };

        fetchData();
    }, [team.id, team.type]);

    const dailyQuestion = DAILY_QUESTIONS[getDayOfYear() % DAILY_QUESTIONS.length];
    const combinedPrayerPoints = useMemo(() => {
        const deletedAiIds = new Set(team.deletedAiPrayerPointIds || []);
        const filteredAiPoints = aiPrayerPoints.filter(p => !deletedAiIds.has(p.id));
        return [...filteredAiPoints, ...(team.customPrayerPoints || [])];
    }, [aiPrayerPoints, team.customPrayerPoints, team.deletedAiPrayerPointIds]);

    const handleAdd = () => {
        if (newPointText.trim()) {
            onAddPrayerPoint(newPointText.trim());
            setNewPointText('');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Team Mission Section - HIGHEST PRIORITY */}
            {teamMission && (
                <div className="bg-brand-primary rounded-xl shadow-lg p-6 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black tracking-widest uppercase">Weekly Mission</span>
                             {isMissionLoading && <span className="animate-pulse text-[10px] font-bold">Refreshing...</span>}
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tight">{teamMission.title}</h3>
                        <p className="mt-3 text-lg font-bold leading-tight border-l-2 border-white/40 pl-3">"{teamMission.objective}"</p>
                        <p className="mt-4 text-xs font-medium text-white/80 leading-relaxed max-w-lg">{teamMission.reasoning}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6 space-y-6 border-t-4 border-brand-secondary">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        Daily Prayer Focus
                    </h3>
                    {isLoading && combinedPrayerPoints.length === 0 ? (
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-full"></div>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {combinedPrayerPoints.map((point) => (
                                <li key={point.id} className="flex items-start gap-3 group">
                                    <span className="text-brand-primary text-sm mt-0.5 opacity-60">🙏</span>
                                    <p className="text-sm text-gray-700 leading-relaxed flex-grow font-medium">{point.text}</p>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => onRemovePrayerPoint(point.id)} 
                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                {isAdmin && (
                    <div className="flex gap-2 pt-2">
                        <input
                            type="text"
                            value={newPointText}
                            onChange={(e) => setNewPointText(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleAdd() }}
                            placeholder="Add to the prayer wall..."
                            className="flex-grow block w-full pl-3 py-1.5 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                        />
                        <button onClick={handleAdd} className="px-4 py-1.5 bg-brand-secondary text-white text-sm font-black uppercase tracking-widest rounded-lg shadow-sm">Add</button>
                    </div>
                )}
                
                <div className="border-t pt-4">
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Team Reflection</h3>
                    <p className="text-sm text-gray-800 font-bold italic leading-tight">"{dailyQuestion}"</p>
                </div>
            </div>
        </div>
    );
};
