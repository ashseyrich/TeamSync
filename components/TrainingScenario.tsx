
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateTrainingScenario } from '../services/geminiService.ts';
import type { TrainingScenarioItem, TeamType } from '../types.ts';

interface TrainingScenarioProps {
    skill: string;
    teamType: TeamType;
    teamDescription?: string;
}

export const TrainingScenario: React.FC<TrainingScenarioProps> = ({ skill, teamType, teamDescription }) => {
    const [scenario, setScenario] = useState<TrainingScenarioItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const fetchScenario = useCallback(async () => {
        setScenario(null);
        setIsLoading(true);
        setError(null);
        setSelectedOption(null);
        
        try {
            const result = await generateTrainingScenario(skill, teamType, teamDescription);
            setScenario(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [skill, teamType, teamDescription]);

    useEffect(() => {
        fetchScenario();
    }, [fetchScenario]);

    // Find the correct answer for display in case of wrong choice
    const correctOption = useMemo(() => {
        if (!scenario) return null;
        return scenario.options.find(opt => opt.isCorrect);
    }, [scenario]);

    if (isLoading) {
        return (
            <div className="text-center py-10">
                <div className="mx-auto h-8 w-8 text-brand-primary animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <p className="mt-2 text-sm text-gray-600">Generating training scenario for {skill}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-center">
                <p><span className="font-bold">Error:</span> {error}</p>
                <button 
                    onClick={fetchScenario} 
                    className="mt-2 text-sm text-red-700 underline hover:text-red-900"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!scenario) return null;

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
                <button 
                    onClick={fetchScenario}
                    className="text-xs flex items-center gap-1 text-brand-primary hover:text-brand-dark font-semibold"
                    title="Get a different scenario for this skill"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Scenario
                </button>
            </div>

            <div>
                <h4 className="font-semibold text-gray-500 text-sm uppercase">Situation</h4>
                <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-lg border whitespace-pre-wrap">{scenario.scenario}</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-500 text-sm uppercase">Your Task</h4>
                <p className="mt-1 font-bold text-gray-800">{scenario.question}</p>
            </div>
            <div className="space-y-2 pt-2">
                {scenario.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = option.isCorrect;
                    const feedbackColor = isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50';
                    
                    return (
                        <div key={index}>
                            <button
                                onClick={() => setSelectedOption(index)}
                                disabled={selectedOption !== null}
                                className={`w-full text-left p-3 border-2 rounded-lg transition-colors ${
                                    isSelected
                                        ? `${feedbackColor} rounded-b-none border-b-0 text-gray-900 font-semibold`
                                        : 'border-gray-300 hover:border-brand-primary hover:bg-brand-light text-gray-800'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{option.text}</span>
                                    {isSelected && (
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${isCorrect ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                            {isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    )}
                                </div>
                            </button>
                            {isSelected && (
                                <div className={`p-4 border-x-2 border-b-2 rounded-b-lg animate-fade-in ${feedbackColor}`}>
                                    <div className="flex gap-3">
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                                            {isCorrect ? '✓' : '×'}
                                        </div>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                            {option.feedback}
                                        </p>
                                    </div>

                                    {/* Reveal Correct Answer if User was Wrong */}
                                    {!isCorrect && correctOption && (
                                        <div className="mt-4 pt-4 border-t border-red-200">
                                            <h5 className="text-[11px] font-black uppercase text-green-700 tracking-widest mb-2 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                                The Correct Approach:
                                            </h5>
                                            <div className="bg-white/60 p-3 rounded-lg border border-green-300">
                                                <p className="text-sm font-bold text-gray-900 mb-1">{correctOption.text}</p>
                                                <p className="text-xs text-gray-700 italic leading-relaxed">{correctOption.feedback}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex justify-end">
                                        <button 
                                            onClick={fetchScenario}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isCorrect ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                        >
                                            {isCorrect ? 'Next Challenge' : 'Try Again'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
