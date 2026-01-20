import React, { useState, useMemo, useEffect } from 'react';
import type { ServiceEvent, TeamMember } from '../types.ts';
import { getCurrentLocation, getDistance } from '../utils/location.ts';

interface CheckInButtonProps {
    event: ServiceEvent;
    currentUser: TeamMember;
    onCheckIn: (eventId: string, location: { latitude: number; longitude: number; }) => Promise<void>;
}

type CheckInStatus = 'idle' | 'locating' | 'checking-in' | 'checked-in' | 'error';

const MAX_CHECKIN_DISTANCE_METERS = 200; // Allow 200m buffer

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

    const isLate = useMemo(() => {
        const now = new Date().getTime();
        const callTime = new Date(event.callTime).getTime();
        return now > callTime + (5 * 60 * 1000); // 5 minute grace period
    }, [event.callTime]);

    useEffect(() => {
        if (isAlreadyCheckedIn) {
            setStatus('checked-in');
        }
    }, [isAlreadyCheckedIn]);
    
    const handleCheckIn = async () => {
        // Late Accountability Prompt
        if (isLate && !isAlreadyCheckedIn) {
            const reason = window.prompt("You are checking in past call time. Please provide a brief reason for accountability (e.g., Traffic, Overran at soundcheck):");
            if (reason === null) return; // Cancelled
        }

        setStatus('locating');
        setMessage('Verifying your on-site location...');
        try {
            const userLocation = await getCurrentLocation();
            
            // Geofencing Check
            if (event.location?.latitude && event.location?.longitude) {
                const distance = getDistance(
                    userLocation.latitude, 
                    userLocation.longitude, 
                    event.location.latitude, 
                    event.location.longitude
                );
                
                if (distance > MAX_CHECKIN_DISTANCE_METERS) {
                    setStatus('error');
                    setMessage(`Location error: You appear to be ${Math.round(distance)}m away. Please get closer to the venue.`);
                    return;
                }
            }

            setStatus('checking-in');
            setMessage('Recording entry...');
            await onCheckIn(event.id, userLocation);
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
                <div className="inline-flex items-center gap-2 px-4 py-2 font-black uppercase tracking-widest text-xs rounded-lg bg-green-100 text-green-800 border border-green-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Checked In
                </div>
            </div>
         );
    }
    
    if (!isCheckInWindowActive) {
         return (
            <div className="text-right">
                <button disabled className="px-4 py-2 font-black uppercase tracking-widest text-xs rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                    Check In Locked
                </button>
                 <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase">
                    Opens 60m before call
                </p>
            </div>
         );
    }
    
    const buttonClass = `px-6 py-2 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center w-full sm:w-auto shadow-md transform active:scale-95 ${
        status === 'checking-in' || status === 'locating'
            ? 'bg-blue-500 text-white animate-pulse cursor-wait'
            : isLate 
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-brand-primary text-white hover:bg-brand-primary-dark'
    } rounded-lg`;
    
    return (
        <div className="text-right w-full sm:w-auto">
            <button
                onClick={handleCheckIn}
                disabled={status === 'checking-in' || status === 'locating'}
                className={buttonClass}
            >
                {status === 'locating' ? 'Locating...' : status === 'checking-in' ? 'Check In...' : isLate ? 'Late Check-In' : 'On-Site Check In'}
            </button>
            {message && (
                <p className={`text-[10px] mt-1 font-black uppercase tracking-tight ${status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                    {message}
                </p>
            )}
        </div>
    );
};
