import React, { useState } from 'react';
import type { ServiceEvent, DebriefAnalysisSummary } from '../types.ts';
import { analyzeDebriefs } from '../services/geminiService.ts';

interface DebriefAnalysisProps {
  serviceEvents: ServiceEvent[];
}

const ResultCard: React.FC<{ title: string; items: string[]; icon: React.ReactNode; color: string }> = ({ title, items, icon, color }) => (
    <div className={`p-4 rounded-lg border bg-opacity-25 ${color}`}>
        <h4 className="font-bold flex items-center gap-2">
            {icon}
            {title}
        </h4>
        <ul className="list-disc list-inside space-y-1 text-sm mt-2">
            {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
    </div>
);

export const DebriefAnalysis: React.FC<DebriefAnalysisProps> = ({ serviceEvents }) => {
    const [analysis, setAnalysis] = useState<DebriefAnalysisSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allDebriefs = serviceEvents.flatMap(e => e.debriefs || []);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await analyzeDebriefs(allDebriefs);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">AI Debrief Analysis</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">Analyze all submitted service debriefs to identify team-wide trends, strengths, and opportunities for growth.</p>
            
            <button
                onClick={handleAnalyze}
                disabled={isLoading || allDebriefs.length === 0}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing {allDebriefs.length} Debriefs...
                    </>
                ) : (
                    `Analyze ${allDebriefs.length} Debriefs`
                )}
            </button>
            {allDebriefs.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No debriefs have been submitted yet.</p>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                    <p><span className="font-bold">Error:</span> {error}</p>
                </div>
            )}

            {analysis && (
                <div className="mt-6 border-t pt-4 space-y-4">
                     <div className="p-4 rounded-lg bg-gray-50 border">
                        <h4 className="font-bold text-gray-800">Overall Summary</h4>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{analysis.overallSummary}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ResultCard title="Recurring Strengths" items={analysis.strengths} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>} color="border-green-300 bg-green-100 text-green-800" />
                        <ResultCard title="Improvement Areas" items={analysis.areasForImprovement} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>} color="border-yellow-300 bg-yellow-100 text-yellow-800" />
                        <ResultCard title="Growth Opportunities" items={analysis.growthOpportunities} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>} color="border-blue-300 bg-blue-100 text-blue-800" />
                    </div>
                </div>
            )}

        </div>
    );
};