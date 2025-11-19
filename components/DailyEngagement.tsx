
import React, { useState, useEffect, useMemo } from 'react';
import { generateDailyPrayerPoints } from '../services/geminiService.ts';
import type { PrayerPoint, Team, TeamMember } from '../types.ts';
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPointText, setNewPointText] = useState('');

    const isAdmin = useMemo(() => hasPermission(currentUser, 'admin'), [currentUser]);

    useEffect(() => {
        const fetchPrayerPoints = async () => {
            const today = new Date().toISOString().split('T')[0];
            // Cache key should probably include team ID so switching teams doesn't show wrong prayers, but for now simplified.
            const cachedData = localStorage.getItem(`daily_engagement_${team.id}_${today}`);

            if (cachedData) {
                setAiPrayerPoints(JSON.parse(cachedData));
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            setError(null);
            try {
                // The API returns { text: string }[], so we add a temporary client-side ID
                const pointsFromApi = await generateDailyPrayerPoints(team.type, team.description);
                const pointsWithIds = pointsFromApi.map((p, index) => ({ ...p, id: `ai_${index}`}));
                setAiPrayerPoints(pointsWithIds);
                localStorage.setItem(`daily_engagement_${team.id}_${today}`, JSON.stringify(pointsWithIds));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load prayer points.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrayerPoints();
    }, [team.id, team.type, team.description]); // Re-fetch if team changes

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

    const renderPrayerPoints = () => {
        if (isLoading && combinedPrayerPoints.length === 0) {
            return (
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                </div>
            );
        }

        if (error && combinedPrayerPoints.length === 0) {
            return <p className="text-sm text-red-600">{error}</p>;
        }
        
        if (combinedPrayerPoints.length === 0) {
            return <p className="text-sm text-gray-500 italic">No prayer points for today.</p>
        }

        return (
            <ul className="space-y-2">
                {combinedPrayerPoints.map((point) => (
                    <li key={point.id} className="flex items-start gap-2">
                        <span className="text-brand-primary pt-0.5">🙏</span>
                        <p className="text-sm text-gray-700 flex-grow">{point.text}</p>
                        {isAdmin && (
                            <button 
                                onClick={() => onRemovePrayerPoint(point.id)} 
                                className="ml-2 text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100"
                                title="Remove this prayer point"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Today's Prayer Focus
                </h3>
                {renderPrayerPoints()}
            </div>
            
            {isAdmin && (
                <div className="border-t pt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-600">Add a Prayer Point</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newPointText}
                            onChange={(e) => setNewPointText(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleAdd() }}
                            placeholder="Pray for..."
                            className="flex-grow block w-full pl-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                        <button onClick={handleAdd} className="px-3 py-1.5 bg-brand-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Add</button>
                    </div>
                </div>
            )}
            
            <div className="border-t pt-4">
                 <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Daily Reflection
                </h3>
                <p className="text-sm text-gray-700 italic">"{dailyQuestion}"</p>
            </div>
        </div>
    );
};
