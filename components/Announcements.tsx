
import React, { useMemo, useState, useEffect } from 'react';
import type { Announcement, Scripture, TeamMember, TeamType } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';
import { ReadReceiptsModal } from './ReadReceiptsModal.tsx';
import { generateVerseOfTheDay } from '../services/geminiService.ts';

interface AnnouncementsProps {
  announcements: Announcement[];
  scriptures: Scripture[]; // Keep for backward compatibility or custom list
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onRemoveAnnouncement: (announcementId: string) => void;
  onMarkAsRead: (announcementIds: string[]) => void;
  teamType: TeamType;
  teamDescription?: string;
}

export const Announcements: React.FC<AnnouncementsProps> = ({ announcements, scriptures, currentUser, teamMembers, onRemoveAnnouncement, onMarkAsRead, teamType, teamDescription }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [verseOfTheDay, setVerseOfTheDay] = useState<Scripture | null>(null);
  const [isVerseLoading, setIsVerseLoading] = useState(true);

  // Fetch Verse of the Day with caching
  useEffect(() => {
    const fetchVerse = async () => {
        const today = new Date().toISOString().split('T')[0];
        // Cache key includes team type to ensure relevance if user switches contexts (though typically user stays in one team)
        const cacheKey = `verse_of_the_day_${teamType}_${today}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            setVerseOfTheDay(JSON.parse(cachedData));
            setIsVerseLoading(false);
            return;
        }

        // Fallback to existing static list if available and API fails or while loading? 
        // No, let's prefer the AI generated one for context.
        
        try {
            setIsVerseLoading(true);
            const verse = await generateVerseOfTheDay(teamType, teamDescription);
            setVerseOfTheDay(verse);
            localStorage.setItem(cacheKey, JSON.stringify(verse));
        } catch (error) {
            console.error("Failed to fetch verse of the day:", error);
            // Fallback logic if API fails: pick random from static list
            if (scriptures.length > 0) {
                 const dayOfYear = Math.floor((new Date().valueOf() - new Date(new Date().getFullYear(), 0, 0).valueOf()) / 86400000);
                 setVerseOfTheDay(scriptures[dayOfYear % scriptures.length]);
            }
        } finally {
            setIsVerseLoading(false);
        }
    };

    fetchVerse();
  }, [teamType, teamDescription, scriptures]); // Dependency on teamType ensures refresh on switch
  
  useEffect(() => {
    const unreadAnnouncements = announcements.filter(ann => !(ann.readBy || []).includes(currentUser.id));
    if (unreadAnnouncements.length > 0) {
        const timer = setTimeout(() => {
            onMarkAsRead(unreadAnnouncements.map(ann => ann.id));
        }, 2000); // Mark as read after 2 seconds of being visible
        return () => clearTimeout(timer);
    }
  }, [announcements, currentUser.id, onMarkAsRead]);


  const sortedAnnouncements = [...announcements].sort((a, b) => b.date.getTime() - a.date.getTime());
  const isAdmin = hasPermission(currentUser, 'admin');

  const handleRemove = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to cancel the announcement: "${title}"?`)) {
        onRemoveAnnouncement(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18.668 1 19.382 1h.063c.636 0 1.09.588 1.09 1.214V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15m-3.566-2.091A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18.668 1 19.382 1h.063c.636 0 1.09.588 1.09 1.214V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15" />
                </svg>
                Team Announcements
            </h3>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {sortedAnnouncements.length > 0 ? sortedAnnouncements.map(ann => {
                    const readCount = ann.readBy?.length || 0;
                    const totalMembers = teamMembers.length;
                    return (
                        <div key={ann.id} className="bg-brand-light border-l-4 border-brand-primary p-3 rounded-r-md">
                           <div className="flex justify-between items-start gap-2">
                                <div className="flex-grow">
                                    <h4 className="font-bold text-gray-800">{ann.title}</h4>
                                    <p className="text-sm text-gray-700">{ann.content}</p>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleRemove(ann.id, ann.title)}
                                        className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                                        title="Cancel Announcement"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                             {isAdmin && (
                                <button onClick={() => setSelectedAnnouncement(ann)} className="text-xs text-gray-500 hover:underline mt-2">
                                    Read by {readCount} / {totalMembers}
                                </button>
                            )}
                        </div>
                    );
                }) : (
                    <p className="text-sm text-gray-500 italic">No announcements.</p>
                )}
            </div>
        </div>
        <div className="md:col-span-1 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Verse of the Day
            </h3>
            {isVerseLoading ? (
                 <div className="bg-green-50 p-3 rounded-md animate-pulse">
                    <div className="h-4 bg-green-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-green-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-green-200 rounded w-1/4 ml-auto"></div>
                 </div>
            ) : verseOfTheDay ? (
                <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700 italic">"{verseOfTheDay.text}"</p>
                    <p className="text-right text-sm font-semibold text-gray-800 mt-2">- {verseOfTheDay.reference}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Verse unavailable.</p>
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
