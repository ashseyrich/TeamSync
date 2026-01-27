
import React, { useState } from 'react';
// FIX: Imported CorporateTaskStatus to support type casting below.
import type { ServiceEvent, DebriefAnalysisSummary, CorporateTaskStatus } from '../types.ts';
import { analyzeDebriefs } from '../services/geminiService.ts';

interface DebriefAnalysisProps {
  serviceEvents: ServiceEvent[];
}

const ResultCard: React.FC<{ title: string; items: string[]; icon: React.ReactNode; color: string }> = ({ title, items, icon, color }) => (
    <div className={`p-4 rounded-lg border bg-opacity-25 ${color}`}>
        <h4 className="font-bold flex items-center gap-2 text-[13px] uppercase tracking-tight">
            {icon}
            {title}
        </h4>
        <ul className="list-disc list-inside space-y-1.5 text-sm mt-3 font-medium">
            {items.map((item, index) => <li key={index} className="leading-relaxed">{item}</li>)}
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
            // Aggregate Preparedness Data for context
            const preparednessSnapshot = serviceEvents
                .filter(e => (e.debriefs?.length || 0) > 0 || Object.keys(e.corporateChecklistStatus || {}).length > 0)
                .map(event => {
                    // FIX: Explicitly cast Object.values to CorporateTaskStatus[] to resolve 'Property completed does not exist on type unknown' error.
                    const corpTasks = Object.values(event.corporateChecklistStatus || {}) as CorporateTaskStatus[];
                    const corpDone = corpTasks.filter(t => t.completed).length;
                    const corpPercent = corpTasks.length > 0 ? (corpDone / corpTasks.length) * 100 : 100;

                    const roleSnapshot = event.assignments.map(a => {
                        const tasks = Object.values(a.checklistProgress || {});
                        const done = tasks.filter(Boolean).length;
                        return {
                            roleId: a.roleId,
                            completion: tasks.length > 0 ? (done / tasks.length) * 100 : 100
                        };
                    });

                    return {
                        eventName: event.name,
                        date: event.date.toLocaleDateString(),
                        corporatePreparedness: `${corpPercent.toFixed(0)}%`,
                        rolePreparedness: roleSnapshot
                    };
                });

            const result = await analyzeDebriefs(allDebriefs, preparednessSnapshot);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-brand-primary">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-gray-800">Team Health & Preparedness Audit</h3>
                    <div className="flex items-center gap-2 mt-1">
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">✨ AI Analysis</span>
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200">Factoring Ready Checks</span>
                    </div>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || allDebriefs.length === 0}
                    className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:bg-brand-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all transform active:scale-95"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Correlating Logs...
                        </>
                    ) : (
                        `Run Comprehensive Audit (${allDebriefs.length})`
                    )}
                </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">Our AI cross-references volunteer feedback with digital 'Ready Check' logs to find technical bottlenecks and accountability gaps.</p>
            
            {allDebriefs.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 font-bold italic">No debriefs have been submitted yet. Data is required for analysis.</p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
                    <p className="text-sm font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        {error}
                    </p>
                </div>
            )}

            {analysis && (
                <div className="mt-6 border-t pt-6 space-y-6 animate-fade-in-up">
                     <div className="p-5 rounded-xl bg-gray-50 border-2 border-gray-100 shadow-inner">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Executive Summary</h4>
                        <p className="text-sm text-gray-800 leading-relaxed font-medium">{analysis.overallSummary}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ResultCard title="Operational Strengths" items={analysis.strengths} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>} color="border-green-200 bg-green-50 text-green-800" />
                        <ResultCard title="Friction Points" items={analysis.areasForImprovement} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>} color="border-yellow-200 bg-yellow-50 text-yellow-800" />
                        <ResultCard title="Growth & Strategy" items={analysis.growthOpportunities} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>} color="border-blue-200 bg-blue-50 text-blue-800" />
                    </div>
                </div>
            )}

        </div>
    );
};
