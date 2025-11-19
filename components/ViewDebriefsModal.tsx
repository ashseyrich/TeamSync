import React, { useMemo } from 'react';
import type { ServiceEvent, MemberDebrief, TeamMember } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface ViewDebriefsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ServiceEvent;
  teamMembers: TeamMember[];
}

export const ViewDebriefsModal: React.FC<ViewDebriefsModalProps> = ({ isOpen, onClose, event, teamMembers }) => {
  if (!isOpen) return null;

  const debriefs = event.debriefs || [];

  const memberMap = useMemo(() => new Map(teamMembers.map(m => [m.id, m])), [teamMembers]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Debriefs for {event.name}</h2>
          <p className="text-sm text-gray-600">{event.date.toLocaleDateString()}</p>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {debriefs.length > 0 ? debriefs.map(debrief => {
            const member = memberMap.get(debrief.memberId);
            return (
              <div key={debrief.memberId} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar avatarUrl={member?.avatarUrl} name={member?.name || 'Unknown'} sizeClassName="w-10 h-10" />
                    <h3 className="font-bold text-gray-800">{member?.name || 'Unknown User'}</h3>
                </div>
                <div className="space-y-2 text-sm">
                    <div>
                        <p className="font-semibold text-green-700">What went well?</p>
                        <p className="text-gray-700 pl-2">{debrief.whatWentWell}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-yellow-700">What could be improved?</p>
                        <p className="text-gray-700 pl-2">{debrief.whatCouldBeImproved}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-blue-700">Action Items:</p>
                        <p className="text-gray-700 pl-2">{debrief.actionItems}</p>
                    </div>
                </div>
              </div>
            )
          }) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No debriefs have been submitted for this event yet.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark">Close</button>
        </div>
      </div>
    </div>
  );
};