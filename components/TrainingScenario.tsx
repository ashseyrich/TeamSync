
import React, { useState, useEffect, useCallback } from 'react';
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
        // Reset state completely to show loading spinner and hide old data
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
                    const feedbackColor = option.isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50';
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
                                {option.text}
                            </button>
                            {isSelected && (
                                <div className={`p-3 border-x-2 border-b-2 rounded-b-lg animate-fade-in ${feedbackColor}`}>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{option.feedback}</p>
                                    {!option.isCorrect && (
                                         <button 
                                            onClick={fetchScenario}
                                            className="mt-2 text-xs font-semibold text-red-700 hover:underline"
                                        >
                                            Try a new scenario
                                        </button>
                                    )}
                                    {option.isCorrect && (
                                         <button 
                                            onClick={fetchScenario}
                                            className="mt-2 text-xs font-semibold text-green-700 hover:underline"
                                        >
                                            Next Scenario &rarr;
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
