import React, { useState, useMemo, useEffect } from 'react';
// FIX: Corrected import path for types module.
import type { ServiceEvent, TeamMember } from '../types.ts';
import { getCurrentLocation } from '../utils/location.ts';

interface CheckInButtonProps {
    event: ServiceEvent;
    currentUser: TeamMember;
    onCheckIn: (eventId: string, location: { latitude: number; longitude: number; }) => Promise<void>;
}

type CheckInStatus = 'idle' | 'locating' | 'checking-in' | 'checked-in' | 'error';

export const CheckInButton: React.FC<CheckInButtonProps> = ({ event, currentUser, onCheckIn }) => {
    const [status, setStatus] = useState<CheckInStatus>('idle');
    const [message, setMessage] = useState<string>('');
    
    const isAlreadyCheckedIn = useMemo(() => {
        return currentUser.checkIns.some(ci => ci.eventId === event.id);
    }, [currentUser.checkIns, event.id]);

    const isCheckInWindowActive = useMemo(() => {
        const now = new Date().getTime();
        const callTime = new Date(event.callTime).getTime();
        const oneHourBefore = callTime - (60 * 60 * 1000);
        const thirtyMinutesAfter = callTime + (30 * 60 * 1000);
        return now >= oneHourBefore && now <= thirtyMinutesAfter;
    }, [event.callTime]);

    useEffect(() => {
        if (isAlreadyCheckedIn) {
            setStatus('checked-in');
        }
    }, [isAlreadyCheckedIn]);
    
    const handleCheckIn = async () => {
        setStatus('locating');
        setMessage('Getting your location...');
        try {
            const location = await getCurrentLocation();
            setStatus('checking-in');
            setMessage('Checking in...');
            await onCheckIn(event.id, location);
            setStatus('checked-in');
            setMessage('Checked in successfully.');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'An unknown check-in error occurred.');
        }
    };
    
    if (isAlreadyCheckedIn) {
         return (
            <div className="text-right">
                <button disabled className="px-4 py-2 font-semibold rounded-lg text-sm bg-green-100 text-green-800 cursor-default">
                    Checked In
                </button>
            </div>
         );
    }
    
    if (!isCheckInWindowActive) {
         return (
            <div className="text-right">
                <button disabled className="px-4 py-2 font-semibold rounded-lg text-sm bg-gray-200 text-gray-500 cursor-not-allowed">
                    Check In
                </button>
                 <p className="text-xs text-gray-500 mt-1">
                    Opens 1hr before call time.
                </p>
            </div>
         );
    }
    
    const buttonClass = `px-4 py-2 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center w-full sm:w-auto ${
        status === 'checking-in' || status === 'locating'
            ? 'bg-blue-500 text-white animate-pulse'
            : 'bg-brand-primary text-white hover:bg-brand-primary-dark'
    }`;
    
    return (
        <div className="text-right">
            <button
                onClick={handleCheckIn}
                disabled={status === 'checking-in' || status === 'locating'}
                className={buttonClass}
            >
                {status === 'locating' ? 'Locating...' : status === 'checking-in' ? 'Checking in...' : 'Check In'}
            </button>
            {message && status === 'error' && (
                <p className="text-xs mt-1 text-red-500">
                    {message}
                </p>
            )}
        </div>
    );
};