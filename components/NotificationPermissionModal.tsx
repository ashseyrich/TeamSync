import React from 'react';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({ isOpen, onEnable, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 flex flex-col items-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-brand-light text-brand-primary flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Stay in the Loop</h2>
        <p className="text-sm text-gray-600 mt-2 mb-6">
          Enable push notifications to receive instant updates on important announcements and schedule changes, even when the app is closed.
        </p>
        <div className="flex flex-col sm:flex-row w-full gap-2">
          <button 
            onClick={onEnable} 
            className="w-full px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark"
          >
            Enable Notifications
          </button>
          <button 
            onClick={onDismiss} 
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};