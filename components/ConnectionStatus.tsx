import React from 'react';
import { db } from '../lib/firebase.ts';

export const ConnectionStatus: React.FC = () => {
    const isFirebaseEnabled = db !== null;
    const hasApiKey = !!process.env.API_KEY && process.env.API_KEY !== '' && process.env.API_KEY !== 'undefined';

    return (
        <div className="fixed bottom-2 left-2 z-[100] flex gap-2">
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border ${
                isFirebaseEnabled 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
                DB: {isFirebaseEnabled ? 'Firebase Live' : 'Local Safe Mode'}
            </div>
            <div 
                className={`relative group px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border cursor-help ${
                    hasApiKey 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-red-100 text-red-700 border-red-200'
                }`}
            >
                AI: {hasApiKey ? 'API Key Found' : 'API Key Missing'}
                
                {!hasApiKey && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 text-white text-[11px] font-normal normal-case rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                        <p className="font-bold text-red-400 mb-1">Configuration Required</p>
                        <p className="mb-2">To enable AI features on Netlify:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-300">
                            <li>Go to Netlify Dashboard</li>
                            <li>Site Settings > Environment Variables</li>
                            <li>Add <code className="bg-gray-700 px-1 rounded">API_KEY</code> with your Gemini Key</li>
                            <li>Re-trigger deployment</li>
                        </ol>
                        <div className="absolute top-full left-4 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-800"></div>
                    </div>
                )}
            </div>
        </div>
    );
};