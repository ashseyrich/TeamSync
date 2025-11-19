import React from 'react';
import type { TeamMember, Achievement } from '../types.ts';
import { Avatar } from './Avatar.tsx';
import { AchievementBadge } from './AchievementBadge.tsx';

interface TeamMemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  allAchievements: Achievement[];
}

export const TeamMemberProfileModal: React.FC<TeamMemberProfileModalProps> = ({ isOpen, onClose, member, allAchievements }) => {
  if (!isOpen) return null;

  const memberAchievements = allAchievements.filter(ach => member.awardedAchievements?.includes(ach.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Team Member Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar avatarUrl={member.avatarUrl} name={member.name} sizeClassName="w-24 h-24 text-4xl" />
            <div className="flex-grow text-center sm:text-left">
              <h3 className="text-2xl font-bold text-gray-900">{member.name}</h3>
              <p className="text-md text-gray-600">{member.pronouns}</p>
            </div>
          </div>

          {/* About Me */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">About Me</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
              {member.aboutMe || <span className="italic">No information provided.</span>}
            </p>
          </div>

          {/* Favorite Moment */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Favorite Serving Moment</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
              {member.favoriteMoment || <span className="italic">No information provided.</span>}
            </p>
          </div>
          
          {/* Achievements */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Achievements</h4>
            {memberAchievements.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {memberAchievements.map(ach => <AchievementBadge key={ach.id} achievement={ach} />)}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No achievements earned yet.</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark">Close</button>
        </div>
      </div>
    </div>
  );
};