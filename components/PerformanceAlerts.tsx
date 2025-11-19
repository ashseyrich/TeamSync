import React, { useState, useEffect } from 'react';
import type { PerformanceAlert } from '../types.ts';
import { generatePerformanceFeedback } from '../services/geminiService.ts';

interface PerformanceAlertsProps {
  alerts: PerformanceAlert[];
}

const AlertItem: React.FC<{ alert: PerformanceAlert }> = ({ alert }) => {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            setIsLoading(true);
            try {
                const feedback = await generatePerformanceFeedback(alert.type);
                setSuggestion(feedback);
            } catch (error) {
                console.error("Failed to fetch performance feedback:", error);
                setSuggestion("Could not load suggestion. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeedback();
    }, [alert.type]);

    const icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    );

    return (
        <div>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">{icon}</div>
                <div>
                    <h4 className="font-semibold">A friendly heads-up...</h4>
                    <p className="text-sm">{alert.message}</p>
                </div>
            </div>
             <div className="mt-2 pl-9">
                <h5 className="font-semibold text-xs uppercase text-gray-500">AI-Powered Tip</h5>
                {isLoading ? (
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mt-1"></div>
                ) : (
                    <p className="text-sm text-gray-600 italic whitespace-pre-wrap">"{suggestion}"</p>
                )}
            </div>
        </div>
    );
};

export const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md shadow-sm space-y-4 text-yellow-800">
            <h3 className="text-lg font-bold">For Your Attention (Private)</h3>
            {alerts.map((alert, index) => (
                <AlertItem key={index} alert={alert} />
            ))}
        </div>
    );
};