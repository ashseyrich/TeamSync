
import React, { useState } from 'react';

interface ConfirmDeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teamName: string;
}

export const ConfirmDeleteTeamModal: React.FC<ConfirmDeleteTeamModalProps> = ({ isOpen, onClose, onConfirm, teamName }) => {
  const [confirmationText, setConfirmationText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationText === teamName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4 p-6 border-b border-red-100">
          <h2 className="text-2xl font-black text-red-600 uppercase tracking-tight">Destroy Team Permanentely</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <div className="space-y-4 p-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-800 font-bold">WARNING: This cannot be undone.</p>
                <p className="text-sm text-red-700 mt-1">You are about to delete <span className="font-black underline">{teamName}</span> and all associated data including member records, check-in history, schedules, and training content.</p>
            </div>
            
            <p className="font-semibold text-gray-800">
                To confirm permanent deletion, please type the team name exactly:
            </p>
            <p className="text-center font-mono bg-gray-100 p-2 rounded text-lg border select-all">{teamName}</p>
            
            <div>
                <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type team name here..."
                    className="mt-1 block w-full pl-3 py-3 border-2 border-red-200 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm font-bold"
                    autoFocus
                />
            </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 bg-gray-50 rounded-b-lg border-t">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 order-2 sm:order-1">
            Keep My Team
          </button>
          <button 
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="px-6 py-2 bg-red-600 text-white font-black rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed order-1 sm:order-2 uppercase tracking-wider"
          >
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
};
