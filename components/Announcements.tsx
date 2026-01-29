
import React, { useMemo, useState, useEffect } from 'react';
import type { Announcement, Scripture, TeamMember, TeamType, View } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';
import { ReadReceiptsModal } from './ReadReceiptsModal.tsx';
import { generateVerseOfTheDay } from '../services/geminiService.ts';

interface AnnouncementsProps {
  announcements: Announcement[];
  scriptures: Scripture[]; 
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onRemoveAnnouncement: (announcementId: string) => void;
  onMarkAsRead: (announcementIds: string[]) => void;
  teamType: TeamType;
  teamDescription?: string;
  onNavigate: (view: View) => void;
}

export const Announcements: React.FC<AnnouncementsProps> = ({ announcements, scriptures, currentUser, teamMembers, onRemoveAnnouncement, onMarkAsRead, teamType, teamDescription, onNavigate }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [verseOfTheDay, setVerseOfTheDay] = useState<Scripture | null>(null);
  const [isVerseLoading, setIsVerseLoading] = useState(true);

  useEffect(() => {
    const fetchVerse = async () => {
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `verse_of_the_day_${teamType}_${today}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            setVerseOfTheDay(JSON.parse(cachedData));
            setIsVerseLoading(false);
            return;
        }
        
        try {
            setIsVerseLoading(true);
            const verse = await generateVerseOfTheDay(teamType, teamDescription);
            setVerseOfTheDay(verse);
            localStorage.setItem(cacheKey, JSON.stringify(verse));
        } catch (error) {
            console.error("Failed to fetch verse of the day:", error);
            if (scriptures.length > 0) {
                 const dayOfYear = Math.floor((new Date().valueOf() - new Date(new Date().getFullYear(), 0, 0).valueOf()) / 86400000);
                 setVerseOfTheDay(scriptures[dayOfYear % scriptures.length]);
            }
        } finally {
            setIsVerseLoading(false);
        }
    };

    fetchVerse();
  }, [teamType, teamDescription, scriptures]); 

  const sortedAnnouncements = [...announcements].sort((a, b) => b.date.getTime() - a.date.getTime());
  const isAdmin = hasPermission(currentUser, 'admin');

  const handleRemove = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to cancel the announcement: "${title}"?`)) {
        onRemoveAnnouncement(id);
    }
  };

  const handleAcknowledge = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onMarkAsRead([id]);
  };

  const handleAnnouncementClick = (ann: Announcement) => {
      if (! (ann.readBy || []).some(r => r.userId === currentUser.id)) {
          onMarkAsRead([ann.id]);
      }
      if (ann.linkToView) {
          onNavigate(ann.linkToView);
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18.668 1 19.382 1h.063c.636 0 1.09.588 1.09 1.214V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15m-3.566-2.091A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18.668 1 19.382 1h.063c.636 0 1.09.588 1.09 1.214V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15" />
                    </svg>
                    Team Updates
                </h3>
                {isAdmin && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border">Admin Audit Active</span>}
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {sortedAnnouncements.length > 0 ? sortedAnnouncements.map(ann => {
                    const readCount = ann.readBy?.length || 0;
                    const totalMembers = teamMembers.length;
                    const isReadByMe = (ann.readBy || []).some(r => r.userId === currentUser.id);
                    const readPercentage = (readCount / totalMembers) * 100;
                    const isRecognition = ann.title.toLowerCase().includes('recognition') || ann.title.includes('🎉');
                    const hasLink = !!ann.linkToView;

                    return (
                        <div 
                            key={ann.id} 
                            onClick={() => handleAnnouncementClick(ann)}
                            className={`relative bg-white border rounded-lg shadow-sm transition-all group ${
                                isRecognition ? 'border-pink-200 shadow-pink-50' : 
                                isReadByMe ? 'border-gray-100 opacity-90' : 'border-blue-200 ring-1 ring-blue-50 cursor-pointer hover:bg-blue-50/30'
                            } ${hasLink ? 'cursor-pointer' : ''}`}
                        >
                           {!isReadByMe && (
                               <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-md animate-pulse z-10">NEW</span>
                           )}
                           <div className="p-4">
                               <div className="flex justify-between items-start gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-bold leading-tight ${isRecognition ? 'text-pink-700' : 'text-gray-900'}`}>{ann.title}</h4>
                                            <span className="text-[10px] text-gray-400 font-medium">{new Date(ann.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${isRecognition ? 'text-pink-600 italic font-medium' : 'text-gray-700'}`}>{ann.content}</p>
                                        
                                        {hasLink && (
                                            <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase inline-flex px-2 py-1 rounded-full border transition-all ${isRecognition ? 'text-pink-600 bg-pink-50 border-pink-100 group-hover:bg-pink-100' : 'text-brand-primary bg-brand-light border-brand-primary/10 group-hover:border-brand-primary/30'}`}>
                                                <span>{isRecognition ? 'View Shout-Outs' : 'View details'}</span>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5-5 5M6 7l5 5-5 5" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemove(ann.id, ann.title); }}
                                                className="p-1.5 text-gray-300 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                                                title="Delete for everyone"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                        {!isReadByMe && (
                                            <button
                                                onClick={(e) => handleAcknowledge(ann.id, e)}
                                                className="p-1.5 text-blue-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
                                                title="Mark as read"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-[10px] font-black uppercase hidden group-hover:inline">Read</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {isAdmin && (
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedAnnouncement(ann); }} 
                                            className="group flex items-center gap-2"
                                        >
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all ${readPercentage > 80 ? 'bg-green-500' : 'bg-brand-primary'}`} style={{width: `${readPercentage}%`}}></div>
                                            </div>
                                            <span className="text-[11px] font-black uppercase text-gray-500 group-hover:text-brand-primary transition-colors">
                                                Seen by {readCount}/{totalMembers} • View Log
                                            </span>
                                        </button>
                                    </div>
                                )}
                           </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 font-medium">No team updates yet.</p>
                    </div>
                )}
            </div>
        </div>
        <div className="md:col-span-1 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-gray-200">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Daily Scripture
            </h3>
            {isVerseLoading ? (
                 <div className="bg-gray-50 p-4 rounded-xl animate-pulse border border-gray-100">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/4 ml-auto"></div>
                 </div>
            ) : verseOfTheDay ? (
                <div className="bg-brand-light p-4 rounded-xl border border-brand-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L14.017 3H21.017V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H5.017C3.91243 8 3.017 7.10457 3.017 6V3L3.017 3H10.017V15C10.017 18.3137 7.33072 21 4.017 21H3.017Z" /></svg>
                    </div>
                    <p className="text-sm text-gray-800 font-medium italic relative z-10">"{verseOfTheDay.text}"</p>
                    <p className="text-right text-xs font-black uppercase text-brand-primary mt-3 relative z-10 tracking-widest">{verseOfTheDay.reference}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Scripture of the day is currently being curated.</p>
            )}
        </div>
      </div>
       {selectedAnnouncement && (
        <ReadReceiptsModal
            isOpen={!!selectedAnnouncement}
            onClose={() => setSelectedAnnouncement(null)}
            announcement={selectedAnnouncement}
            teamMembers={teamMembers}
        />
      )}
    </div>
  );
};
