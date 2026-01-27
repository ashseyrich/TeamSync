
// This is a placeholder VAPID public key.
// In a real application, this would be generated on your server and sent to the client.
const VAPID_PUBLIC_KEY = 'BPhgcyAwt5q23ZWoA3nQomg7MTQ_y6s-u3S8PFS0Sc-y_E525hdlSbwuq_xG_Twwi4aGNPq-T2hndD-4JvoHWTU';

/**
 * Converts a base64 string to a Uint8Array.
 * This is required for the push subscription.
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


/**
 * Registers the service worker.
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // FIX: Using relative path './sw.js' instead of '/sw.js' to ensure 
            // the script is fetched from the current origin's context.
            // Some preview environments redirect root requests to the parent domain.
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    // Check if failure is due to origin mismatch (common in sandboxed environments)
                    if (err.message && err.message.includes('origin')) {
                        console.info('ServiceWorker registration restricted by environment security policy. PWA features (offline/push) may be disabled in this preview.');
                    } else {
                        console.warn('ServiceWorker registration failed: ', err);
                    }
                });
        });
    }
}

/**
 * Gets the current notification permission state.
 */
export function getNotificationPermissionState(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}


/**
 * Requests permission for notifications and subscribes to push notifications.
 * @returns The push subscription object if successful, otherwise null.
 */
export async function requestNotificationPermission(): Promise<PushSubscription | null> {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported in this browser.');
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.log('Notification permission not granted.');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        console.log('Service Worker is ready.');

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log('Push Subscription successful:', subscription);
        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        return null;
    }
}

/**
 * Sends a local notification using the service worker registration.
 * IMPROVEMENT: Added requireInteraction and vibration to meet accountability paging requirements.
 * Added tag parameter to prevent suppression of concurrent alerts.
 */
export async function sendLocalNotification(title: string, body: string, tag: string = 'team-sync-default') {
    if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        
        registration.showNotification(title, {
            body: body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500],
            tag: tag, // Unique tag per alert prevents silencing older notifications
            renotify: true,
            requireInteraction: true, // Key for accountability: stays until cleared
            silent: false,
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        } as any);
    } catch (e) {
        console.warn('Could not send notification:', e);
    }
}
