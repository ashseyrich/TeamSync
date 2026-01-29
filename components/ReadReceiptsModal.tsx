
import React, { useMemo } from 'react';
import type { Announcement, TeamMember, ReadReceipt } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface ReadReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement;
  teamMembers: TeamMember[];
}

const MemberItem: React.FC<{ member: TeamMember, receipt?: ReadReceipt }> = ({ member, receipt }) => (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
            <Avatar avatarUrl={member.avatarUrl} name={member.name} sizeClassName="w-10 h-10" />
            <div>
                <span className="text-sm font-bold text-gray-800 block">{member.name}</span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{member.pronouns || 'Team Member'}</span>
            </div>
        </div>
        {receipt ? (
            <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700 border border-green-200">Seen</span>
                <p className="text-[10px] font-bold text-gray-500 mt-1">
                    {new Date(receipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="mx-1">•</span>
                    {new Date(receipt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
            </div>
        ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-50 text-red-500 border border-red-100">Unread</span>
        )}
    </div>
);

export const ReadReceiptsModal: React.FC<ReadReceiptsModalProps> = ({ isOpen, onClose, announcement, teamMembers }) => {
  if (!isOpen || !announcement) return null;

  const { readBy, notReadBy } = useMemo(() => {
    const receiptsMap = new Map<string, ReadReceipt>((announcement?.readBy || []).map(r => [r.userId, r]));
    const read: {member: TeamMember, receipt: ReadReceipt}[] = [];
    const unread: TeamMember[] = [];

    (teamMembers || []).forEach(member => {
        const receipt = receiptsMap.get(member.id);
        if (receipt) {
            read.push({ member, receipt });
        } else {
            unread.push(member);
        }
    });

    read.sort((a, b) => new Date(b.receipt.timestamp).getTime() - new Date(a.receipt.timestamp).getTime());
    unread.sort((a, b) => a.name.localeCompare(b.name));

    return { readBy: read, notReadBy: unread };
  }, [announcement, teamMembers]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 flex flex-col max-h-[85vh] overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Acknowledgment Audit</h2>
                <p className="text-sm font-medium text-gray-500 mt-0.5 truncate max-w-md">Update: "{announcement.title}"</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">&times;</button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                    <p className="text-2xl font-black text-green-700">{readBy.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Have Seen</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                    <p className="text-2xl font-black text-red-700">{notReadBy.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">Pending</p>
                </div>
            </div>

            {readBy.length > 0 && (
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Team Audit Trail</h4>
                    <div className="space-y-2">
                        {readBy.map(item => <MemberItem key={item.member.id} member={item.member} receipt={item.receipt} />)}
                    </div>
                </div>
            )}

            {notReadBy.length > 0 && (
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Waiting for Response</h4>
                    <div className="space-y-2">
                        {notReadBy.map(member => <MemberItem key={member.id} member={member} />)}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 flex justify-end border-t">
          <button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-xl shadow-md hover:bg-brand-primary-dark transition-all uppercase text-xs tracking-widest">Done</button>
        </div>
      </div>
    </div>
  );
};
