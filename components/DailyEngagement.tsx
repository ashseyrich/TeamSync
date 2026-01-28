
import React, { useState, useEffect, useMemo } from 'react';
import { generateDailyPrayerPoints, generateTeamMission } from '../services/geminiService.ts';
import type { PrayerPoint, Team, TeamMember, TeamMission, TeamType } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';

const FALLBACKS: Record<TeamType | 'default', PrayerPoint[]> = {
    media: [
        { id: 'f1', text: "Pray for clarity for operators during technical transitions." },
        { id: 'f2', text: "Ask for peace in the production booth against distractions." },
        { id: 'f3', text: "Pray that excellence removes human distractions from the Gospel." }
    ],
    worship: [
        { id: 'f1', text: "Pray for a heart of worship that prioritizes presence over performance." },
        { id: 'f2', text: "Ask for unity and clear communication among musicians and vocalists." },
        { id: 'f3', text: "Pray that every note played points directly to the glory of Christ." }
    ],
    ushering: [
        { id: 'f1', text: "Pray for a spirit of hospitality and warm welcome for every guest." },
        { id: 'f2', text: "Ask for discernment and calmness in managing logistics and safety." },
        { id: 'f3', text: "Pray that our service helps remove barriers for those seeking God." }
    ],
    youth: [
        { id: 'f1', text: "Pray for wisdom and patience for all youth leaders and teachers." },
        { id: 'f2', text: "Ask for the safety and protection of every child in our care." },
        { id: 'f3', text: "Pray that seeds of faith are planted deep in young hearts today." }
    ],
    general: [
        { id: 'f1', text: "Pray for a unified team spirit and a servant's heart." },
        { id: 'f2', text: "Ask God to use our efforts to build His Kingdom locally." },
        { id: 'f3', text: "Pray for strength and joy for every volunteer serving today." }
    ],
    custom: [
        { id: 'f1', text: "Pray for the specific needs of our unique team mission." },
        { id: 'f2', text: "Ask for God's guidance as we pioneer this area of service." },
        { id: 'f3', text: "Pray for growth and technical mastery in our team's craft." }
    ],
    default: [
        { id: 'f1', text: "Pray for the team to serve with joy and excellence." },
        { id: 'f2', text: "Ask for God's presence to be felt by everyone we serve." },
        { id: 'f3', text: "Pray for the spiritual health of our ministry team." }
    ]
};

export const DailyEngagement: React.FC<{ team: Team; currentUser: TeamMember; onAddPrayerPoint: (t: string) => void; onRemovePrayerPoint: (id: string) => void; }> = ({ team, currentUser, onAddPrayerPoint, onRemovePrayerPoint }) => {
    const [aiPrayerPoints, setAiPrayerPoints] = useState<PrayerPoint[]>([]);
    const [teamMission, setTeamMission] = useState<TeamMission | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newPointText, setNewPointText] = useState('');

    const isAdmin = useMemo(() => hasPermission(currentUser, 'admin'), [currentUser]);

    useEffect(() => {
        const fetchData = async () => {
            const today = new Date().toISOString().split('T')[0];
            const prayerKey = `pr_${team.id}_${today}`;
            const cached = localStorage.getItem(prayerKey);
            if (cached) setAiPrayerPoints(JSON.parse(cached));
            setIsLoading(true);
            try {
                if (!cached) {
                    const res = await generateDailyPrayerPoints(team.type, team.description);
                    const pts = res.map((p, i) => ({ ...p, id: `ai_${i}` }));
                    setAiPrayerPoints(pts);
                    localStorage.setItem(prayerKey, JSON.stringify(pts));
                }
                if (team.videoAnalyses && team.videoAnalyses.length > 0) {
                    const mission = await generateTeamMission(team.videoAnalyses);
                    setTeamMission(mission);
                }
            } catch (err) { console.warn("AI Offline."); }
            finally { setIsLoading(false); }
        };
        fetchData();
    }, [team.id, team.type]);

    const displayPoints = useMemo(() => {
        const deleted = new Set(team.deletedAiPrayerPointIds || []);
        const filtered = aiPrayerPoints.filter(p => !deleted.has(p.id));
        const custom = team.customPrayerPoints || [];
        const combined = [...filtered, ...custom];
        if (combined.length === 0 && !isLoading) return FALLBACKS[team.type] || FALLBACKS.default;
        return combined;
    }, [aiPrayerPoints, team.customPrayerPoints, team.deletedAiPrayerPointIds, isLoading, team.type]);

    return (
        <div className="space-y-6 animate-fade-in">
            {teamMission && (
                <div className="bg-brand-primary rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black tracking-widest uppercase">Objective</span>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mt-2">{teamMission.title}</h3>
                        <div className="mt-4 p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm italic font-bold">"{teamMission.objective}"</div>
                        <p className="mt-4 text-[10px] font-bold text-white/60 leading-relaxed uppercase tracking-widest">{teamMission.reasoning}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl p-8 border-t-8 border-brand-secondary overflow-hidden">
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3 italic mb-6">
                    <span className="w-2 h-6 bg-brand-secondary rounded-full"></span>
                    Mission Prayer Wall
                </h3>
                <div className="space-y-4">
                    {displayPoints.map((point) => (
                        <div key={point.id} className="flex items-start gap-4 group p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                            <span className="text-xl flex-shrink-0 bg-brand-secondary/10 w-10 h-10 rounded-xl flex items-center justify-center">🙌</span>
                            <div className="flex-grow pt-1">
                                <p className="text-sm text-gray-800 font-bold leading-relaxed">{point.text}</p>
                                {isAdmin && !point.id.startsWith('f') && (
                                    <button onClick={() => onRemovePrayerPoint(point.id)} className="text-[9px] font-black text-gray-300 hover:text-red-500 uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {isAdmin && (
                    <div className="mt-6 flex gap-2 p-1 bg-gray-50 rounded-2xl border-2 border-gray-100 focus-within:border-brand-primary transition-all">
                        <input type="text" value={newPointText} onChange={e => setNewPointText(e.target.value)} onKeyPress={e => e.key === 'Enter' && (onAddPrayerPoint(newPointText), setNewPointText(''))} placeholder="Add focus point..." className="flex-grow bg-transparent border-none px-4 py-3 text-sm font-bold focus:ring-0" />
                        <button onClick={() => { onAddPrayerPoint(newPointText); setNewPointText(''); }} className="px-6 py-3 bg-brand-secondary text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:bg-brand-secondary-dark transform active:scale-95 transition-all">Add</button>
                    </div>
                )}
            </div>
        </div>
    );
};
