import React, { useState, useEffect } from 'react';
import type { ServiceEvent, MemberDebrief } from '../types.ts';

interface DebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ServiceEvent;
  initialDebrief: Omit<MemberDebrief, 'memberId'> | null;
  onSave: (debrief: Omit<MemberDebrief, 'memberId'>) => void;
}

export const DebriefModal: React.FC<DebriefModalProps> = ({ isOpen, onClose, event, initialDebrief, onSave }) => {
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatCouldBeImproved, setWhatCouldBeImproved] = useState('');
  const [actionItems, setActionItems] = useState('');

  useEffect(() => {
    if (initialDebrief) {
      setWhatWentWell(initialDebrief.whatWentWell);
      setWhatCouldBeImproved(initialDebrief.whatCouldBeImproved);
      setActionItems(initialDebrief.actionItems);
    } else {
      setWhatWentWell('');
      setWhatCouldBeImproved('');
      setActionItems('');
    }
  }, [initialDebrief]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ whatWentWell, whatCouldBeImproved, actionItems });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">My Service Debrief</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{event.name} on {event.date.toLocaleDateString()}</p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="whatWentWell" className="block text-sm font-medium text-gray-700">What went well?</label>
            <textarea
              id="whatWentWell"
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              rows={3}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Communication on comms was clear..."
            />
          </div>
          <div>
            <label htmlFor="whatCouldBeImproved" className="block text-sm font-medium text-gray-700">What could be improved?</label>
            <textarea
              id="whatCouldBeImproved"
              value={whatCouldBeImproved}
              onChange={(e) => setWhatCouldBeImproved(e.target.value)}
              rows={3}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., We missed a cue for the announcement slide..."
            />
          </div>
          <div>
            <label htmlFor="actionItems" className="block text-sm font-medium text-gray-700">My personal action items</label>
            <textarea
              id="actionItems"
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              rows={2}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Next week I will focus on..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
            Cancel
          </button>
           <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">
            Save Debrief
           </button>
        </div>
      </div>
    </div>
  );
};