import React from 'react';
import { db } from '../lib/firebase.ts';

export const ConnectionStatus: React.FC = () => {
    const isFirebaseEnabled = db !== null;
    const hasApiKey = !!process.env.API_KEY && process.env.API_KEY !== '';

    return (
        <div className="fixed bottom-2 left-2 z-[100] flex gap-2">
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border ${
                isFirebaseEnabled 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
                DB: {isFirebaseEnabled ? 'Firebase Live' : 'Local Safe Mode'}
            </div>
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border ${
                hasApiKey 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-red-100 text-red-700 border-red-200'
            }`}>
                AI: {hasApiKey ? 'API Key Found' : 'API Key Missing'}
            </div>
        </div>
    );
};