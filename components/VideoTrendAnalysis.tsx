import React, { useState } from 'react';
import { analyzeVideoHistory } from '../services/geminiService.ts';
import type { VideoAnalysis, VideoAnalysisTrends, TeamMember } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';

interface VideoTrendAnalysisProps {
    history: VideoAnalysis[];
    currentUser: TeamMember;
}

const TrendResultDisplay: React.FC<{ trends: VideoAnalysisTrends }> = ({ trends }) => (
     <div className="mt-4 border-t pt-4 space-y-4 animate-fade-in">
        <div className="p-4 rounded-lg bg-gray-50 border">
            <h4 className="font-bold text-gray-800">Overall Summary</h4>
            <p className="text-sm text-gray-700 mt-1">{trends.overallSummary}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                <h4 className="font-bold text-green-800">Recurring Strengths</h4>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2 text-green-900">
                    {trends.recurringStrengths.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
             <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                <h4 className="font-bold text-yellow-800">Recurring Improvement Areas</h4>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2 text-yellow-900">
                    {trends.recurringImprovementAreas.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
        </div>
    </div>
);


export const VideoTrendAnalysis: React.FC<VideoTrendAnalysisProps> = ({ history, currentUser }) => {
    const [trends, setTrends] = useState<VideoAnalysisTrends | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const canAnalyze = hasPermission(currentUser, 'scheduler');

    const handleAnalyzeTrends = async () => {
        setIsLoading(true);
        setError(null);
        setTrends(null);
        try {
            const result = await analyzeVideoHistory(history);
            setTrends(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">Improvement Trends</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">Track common feedback themes over time to see your team's growth. (Admin/Scheduler only)</p>
            
            {canAnalyze ? (
                <button
                    onClick={handleAnalyzeTrends}
                    disabled={isLoading || history.length < 2}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                     {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Analyzing Trends...
                        </>
                    ) : (
                        'Analyze Trends'
                    )}
                </button>
            ) : (
                <div className="p-2 rounded-lg bg-gray-100 text-center">
                    <p className="text-sm font-semibold text-gray-700">Admins & Schedulers can analyze trends.</p>
                </div>
            )}
             {history.length < 2 && canAnalyze && (
                <p className="text-xs text-gray-500 mt-1">At least 2 analyses are needed to spot trends.</p>
            )}

            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm"><p><span className="font-bold">Error:</span> {error}</p></div>}
            {trends && <TrendResultDisplay trends={trends} />}
        </div>
    );
};