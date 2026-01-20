
import React, { useState, useMemo } from 'react';
import type { Announcement, TeamMember } from '../types.ts';

interface NotificationDropdownProps {
    announcements: Announcement[];
    currentUser: TeamMember;
    onMarkAsRead: (ids: string[]) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ announcements, currentUser, onMarkAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);

    const unreadAnnouncements = useMemo(() => {
        return announcements.filter(ann => !(ann.readBy || []).some(r => r.userId === currentUser.id))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [announcements, currentUser.id]);

    const unreadCount = unreadAnnouncements.length;

    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (unreadCount > 0) {
            onMarkAsRead(unreadAnnouncements.map(a => a.id));
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`p-2 rounded-full transition-colors relative ${isOpen ? 'bg-gray-100 text-brand-primary' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                title="Notifications"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-20 overflow-hidden animate-fade-in-up">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Unread Updates</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-tighter"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {unreadCount > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {unreadAnnouncements.map(ann => (
                                        <div 
                                            key={ann.id} 
                                            className="px-4 py-3 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                            onClick={() => {
                                                onMarkAsRead([ann.id]);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors truncate">
                                                        {ann.title}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                                                    {new Date(ann.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed pl-3">
                                                {ann.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-10 text-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">All caught up!</p>
                                    <p className="text-xs text-gray-500 mt-1">No new announcements for you.</p>
                                </div>
                            )}
                        </div>
                        {unreadCount > 3 && (
                            <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Scroll for more</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
