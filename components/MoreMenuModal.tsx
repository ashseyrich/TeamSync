
import React from 'react';
import type { View, TeamFeatures } from '../types.ts';

interface MoreMenuModalProps {
    onClose: () => void;
    setCurrentView: (view: View) => void;
    activeView: View;
    features?: TeamFeatures;
}

interface MenuItemProps {
    view: View;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ view, label, icon, isActive, onClick }) => {
    const activeClass = isActive ? 'bg-brand-light text-brand-primary' : 'text-gray-700';
    return (
        <button
            onClick={onClick}
            className={`w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg ${activeClass} hover:bg-gray-100`}
        >
            <div className="flex-shrink-0 w-6 h-6">{icon}</div>
            <span className="font-semibold">{label}</span>
        </button>
    )
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({ onClose, setCurrentView, activeView, features }) => {
    
    const handleSelectView = (view: View) => {
        setCurrentView(view);
        onClose();
    }

    const showVideoAnalysis = features ? features.videoAnalysis : true;
    const showTraining = features ? features.training : true;
    const showChildCheckIn = features ? features.childCheckIn : false;
    const showInventory = features ? features.inventory : false;
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={onClose}></div>
            <div className="fixed bottom-16 left-0 right-0 p-4 z-50 md:hidden">
                <div className="bg-white rounded-xl shadow-lg p-2 space-y-1">
                     {showChildCheckIn && (
                         <MenuItem
                            view="children"
                            label="Kids Check-in"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            isActive={activeView === 'children'}
                            onClick={() => handleSelectView('children')}
                         />
                     )}
                     {showInventory && (
                        <MenuItem
                            view="inventory"
                            label="Inventory"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                            isActive={activeView === 'inventory'}
                            onClick={() => handleSelectView('inventory')}
                        />
                     )}
                     <MenuItem
                        view="reports"
                        label="Reports"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                        isActive={activeView === 'reports'}
                        onClick={() => handleSelectView('reports')}
                     />
                     {showVideoAnalysis && (
                         <MenuItem
                            view="review"
                            label="AI Review"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                            isActive={activeView === 'review'}
                            onClick={() => handleSelectView('review')}
                         />
                     )}
                     {showTraining && (
                         <MenuItem
                            view="training"
                            label="Training"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            isActive={activeView === 'training'}
                            onClick={() => handleSelectView('training')}
                         />
                     )}
                     <MenuItem
                        view="encouragement"
                        label="Encouragement"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        isActive={activeView === 'encouragement'}
                        onClick={() => handleSelectView('encouragement')}
                     />
                     <MenuItem
                        view="faq"
                        label="FAQ"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        isActive={activeView === 'faq'}
                        onClick={() => handleSelectView('faq')}
                     />
                </div>
            </div>
        </>
    )
}
