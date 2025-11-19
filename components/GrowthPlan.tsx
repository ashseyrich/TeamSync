import React from 'react';
import type { GrowthResource } from '../types.ts';

interface GrowthPlanProps {
    isLoading: boolean;
    error: string | null;
    resources: GrowthResource[] | null;
}

const iconMap: Record<GrowthResource['type'], React.ReactNode> = {
    'YouTube Video': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'Book': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    'Article': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    'Tip': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
};

const typeColors: Record<GrowthResource['type'], string> = {
    'YouTube Video': 'border-red-300 bg-red-50 text-red-800',
    'Book': 'border-blue-300 bg-blue-50 text-blue-800',
    'Article': 'border-gray-300 bg-gray-50 text-gray-800',
    'Tip': 'border-yellow-300 bg-yellow-50 text-yellow-800',
};

export const GrowthPlan: React.FC<GrowthPlanProps> = ({ isLoading, error, resources }) => {
    if (isLoading) {
        return (
            <div className="text-center py-10">
                <div className="mx-auto h-10 w-10 text-brand-primary animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <p className="mt-2 text-sm text-gray-600">Generating your personalized plan...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                <p><span className="font-bold">Error:</span> {error}</p>
            </div>
        );
    }

    if (!resources) {
        return null; // Don't show anything if there's no plan generated yet
    }
    
    if (resources.length === 0) {
        return <p className="mt-4 text-sm text-gray-500 italic">No resources were generated. Try again.</p>;
    }

    return (
        <div className="mt-6 space-y-4">
            {resources.map((resource, index) => (
                <div key={index} className={`p-4 rounded-lg border ${typeColors[resource.type]}`}>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white">
                           {iconMap[resource.type]}
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold">{resource.title}</h4>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{resource.description}</p>
                            {resource.url && (
                                <a 
                                    href={resource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-sm font-semibold text-brand-primary hover:underline"
                                >
                                    View Resource &rarr;
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};