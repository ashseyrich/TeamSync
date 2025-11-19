import React from 'react';
import type { TeamMember, Skill, AttendanceStats } from '../types.ts';
import { SkillBadge } from './SkillBadge.tsx';
import { Avatar } from './Avatar.tsx';
import { hasPermission } from '../utils/permissions.ts';

interface TeamMemberCardProps {
  member: TeamMember;
  allSkills: Skill[];
  attendanceStats?: AttendanceStats;
  hasAlerts: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onAwardClick: () => void;
  onViewProfile: () => void;
  currentUser: TeamMember;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, allSkills, attendanceStats, hasAlerts, onEdit, onRemove, onAwardClick, onViewProfile, currentUser }) => {

  const getSkillName = (skillId: string) => {
    return allSkills.find(s => s.id === skillId)?.name || 'Unknown Skill';
  };

  const canManage = hasPermission(currentUser, 'admin');

  return (
    <div className="bg-white rounded-lg shadow-md p-5 flex flex-col">
      <button 
        onClick={onViewProfile} 
        className="w-full text-left p-1 -m-1 mb-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        <div className="flex items-start justify-between">
            <div className="flex items-center">
                <Avatar avatarUrl={member.avatarUrl} name={member.name} sizeClassName="h-16 w-16" />
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-800">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.pronouns}</p>
                </div>
            </div>
            {canManage && hasAlerts && (
                <div className="text-yellow-500" title="This member has performance alerts.">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
      </button>

      {canManage && attendanceStats && (
        <div className="text-xs text-gray-500 grid grid-cols-3 divide-x text-center">
            <div title="Total past assignments">
                <p className="font-bold text-lg text-gray-700">{attendanceStats.totalAssignments}</p>
                <p>Scheduled</p>
            </div>
            <div title="On-time check-in percentage (includes early)">
                <p className={`font-bold text-lg ${attendanceStats.onTimePercentage >= 90 ? 'text-green-600' : 'text-gray-700'}`}>{attendanceStats.onTimePercentage.toFixed(0)}%</p>
                <p>On-Time</p>
            </div>
            <div title="Events scheduled for but not checked into">
                <p className={`font-bold text-lg ${attendanceStats.noShow > 0 ? 'text-red-600' : 'text-gray-700'}`}>{attendanceStats.noShow}</p>
                <p>No-Shows</p>
            </div>
        </div>
      )}
      
      <div className="mt-4 flex-grow">
        <h4 className="text-sm font-semibold text-gray-700">Skills</h4>
        <div className="flex flex-wrap gap-2 mt-2">
          {member.skills.length > 0 ? member.skills.map(skill => (
            <SkillBadge key={skill.skillId} skillName={getSkillName(skill.skillId)} proficiency={skill.proficiency} />
          )) : <p className="text-xs text-gray-500 italic">No skills added yet.</p>}
        </div>
      </div>
       {canManage && (
        <div className="mt-4 pt-4 border-t flex justify-end gap-2">
            <button onClick={onAwardClick} className="text-sm text-brand-secondary hover:underline">Award</button>
            <span className="text-gray-300">|</span>
            <button onClick={onEdit} className="text-sm text-blue-600 hover:underline">Edit</button>
            {currentUser.id !== member.id && (
                <>
                    <span className="text-gray-300">|</span>
                    <button onClick={onRemove} className="text-sm text-red-600 hover:underline">Remove</button>
                </>
            )}
        </div>
      )}
    </div>
  );
};