
import React from 'react';
import { db } from '../lib/firebase.ts';

export const ConnectionStatus: React.FC = () => {
    const hasApiKey = !!process.env.API_KEY && process.env.API_KEY !== '' && process.env.API_KEY !== 'undefined';
    const isCloudMode = !!db;

    return (
        <div className="fixed bottom-2 left-2 z-[100] flex flex-col gap-2">
            {isCloudMode ? (
                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Cloud Sync Active
                </div>
            ) : (
                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border bg-gray-100 text-gray-600 border-gray-200">
                    Offline Demo Mode
                </div>
            )}
            
            {!hasApiKey && (
                <div 
                    className="relative group px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border cursor-help bg-red-100 text-red-700 border-red-200"
                >
                    AI Config Needed
                    
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 text-white text-[11px] font-normal normal-case rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                        <p className="font-bold text-red-400 mb-1">Gemini API Key Missing</p>
                        <p className="mb-2">To enable AI features on Netlify:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-300">
                            <li>Go to Netlify Dashboard</li>
                            <li>Site Settings > Environment Variables</li>
                            <li>Add <code className="bg-gray-700 px-1 rounded">API_KEY</code></li>
                        </ol>
                        <div className="absolute top-full left-4 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            )}
        </div>
    );
};
