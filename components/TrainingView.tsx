
import React, { useState, useMemo } from 'react';
import type { Team, TeamMember, TrainingVideo } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';
import { TrainingScenario } from './TrainingScenario.tsx';
import { AddEditTrainingVideoModal } from './AddEditTrainingVideoModal.tsx';
import { VideoPlayerModal } from './VideoPlayerModal.tsx';
import { ensureDate } from '../utils/performance.ts';

const COMMON_SOFT_SKILLS = [
    'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Adaptability',
    'Timeliness', 'Attention to Detail', 'Following Directions'
];

interface GroupedVideos {
    [month: string]: {
        [subject: string]: TrainingVideo[];
    };
}

interface TrainingViewProps {
  team: Team;
  currentUser: TeamMember;
  onAddVideo: (videoData: Omit<TrainingVideo, 'id' | 'uploadedBy' | 'dateAdded'>) => void;
  onUpdateVideo: (video: TrainingVideo) => void;
  onDeleteVideo: (videoId: string) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ team, currentUser, onAddVideo, onUpdateVideo, onDeleteVideo }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null);
    const [playingVideo, setPlayingVideo] = useState<TrainingVideo | null>(null);
    const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

    const isAdmin = useMemo(() => hasPermission(currentUser, 'admin'), [currentUser]);
    const memberMap = useMemo(() => new Map(team.members.map(m => [m.id, m.name])), [team.members]);

    // Combine team-specific technical skills with common soft skills for the practice buttons
    const skillOptions = useMemo(() => {
        const teamSkillNames = team.skills.map(s => s.name);
        // Combine and dedupe
        return Array.from(new Set([...teamSkillNames, ...COMMON_SOFT_SKILLS]));
    }, [team.skills]);

    const [selectedSkill, setSelectedSkill] = useState(skillOptions[0] || 'Communication');

    const groupedVideos = useMemo(() => {
        const groups: GroupedVideos = {};
        const videos = Array.isArray(team.trainingVideos) ? team.trainingVideos : [];

        videos.forEach(video => {
            const month = video.month || 'Uncategorized';
            const subject = video.subject || 'General';
            if (!groups[month]) {
                groups[month] = {};
            }
            if (!groups[month][subject]) {
                groups[month][subject] = [];
            }
            groups[month][subject].push(video);
        });
        
        // Sort months chronologically, with "Uncategorized" at the end
        return Object.entries(groups).sort(([monthA], [monthB]) => {
            if (monthA === 'Uncategorized') return 1;
            if (monthB === 'Uncategorized') return -1;
            
            // Attempt chronological sort by treating month string as a date
            const dateA = new Date(monthA);
            const dateB = new Date(monthB);
            
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return monthA.localeCompare(monthB);
            return dateB.getTime() - dateA.getTime();
        });
    }, [team.trainingVideos]);

    const handleSaveVideo = (videoData: TrainingVideo) => {
        if (editingVideo) {
            onUpdateVideo(videoData);
        } else {
            const { id, uploadedBy, dateAdded, ...newVideoData } = videoData;
            onAddVideo(newVideoData);
        }
        setIsModalOpen(false);
        setEditingVideo(null);
    };

    const handleDeleteVideo = (video: TrainingVideo) => {
        if (window.confirm(`Are you sure you want to delete the training video: "${video.title}"?`)) {
            onDeleteVideo(video.id);
        }
    };
    
    const openAddModal = () => {
        setEditingVideo(null);
        setIsModalOpen(true);
    };

    const openEditModal = (video: TrainingVideo) => {
        setEditingVideo(video);
        setIsModalOpen(true);
    };

    const toggleMonth = (month: string) => {
        setOpenMonths(prev => ({ ...prev, [month]: !prev[month] }));
    };
    
    return (
        <div className="p-4 sm:p-0 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Training & Development</h2>
                    <p className="text-md text-gray-600 font-medium">Equipping the team for technical and spiritual excellence.</p>
                </div>
                {isAdmin && (
                    <button 
                        id="guide-add-training-video-btn"
                        onClick={openAddModal}
                        className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark flex items-center gap-2"
                    >
                       + Add Training Video
                    </button>
                )}
            </div>

            <div id="guide-training-scenarios" className="bg-white p-6 rounded-lg shadow-md border-t-4 border-brand-secondary">
                <h3 className="text-xl font-bold text-gray-800">AI-Powered Practice Scenarios</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4">Sharpen your decision-making with realistic scenarios generated by AI based on your team's specific roles. Select a skill to practice.</p>
                <div className="flex flex-wrap gap-2">
                    {skillOptions.map(skill => (
                        <button
                            key={skill}
                            onClick={() => setSelectedSkill(skill)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-all ${selectedSkill === skill ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-200 border-gray-200'}`}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
                <div className="mt-6 border-t pt-4">
                    <TrainingScenario 
                        key={selectedSkill} 
                        skill={selectedSkill} 
                        teamType={team.type} 
                        teamDescription={team.description}
                    />
                </div>
            </div>
            
            <div id="guide-training-library" className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800">Team Training Library</h3>
                <p className="text-sm text-gray-600 mt-1 mb-6">A library of curated videos for team training and reference, organized by topic.</p>
                <div className="space-y-4">
                    {groupedVideos.length > 0 ? (
                        groupedVideos.map(([month, subjects]) => (
                            <div key={month} className="border rounded-lg overflow-hidden">
                                <button onClick={() => toggleMonth(month)} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <h4 className="font-bold text-lg text-gray-800">{month}</h4>
                                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${openMonths[month] ?? true ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {(openMonths[month] ?? true) && Object.keys(subjects).map((subject) => {
                                    const videos = subjects[subject];
                                    return (
                                        <div key={subject} className="p-4 border-t bg-white">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="h-4 w-1 bg-brand-primary rounded-full"></div>
                                                <h5 className="font-bold text-sm text-gray-500 uppercase tracking-widest">{subject}</h5>
                                            </div>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {videos.map(video => (
                                                   <div key={video.id} className="border rounded-lg shadow-sm flex flex-col hover:shadow-md transition-all group">
                                                        <button onClick={() => setPlayingVideo(video)} className="block aspect-video bg-gray-800 text-white flex items-center justify-center rounded-t-lg group-hover:bg-gray-700 transition-colors relative">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        </button>
                                                        <div className="p-4 flex-grow flex flex-col">
                                                            <h6 className="font-bold text-gray-800 leading-tight">{video.title}</h6>
                                                            <p className="text-xs text-gray-600 mt-2 flex-grow line-clamp-3 leading-relaxed">{video.description}</p>
                                                            <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Added by {memberMap.get(video.uploadedBy) || 'Unknown'}</span>
                                                                {isAdmin && (
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => openEditModal(video)} className="text-[10px] text-blue-600 hover:underline font-black uppercase">Edit</button>
                                                                        <button onClick={() => handleDeleteVideo(video)} className="text-[10px] text-red-600 hover:underline font-black uppercase">Delete</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                   </div> 
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                             <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                             <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Library Empty</p>
                             <p className="text-sm text-gray-400 mt-1">Start building your team's knowledge base by adding tutorials.</p>
                        </div>
                    )}
                </div>
            </div>

            <AddEditTrainingVideoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveVideo}
                videoToEdit={editingVideo}
                existingSubjects={Array.from(new Set((team.trainingVideos || []).map(v => v.subject).filter(Boolean) as string[]))}
            />
            {playingVideo && (
                <VideoPlayerModal 
                    isOpen={!!playingVideo}
                    onClose={() => setPlayingVideo(null)}
                    title={playingVideo.title}
                    videoUrl={playingVideo.videoUrl}
                />
            )}
        </div>
    );
};
