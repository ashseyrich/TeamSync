import React, { useState, useEffect } from 'react';
import { getNotificationPermissionState, requestNotificationPermission } from '../utils/notifications.ts';

interface NotificationSettingsProps {
    onSubscriptionChange: (subscription: PushSubscription | null) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onSubscriptionChange }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkStatus = async () => {
            const perm = getNotificationPermissionState();
            setPermission(perm);
            
            if (perm === 'granted' && 'serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                } catch (e) {
                    console.error("Could not check subscription", e);
                    setIsSubscribed(false); // Assume not subscribed on error
                }
            } else {
                setIsSubscribed(false);
            }
        };
        
        checkStatus();
    }, []);

    const handleEnableNotifications = async () => {
        setIsSubscribing(true);
        setError('');
        try {
            const subscription = await requestNotificationPermission();
            if (subscription) {
                onSubscriptionChange(subscription);
                setPermission('granted');
                setIsSubscribed(true);
            } else {
               // This can happen if the user clicks 'block' or closes the prompt
               const currentPermission = getNotificationPermissionState();
               setPermission(currentPermission);
               if(currentPermission === 'denied') {
                   setError('Notifications are blocked. You may need to change this in your browser settings.');
               }
            }
        } catch (err) {
            setError('An error occurred while enabling notifications.');
        } finally {
            setIsSubscribing(false);
        }
    };

    const renderContent = () => {
        if (isSubscribed === null) {
            return <p className="text-sm text-gray-500">Checking notification status...</p>;
        }
    
        if (permission === 'denied') {
            return <p className="text-sm text-red-600">{error || 'Notifications are blocked. Please enable them in your browser settings.'}</p>;
        }
        
        if (permission === 'granted' && isSubscribed) {
            return <p className="text-sm text-green-600">Push notifications are enabled on this device.</p>;
        }
    
        // This now covers 'default' permission, and 'granted' but not subscribed
        return (
            <>
                <p className="text-sm text-gray-600 mb-2">Enable push notifications to get instant alerts for important announcements.</p>
                <button onClick={handleEnableNotifications} disabled={isSubscribing} className="px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400">
                    {isSubscribing ? 'Subscribing...' : 'Enable Notifications'}
                </button>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Push Notifications</h3>
            {renderContent()}
        </div>
    );
}