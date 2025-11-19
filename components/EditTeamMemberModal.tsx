import React, { useState, useEffect, useMemo } from 'react';
import type { TeamMember, Skill, MemberSkill, AttendanceStats, ServiceEvent, Team } from '../types.ts';
import { Proficiency } from '../types.ts';
import { detectPerformanceIssues } from '../utils/performance.ts';
import { hasPermission } from '../utils/permissions.ts';

const ALL_SKILLS = [
    // Technical Skills
    'Audio Mixing', 
    'Camera Operation', 
    'Video Directing', 
    'ProPresenter', 
    'Lighting',
    // Soft & Personal Skills
    'Communication', 
    'Leadership', 
    'Problem Solving', 
    'Teamwork', 
    'Adaptability',
    'Timeliness',
    'Cleaning Up Equipment',
    'Attention to Detail',
    'Following Directions',
    'Receiving Feedback'
];

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  currentUser: TeamMember;
  team: Team;
  onSave: (member: TeamMember) => void;
  allSkills: Skill[];
  attendanceStats?: AttendanceStats;
  serviceEvents: ServiceEvent[]; // To calculate alerts
}

export const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({ isOpen, onClose, member, currentUser, team, onSave, allSkills, attendanceStats, serviceEvents }) => {
  const [memberData, setMemberData] = useState<TeamMember>(member);
  
  // Recalculate alerts based on full data passed in
  const performanceAlerts = useMemo(() => {
    if (!attendanceStats) return [];
    return detectPerformanceIssues(attendanceStats);
  }, [attendanceStats]);
  
  const isAdmin = useMemo(() => hasPermission(currentUser, 'admin'), [currentUser]);

  const isLastAdmin = useMemo(() => {
    const adminCount = team.members.filter(m => m.permissions.includes('admin')).length;
    const isCurrentlyAdmin = memberData.permissions.includes('admin');
    // Check if the member being edited is an admin and if they are the only one.
    return isCurrentlyAdmin && adminCount === 1;
  }, [team.members, memberData.permissions]);


  useEffect(() => {
    setMemberData(member);
  }, [member]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMemberData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission: 'admin' | 'scheduler', checked: boolean) => {
    const newPermissions = new Set(memberData.permissions);
    if (checked) {
      newPermissions.add(permission);
    } else {
      newPermissions.delete(permission);
    }
    setMemberData(prev => ({ ...prev, permissions: Array.from(newPermissions) as ('admin'|'scheduler')[] }));
  };
  
  const handleSkillProficiencyChange = (skillId: string, proficiency: Proficiency) => {
      const existingSkillIndex = memberData.skills.findIndex(s => s.skillId === skillId);
      let newSkills: MemberSkill[];

      if (existingSkillIndex > -1) {
          newSkills = [...memberData.skills];
          newSkills[existingSkillIndex] = { ...newSkills[existingSkillIndex], proficiency };
      } else {
          newSkills = [...memberData.skills, { skillId, proficiency }];
      }
      setMemberData(prev => ({...prev, skills: newSkills}));
  };
  
  const handleSuggestedGrowthToggle = (skill: string) => {
    const currentSuggestions = new Set(memberData.suggestedGrowthAreas || []);
    if (currentSuggestions.has(skill)) {
        currentSuggestions.delete(skill);
    } else {
        currentSuggestions.add(skill);
    }
    setMemberData(prev => ({...prev, suggestedGrowthAreas: Array.from(currentSuggestions)}));
  };

  const handleSave = () => {
    onSave(memberData);
  };
  
  const getProficiencyForSkill = (skillId: string): Proficiency | undefined => {
      return memberData.skills.find(s => s.skillId === skillId)?.proficiency;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit {member.name}</h2>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="name" id="name" value={memberData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700">Pronouns</label>
                    <input type="text" name="pronouns" id="pronouns" value={memberData.pronouns || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" name="email" id="email" value={memberData.email || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" name="phoneNumber" id="phoneNumber" value={memberData.phoneNumber || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
            </div>

            <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Permissions</h4>
                <div className="flex items-center gap-6">
                    <label 
                        className="flex items-center gap-2 cursor-pointer"
                        title={isLastAdmin ? "You cannot remove the last administrator." : ""}
                    >
                        <input 
                            type="checkbox" 
                            checked={memberData.permissions.includes('admin')} 
                            onChange={e => handlePermissionChange('admin', e.target.checked)}
                            disabled={isLastAdmin}
                            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                         />
                        <span className={`text-sm ${isLastAdmin ? 'text-gray-400' : 'text-gray-700'}`}>Admin</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={memberData.permissions.includes('scheduler')} onChange={e => handlePermissionChange('scheduler', e.target.checked)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                        <span className="text-sm text-gray-700">Scheduler</span>
                    </label>
                </div>
            </div>

            {attendanceStats && (
                <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Attendance Record (Read-only)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
                        <div className="p-2 bg-gray-100 rounded-md">
                            <p className="font-bold text-lg text-gray-800">{attendanceStats.totalAssignments}</p>
                            <p className="text-xs text-gray-600">Total Assignments</p>
                        </div>
                         <div className="p-2 bg-green-50 rounded-md">
                            <p className="font-bold text-lg text-green-800">{attendanceStats.onTime + attendanceStats.early}</p>
                            <p className="text-xs text-green-700">On-Time/Early</p>
                        </div>
                         <div className="p-2 bg-yellow-50 rounded-md">
                            <p className="font-bold text-lg text-yellow-800">{attendanceStats.late}</p>
                            <p className="text-xs text-yellow-700">Late</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-md">
                            <p className="font-bold text-lg text-red-800">{attendanceStats.noShow}</p>
                            <p className="text-xs text-red-700">No-Shows</p>
                        </div>
                    </div>
                </div>
            )}
            
            {performanceAlerts.length > 0 && (
                 <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Performance Notes (Read-only)</h4>
                    <div className="space-y-2">
                        {performanceAlerts.map((alert, i) => (
                            <div key={i} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded-r-md">
                                {alert.message}
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Skills & Proficiency</h4>
                <div className="space-y-2">
                    {allSkills.map(skill => (
                        <div key={skill.id} className="grid grid-cols-3 items-center">
                            <label className="text-sm font-medium text-gray-700 col-span-1">{skill.name}</label>
                            <div className="col-span-2">
                                <select value={getProficiencyForSkill(skill.id) || 'none'} onChange={e => handleSkillProficiencyChange(skill.id, e.target.value as Proficiency)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                                    <option value="none">Not Set</option>
                                    <option value={Proficiency.TRAINEE}>{Proficiency.TRAINEE}</option>
                                    <option value={Proficiency.NOVICE}>{Proficiency.NOVICE}</option>
                                    <option value={Proficiency.SOLO_OPERATOR}>{Proficiency.SOLO_OPERATOR}</option>
                                    <option value={Proficiency.MASTER_TRAINER}>{Proficiency.MASTER_TRAINER}</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {isAdmin && (
                 <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Suggested Areas for Growth (Admin View)</h4>
                    <p className="text-xs text-gray-500 mb-2">Select areas you'd like this member to focus on. They will see these suggestions on their profile.</p>
                    <div className="grid grid-cols-2 gap-2">
                        {ALL_SKILLS.map(skill => (
                            <label key={skill} className="flex items-center p-2 bg-gray-50 rounded-md">
                               <input 
                                 type="checkbox" 
                                 checked={(memberData.suggestedGrowthAreas || []).includes(skill)} 
                                 onChange={() => handleSuggestedGrowthToggle(skill)} 
                                 className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                               <span className="ml-2 text-sm text-gray-800">{skill}</span>
                           </label>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Changes</button>
        </div>
      </div>
    </div>
  );
};