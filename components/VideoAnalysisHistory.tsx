import React from 'react';
import type { VideoAnalysis, TeamMember } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface VideoAnalysisHistoryProps {
    history: VideoAnalysis[];
    teamMembers: TeamMember[];
    onSelectUrl: (url: string) => void;
}

export const VideoAnalysisHistory: React.FC<VideoAnalysisHistoryProps> = ({ history, teamMembers, onSelectUrl }) => {
    
    const getMemberName = (memberId: string) => teamMembers.find(m => m.id === memberId)?.name || 'Unknown';

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">Analysis History</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">A shared log of all previously analyzed videos.</p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {history.length > 0 ? (
                    history.map((analysis) => (
                        <div key={analysis.id} className="p-3 bg-gray-50 rounded-md">
                            <div className="flex justify-between items-center gap-2">
                                <p className="text-sm text-gray-800 truncate flex-grow" title={analysis.videoUrl}>{analysis.videoUrl}</p>
                                <button 
                                    onClick={() => onSelectUrl(analysis.videoUrl)}
                                    className="text-xs text-brand-primary hover:underline font-semibold flex-shrink-0"
                                >
                                    Re-analyze
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Analyzed by {getMemberName(analysis.requestedBy)} on {new Date(analysis.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 rounded-lg bg-gray-100 text-center">
                        <p className="text-sm font-semibold text-gray-700">No history yet</p>
                        <p className="text-xs text-gray-500 mt-1">Your first analysis will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};