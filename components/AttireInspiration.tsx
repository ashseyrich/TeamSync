

import React, { useState } from 'react';
import { generateAttireImage } from '../services/geminiService.ts';
import type { ServiceEvent } from '../types.ts';

interface AttireInspirationProps {
  event: ServiceEvent;
  onUpdateEvent: (event: ServiceEvent) => void;
  canSchedule: boolean;
}

const ImageDisplay: React.FC<{
    gender: 'male' | 'female';
    imageUrl?: string;
    onGenerate: () => void;
    isLoading: boolean;
    canSchedule: boolean;
}> = ({ gender, imageUrl, onGenerate, isLoading, canSchedule }) => {
    
    if (imageUrl) {
        return (
             <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border">
                <img src={`data:image/png;base64,${imageUrl}`} alt={`${gender} attire inspiration`} className="w-full h-full object-cover" />
             </div>
        )
    }

    if (!canSchedule) {
        return (
            <div className="aspect-[3/4] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-center p-2 border">
                <p className="text-sm font-semibold text-gray-700 capitalize">{gender}'s Attire</p>
                <p className="text-xs text-gray-500 mt-1">Image has not been generated yet.</p>
            </div>
        );
    }
    
    return (
        <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="px-3 py-2 bg-brand-secondary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark disabled:bg-gray-400 flex items-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    `Generate ${gender === 'male' ? "Men's" : "Women's"} Attire`
                )}
            </button>
        </div>
    );
};


export const AttireInspiration: React.FC<AttireInspirationProps> = ({ event, onUpdateEvent, canSchedule }) => {
    const [loading, setLoading] = useState({ men: false, women: false });
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (gender: 'male' | 'female') => {
        if (!event.attire) return;
        setLoading(prev => ({ ...prev, [gender === 'male' ? 'men' : 'women']: true }));
        setError(null);
        try {
            const imageBase64 = await generateAttireImage(event.attire.theme, event.attire.description, gender);
            const updatedEvent = {
                ...event,
                attireImages: {
                    ...event.attireImages,
                    [gender === 'male' ? 'men' : 'women']: imageBase64,
                }
            };
            onUpdateEvent(updatedEvent);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to generate ${gender}'s attire: ${message}`);
            console.error(err);
        } finally {
            setLoading(prev => ({ ...prev, [gender === 'male' ? 'men' : 'women']: false }));
        }
    };
    
    return (
        <div>
            <div className="grid grid-cols-2 gap-4">
                <ImageDisplay 
                    gender="male"
                    imageUrl={event.attireImages?.men}
                    onGenerate={() => handleGenerate('male')}
                    isLoading={loading.men}
                    canSchedule={canSchedule}
                />
                 <ImageDisplay 
                    gender="female"
                    imageUrl={event.attireImages?.women}
                    onGenerate={() => handleGenerate('female')}
                    isLoading={loading.women}
                    canSchedule={canSchedule}
                />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};