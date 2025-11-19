import React, { useState } from 'react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teamName: string;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose, onConfirm, teamName }) => {
  const [confirmationText, setConfirmationText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationText === teamName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4 p-6 border-b">
          <h2 className="text-2xl font-bold text-red-600">Confirm Team Reset</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <div className="space-y-4 p-6">
            <p className="text-gray-700">
                This is a destructive action. You are about to reset the team <span className="font-bold">{teamName}</span>.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>All other team members will be permanently removed.</li>
                <li>All schedule data, announcements, shout-outs, and other team data will be deleted.</li>
                <li>Your administrator account will be preserved.</li>
            </ul>
            <p className="font-semibold text-gray-800">
                To confirm, please type the team name below: <span className="font-mono bg-gray-100 p-1 rounded">{teamName}</span>
            </p>
            <div>
                <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
            </div>
        </div>
        <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            I understand, reset this team
          </button>
        </div>
      </div>
    </div>
  );
};