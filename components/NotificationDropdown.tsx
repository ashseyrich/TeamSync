
import React, { useState, useMemo } from 'react';
import type { Announcement, TeamMember, ServiceEvent, Assignment } from '../types.ts';

interface NotificationDropdownProps {
    announcements: Announcement[];
    serviceEvents: ServiceEvent[];
    currentUser: TeamMember;
    onMarkAsRead: (ids: string[]) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ announcements, serviceEvents, currentUser, onMarkAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);

    // 1. Filter unread announcements (News, AI Reviews, etc.)
    const unreadAnnouncements = useMemo(() => {
        return announcements.filter(ann => !(ann.readBy || []).some(r => r.userId === currentUser.id))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [announcements, currentUser.id]);

    // 2. Scan for assignments that need confirmation (Accept/Decline)
    const pendingAssignments = useMemo(() => {
        const now = new Date().getTime();
        return serviceEvents
            .filter(event => event.date.getTime() >= now) 
            .flatMap(event => 
                event.assignments
                    .filter(a => (a.memberId === currentUser.id || a.traineeId === currentUser.id) && (a.status === 'pending' || !a.status))
                    .map(a => ({ event, assignment: a }))
            );
    }, [serviceEvents, currentUser.id]);

    const totalCount = unreadAnnouncements.length + pendingAssignments.length;

    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (unreadAnnouncements.length > 0) {
            onMarkAsRead(unreadAnnouncements.map(a => a.id));
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`p-2 rounded-full transition-all relative ${isOpen ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-500 hover:bg-gray-100'}`}
                title="View Team Notifications"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {totalCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse-soft">
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-20 overflow-hidden animate-fade-in-up border border-gray-100">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Team Alerts</h3>
                            {unreadAnnouncements.length > 0 && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] font-black text-brand-primary hover:text-brand-primary-dark uppercase tracking-tighter"
                                >
                                    Dismiss Feed
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-[28rem] overflow-y-auto">
                            {/* ACTION REQUIRED: ASSIGNMENTS */}
                            {pendingAssignments.length > 0 && (
                                <div className="bg-orange-50/50 border-b border-orange-100">
                                    <p className="px-4 py-2 text-[9px] font-black text-orange-700 uppercase tracking-[0.1em] border-b border-orange-100/50">Confirms Required</p>
                                    <div className="divide-y divide-orange-100">
                                        {pendingAssignments.map((pa, idx) => (
                                            <div key={`pa-${idx}`} className="px-4 py-4 hover:bg-orange-100/50 transition-colors">
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-200">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-gray-900 leading-tight">Schedule Action</p>
                                                        <p className="text-[11px] text-gray-600 mt-1">
                                                            New role for <span className="font-bold text-gray-800">{pa.event.name}</span>. Confirm on Dashboard.
                                                        </p>
                                                        <p className="text-[9px] text-orange-500 mt-2 font-bold uppercase tracking-wider">
                                                            📅 {pa.event.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* UPDATES: ANNOUNCEMENTS & REVIEWS */}
                            {unreadAnnouncements.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {unreadAnnouncements.map(ann => {
                                        const isAIReview = ann.title.toLowerCase().includes('review') || ann.title.includes('🎥');
                                        return (
                                            <div 
                                                key={ann.id} 
                                                className={`px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer group ${isAIReview ? 'bg-purple-50/20' : ''}`}
                                                onClick={() => onMarkAsRead([ann.id])}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${isAIReview ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                                                        {isAIReview ? (
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-grow">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-black text-gray-900 group-hover:text-brand-primary transition-colors truncate pr-2 uppercase italic tracking-tight">
                                                                {ann.title}
                                                            </p>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase whitespace-nowrap">
                                                                {new Date(ann.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                                                            {ann.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : pendingAssignments.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-black text-gray-800 uppercase tracking-tight">Mission Clear</p>
                                    <p className="text-xs text-gray-400 mt-1">No pending alerts.</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
