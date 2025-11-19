import React, { useMemo } from 'react';
import type { Announcement, TeamMember } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface ReadReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement;
  teamMembers: TeamMember[];
}

const MemberList: React.FC<{ title: string, members: TeamMember[], color: 'green' | 'red' }> = ({ title, members, color }) => (
    <div>
        <h4 className={`font-semibold text-gray-700 mb-2 pb-1 border-b`}>{title} ({members.length})</h4>
        <div className="space-y-2">
            {members.length > 0 ? members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                    <Avatar avatarUrl={member.avatarUrl} name={member.name} sizeClassName="w-8 h-8" />
                    <span className="text-sm text-gray-800">{member.name}</span>
                </div>
            )) : <p className="text-sm text-gray-500 italic">None</p>}
        </div>
    </div>
);

export const ReadReceiptsModal: React.FC<ReadReceiptsModalProps> = ({ isOpen, onClose, announcement, teamMembers }) => {
  if (!isOpen) return null;

  const { readBy, notReadBy } = useMemo(() => {
    const readIds = new Set(announcement.readBy || []);
    const readBy: TeamMember[] = [];
    const notReadBy: TeamMember[] = [];

    teamMembers.forEach(member => {
        if (readIds.has(member.id)) {
            readBy.push(member);
        } else {
            notReadBy.push(member);
        }
    });
    return { readBy, notReadBy };
  }, [announcement, teamMembers]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Read Receipts</h2>
          <p className="text-sm text-gray-600 truncate">For: "{announcement.title}"</p>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
            <MemberList title="Read By" members={readBy} color="green" />
            <MemberList title="Not Read By" members={notReadBy} color="red" />
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark">Close</button>
        </div>
      </div>
    </div>
  );
};