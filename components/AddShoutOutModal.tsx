import React, { useState } from 'react';
import type { TeamMember } from '../types.ts';

interface AddShoutOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (toId: string, message: string) => void;
  teamMembers: TeamMember[];
}

export const AddShoutOutModal: React.FC<AddShoutOutModalProps> = ({ isOpen, onClose, onSave, teamMembers }) => {
  const [toId, setToId] = useState<string>('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!toId || !message.trim()) {
      alert('Please select a team member and write a message.');
      return;
    }
    onSave(toId, message);
    setToId('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Give a Shout-Out</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="shoutOutTo" className="block text-sm font-medium text-gray-700">To</label>
            <select
              id="shoutOutTo"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
            >
              <option value="">Select a team member...</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="shoutOutMessage" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              id="shoutOutMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="Write something encouraging..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark">Send Shout-Out</button>
        </div>
      </div>
    </div>
  );
};