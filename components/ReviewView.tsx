
import React, { useState } from 'react';
import type { VideoAnalysisResult, Team, TeamMember, VideoAnalysis, VideoAnalysisTrends } from '../types.ts';
import { analyzeVideo, analyzeVideoHistory } from '../services/geminiService.ts';
import { VideoTrendAnalysis } from './VideoTrendAnalysis.tsx';
import { VideoAnalysisHistory } from './VideoAnalysisHistory.tsx';
import { hasPermission } from '../utils/permissions.ts';

interface ReviewViewProps {
    team: Team;
    onAddAnalysis: (analysis: VideoAnalysis) => void;
    currentUser: TeamMember;
}

const ResultDisplay: React.FC<{ result: VideoAnalysisResult }> = ({ result }) => (
    <div className="mt-6 border-t pt-6 space-y-6 animate-fade-in">
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Overall Summary</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border whitespace-pre-wrap">{result.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <h4 className="font-bold flex items-center gap-2 text-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Best Shot
                </h4>
                <p className="text-sm mt-2 text-blue-900 whitespace-pre-wrap">{result.bestShot}</p>
            </div>
            <div className="p-4 rounded-lg border bg-orange-50 border-orange-200">
                <h4 className="font-bold flex items-center gap-2 text-orange-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Shot for Improvement
                </h4>
                <p className="text-sm mt-2 text-orange-900 whitespace-pre-wrap">{result.shotForImprovement}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                <h4 className="font-bold flex items-center gap-2 text-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Positive Feedback
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2 text-green-900">
                    {result.positiveFeedback.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
             <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                <h4 className="font-bold flex items-center gap-2 text-yellow-800">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Areas for Improvement
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2 text-yellow-900">
                    {result.areasForImprovement.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
        </div>

        {result.howToFix && result.howToFix.length > 0 && (
            <div className="p-4 rounded-lg border bg-indigo-50 border-indigo-200">
                <h4 className="font-bold flex items-center gap-2 text-indigo-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8.13 4.66c-1.31.25-2.5.87-3.48 1.76l-1.32-.9c-1.33-1.12-3.14.7-2.03 2.03l.9 1.32c-.89.98-1.51 2.17-1.76 3.48l-1.49.38c-1.56.38-1.56 2.6 0 2.98l1.49.38c.25 1.31.87 2.5 1.76 3.48l-.9 1.32c-1.12 1.33.7 3.14 2.03 2.03l1.32-.9c.98.89 2.17 1.51 3.48 1.76l.38 1.49c.38 1.56 2.6 1.56 2.98 0l.38-1.49c1.31-.25 2.5-.87 3.48-1.76l1.32.9c1.33 1.12 3.14-.7 2.03-2.03l-.9-1.32c.89-.98 1.51-2.17 1.76-3.48l1.49-.38c1.56-.38 1.56-2.6 0-2.98l-1.49-.38c-.25-1.31-.87-2.5-1.76-3.48l.9-1.32c1.12-1.33-.7-3.14-2.03-2.03l-1.32.9c-.98-.89-2.17-1.51-3.48-1.76l-.38-1.49zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    AI Actionable Fixes
                </h4>
                <div className="mt-3 space-y-3">
                    {result.howToFix.map((item, index) => (
                        <div key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-black flex items-center justify-center mt-0.5">{index + 1}</span>
                            <p className="text-sm text-indigo-900 font-medium leading-relaxed">{item}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);


export const ReviewView: React.FC<ReviewViewProps> = ({ team, onAddAnalysis, currentUser }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
    const canAnalyzeTrends = hasPermission(currentUser, 'scheduler');

    const isValidYouTubeUrl = (url: string) => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return pattern.test(url);
    };

    const handleAnalyze = async () => {
        if (!isValidYouTubeUrl(videoUrl)) {
            setError("Please enter a valid YouTube URL.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await analyzeVideo(videoUrl);
            setAnalysisResult(result);
            
            const newAnalysis: VideoAnalysis = {
                id: `va_${Date.now()}`,
                videoUrl,
                result,
                requestedBy: currentUser.id,
                timestamp: new Date(),
            };
            onAddAnalysis(newAnalysis);
            setVideoUrl(''); // Clear input on success

        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-0 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-start mb-1">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">AI Service Review</h2>
                        <p className="mt-1 text-md text-gray-600">Get instant, constructive feedback on your services. Paste a YouTube link to a past livestream and our AI will provide a helpful critique based on broadcast best practices.</p>
                    </div>
                </div>

                <div id="guide-ai-review-form" className="mt-4 flex flex-col sm:flex-row gap-2">
                    <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !videoUrl}
                        className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Analyzing...
                            </>
                        ) : (
                            'Analyze Video'
                        )}
                    </button>
                </div>
                 {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                        <p><span className="font-bold">Error:</span> {error}</p>
                    </div>
                )}
                {analysisResult && <ResultDisplay result={analysisResult} />}
            </div>

            <div className={`grid grid-cols-1 ${canAnalyzeTrends ? 'lg:grid-cols-2' : ''} gap-8`}>
                <div id="guide-analysis-history">
                    <VideoAnalysisHistory 
                        history={team.videoAnalyses || []} 
                        teamMembers={team.members}
                        onSelectUrl={setVideoUrl} 
                    />
                </div>
                {canAnalyzeTrends && (
                    <div id="guide-improvement-trends">
                        <VideoTrendAnalysis 
                            history={team.videoAnalyses || []} 
                            currentUser={currentUser} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
