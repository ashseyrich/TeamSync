
import React from 'react';

interface ConfirmJoinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    teamName: string;
}

export const ConfirmJoinModal: React.FC<ConfirmJoinModalProps> = ({ isOpen, onClose, onConfirm, teamName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[200] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">New Team Invite</h2>
                <p className="mt-2 text-gray-600">
                    You've been invited to join <span className="font-black text-brand-primary">{teamName}</span>. 
                    Since you're already logged in, you can join instantly!
                </p>
                <div className="mt-8 space-y-3">
                    <button onClick={onConfirm} className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-brand-primary-dark transition-all transform hover:scale-[1.02]">
                        Join Team Now
                    </button>
                    <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-all">
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};
