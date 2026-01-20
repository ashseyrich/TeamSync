import React, { useState } from 'react';
import { db } from '../lib/firebase.ts';

export const ConnectionStatus: React.FC = () => {
    const hasApiKey = !!process.env.API_KEY && process.env.API_KEY !== '' && process.env.API_KEY !== 'undefined';
    const isCloudMode = !!db;
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="fixed bottom-20 left-4 md:bottom-4 md:left-6 z-[45] flex flex-col gap-1.5 pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-start gap-1.5">
                {isCloudMode ? (
                    <div className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm border bg-green-50/80 text-green-700 border-green-200 flex items-center gap-1.5 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="hidden sm:inline">Cloud Sync Active</span>
                        <span className="sm:hidden">Cloud Sync</span>
                    </div>
                ) : (
                    <div className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm border bg-gray-50/80 text-gray-500 border-gray-200 flex items-center gap-1.5 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Offline Demo
                    </div>
                )}
                
                {!hasApiKey && (
                    <div 
                        className="relative group px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm border cursor-pointer bg-red-50/80 text-red-700 border-red-200 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setShowInfo(!showInfo)}
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            AI Config Needed
                        </span>
                        
                        {(showInfo || false) && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] font-normal normal-case rounded-lg shadow-xl z-[110] animate-fade-in-up">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-red-400">Gemini API Key Missing</p>
                                    <button onClick={(e) => { e.stopPropagation(); setShowInfo(false); }} className="text-gray-400 hover:text-white">&times;</button>
                                </div>
                                <p className="mb-2">To enable AI features on Netlify:</p>
                                <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                    <li>Go to Netlify Dashboard</li>
                                    <li>Site Settings &gt; Env Variables</li>
                                    <li>Add <code className="bg-gray-700 px-1 rounded text-[10px]">API_KEY</code></li>
                                </ol>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
                            </div>
                        )}
                        
                        {/* Desktop hover fallback */}
                        <div className="hidden md:group-hover:block absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] font-normal normal-case rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                            <p className="font-bold text-red-400 mb-1">Gemini API Key Missing</p>
                            <p className="mb-2">To enable AI features on Netlify:</p>
                            <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                <li>Go to Netlify Dashboard</li>
                                <li>Site Settings &gt; Env Variables</li>
                                <li>Add <code className="bg-gray-700 px-1 rounded text-[10px]">API_KEY</code></li>
                            </ol>
                            <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
