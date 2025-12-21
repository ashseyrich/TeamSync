
import React, { useState, useMemo } from 'react';
import type { Team, TeamMember, ServiceEvent, AttendanceStats, Achievement } from '../types.ts';
import { TeamMemberCard } from './TeamMemberCard.tsx';
import { ManageRolesModal } from './ManageRolesModal.tsx';
import { ManageSkillsModal } from './ManageSkillsModal.tsx';
import { InviteMemberModal } from './InviteMemberModal.tsx';
import { EditTeamMemberModal } from './EditTeamMemberModal.tsx';
import { ConfirmRemoveModal } from './ConfirmRemoveModal.tsx';
import { TeamSettingsCard } from './TeamSettingsCard.tsx';
import { TeamBrandingCard } from './TeamBrandingCard.tsx';
import { calculateAttendanceStats, detectPerformanceIssues } from '../utils/performance.ts';
import { AwardAchievementModal } from './AwardAchievementModal.tsx';
import { hasPermission } from '../utils/permissions.ts';
import { TeamMemberProfileModal } from './TeamMemberProfileModal.tsx';
import { ConfirmResetModal } from './ConfirmResetModal.tsx';
import { ConfirmDeleteTeamModal } from './ConfirmDeleteTeamModal.tsx';
import { ManageAchievementsModal } from './ManageAchievementsModal.tsx';
import { ManageDepartmentsModal } from './ManageDepartmentsModal.tsx';

interface TeamViewProps {
  team: Team;
  serviceEvents: ServiceEvent[];
  currentUser: TeamMember;
  onUpdateTeam: (updatedData: Partial<Team>) => void;
  onUpdateMember: (member: TeamMember) => void;
  onRemoveMember: (memberId: string) => void;
  onResetTeam: (teamId: string, adminToKeepId: string) => void;
  onDeleteTeam: (teamId: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ team, serviceEvents, currentUser, onUpdateTeam, onUpdateMember, onRemoveMember, onResetTeam, onDeleteTeam }) => {
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [awardingMember, setAwardingMember] = useState<TeamMember | null>(null);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isDepartmentsModalOpen, setIsDepartmentsModalOpen] = useState(false);

  const isAdmin = useMemo(() => hasPermission(currentUser, 'admin'), [currentUser]);

  const { pendingMembers, activeMembers } = useMemo(() => {
    const pending = team.members.filter(m => m.status === 'pending-approval');
    const active = team.members.filter(m => m.status === 'active');
    return { pendingMembers: pending, activeMembers: active };
  }, [team.members]);
  
  const memberStats = useMemo(() => {
    const statsMap = new Map<string, { attendance: AttendanceStats; hasAlerts: boolean }>();
    activeMembers.forEach(member => {
      const attendance = calculateAttendanceStats(member, serviceEvents);
      const alerts = detectPerformanceIssues(attendance);
      statsMap.set(member.id, { attendance, hasAlerts: alerts.length > 0 });
    });
    return statsMap;
  }, [activeMembers, serviceEvents]);
  
  const handleApproveMember = (member: TeamMember) => {
      onUpdateMember({ ...member, status: 'active' });
  };
  
  const handleDenyMember = (memberId: string) => {
      if (window.confirm("Are you sure you want to deny this member's request? They will be removed from the system.")) {
        onRemoveMember(memberId);
      }
  };
  
  const handleSaveMember = (updatedMember: TeamMember) => {
      onUpdateMember(updatedMember);
      setEditingMember(null);
  };

  const handleSaveAwards = (awardedIds: string[]) => {
    if (!awardingMember) return;
    onUpdateMember({ ...awardingMember, awardedAchievements: awardedIds });
    setAwardingMember(null);
  }

  const handleConfirmReset = () => {
    onResetTeam(team.id, currentUser.id);
    setIsResetModalOpen(false);
  };

  const handleConfirmDeleteTeam = () => {
      onDeleteTeam(team.id);
      setIsDeleteTeamModalOpen(false);
  }

  // Helper for departments since we use onUpdateTeam
  const handleAddDepartment = (name: string) => {
      const newDept = { id: `dept_${Date.now()}`, name };
      onUpdateTeam({ departments: [...(team.departments || []), newDept] });
  };

  const handleRemoveDepartment = (id: string) => {
      onUpdateTeam({ departments: (team.departments || []).filter(d => d.id !== id) });
  };

  return (
    <div className="space-y-8 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-900">Team Roster &amp; Settings</h2>
        </div>
        {isAdmin && (
            <button 
                id="guide-invite-members-btn"
                onClick={() => setIsInviteModalOpen(true)} 
                className="w-full sm:w-auto px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" />
                </svg>
                Invite Members
            </button>
        )}
      </div>

      {isAdmin && pendingMembers.length > 0 && (
          <div id="guide-pending-members" className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md shadow-sm">
              <h3 className="text-lg font-semibold text-yellow-800">Pending Members</h3>
              <div className="mt-2 space-y-2">
                  {pendingMembers.map(member => (
                      <div key={member.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-white rounded-md gap-2">
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                              <button onClick={() => handleApproveMember(member)} className="flex-1 sm:flex-none px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-md">Approve</button>
                              <button onClick={() => handleDenyMember(member.id)} className="flex-1 sm:flex-none px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-md">Deny</button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      {isAdmin && (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TeamSettingsCard 
                    team={team} 
                    onUpdateTeam={onUpdateTeam} 
                    onResetTeamClick={() => setIsResetModalOpen(true)}
                    onDeleteTeamClick={() => setIsDeleteTeamModalOpen(true)}
                />
                <TeamBrandingCard team={team} onUpdateTeam={onUpdateTeam} />
            </div>

            <div id="guide-management-actions" className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Management Actions</h3>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button onClick={() => setIsDepartmentsModalOpen(true)} className="flex-grow sm:flex-grow-0 px-3 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 text-sm">Departments</button>
                        <button onClick={() => setIsRolesModalOpen(true)} className="flex-grow sm:flex-grow-0 px-3 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 text-sm">Roles</button>
                        <button onClick={() => setIsSkillsModalOpen(true)} className="flex-grow sm:flex-grow-0 px-3 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 text-sm">Skills</button>
                        <button onClick={() => setIsAchievementsModalOpen(true)} className="flex-grow sm:flex-grow-0 px-3 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 text-sm">Achievements</button>
                    </div>
                </div>
            </div>
        </>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeMembers.map((member, index) => {
              const stats = memberStats.get(member.id);
              return (
                <div key={member.id} id={index === 0 ? 'guide-member-card' : undefined}>
                  <TeamMemberCard 
                    member={member} 
                    allSkills={team.skills}
                    attendanceStats={stats?.attendance}
                    hasAlerts={stats?.hasAlerts || false}
                    onEdit={() => setEditingMember(member)}
                    onRemove={() => setRemovingMember(member)}
                    onAwardClick={() => setAwardingMember(member)}
                    onViewProfile={() => setViewingMember(member)}
                    currentUser={currentUser}
                  />
                </div>
              );
          })}
      </div>

      <ManageDepartmentsModal isOpen={isDepartmentsModalOpen} onClose={() => setIsDepartmentsModalOpen(false)} departments={team.departments || []} onAdd={handleAddDepartment} onRemove={handleRemoveDepartment} />
      <ManageRolesModal isOpen={isRolesModalOpen} onClose={() => setIsRolesModalOpen(false)} allRoles={team.roles} allSkills={team.skills} departments={team.departments} onSave={(roles) => onUpdateTeam({ roles })} />
      <ManageSkillsModal isOpen={isSkillsModalOpen} onClose={() => setIsSkillsModalOpen(false)} allSkills={team.skills} onSave={(skills) => onUpdateTeam({ skills })} />
      <ManageAchievementsModal isOpen={isAchievementsModalOpen} onClose={() => setIsAchievementsModalOpen(false)} team={team} onUpdateTeam={onUpdateTeam} />
      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        inviteCode={team.inviteCode} 
        adminInviteCode={team.adminInviteCode} 
        teamName={team.name}
        teamType={team.type}
        features={team.features}
      />
      {editingMember && <EditTeamMemberModal isOpen={!!editingMember} onClose={() => setEditingMember(null)} member={editingMember} currentUser={currentUser} team={team} onSave={handleSaveMember} allSkills={team.skills} attendanceStats={memberStats.get(editingMember.id)?.attendance} serviceEvents={serviceEvents} />}
      {removingMember && <ConfirmRemoveModal isOpen={!!removingMember} onClose={() => setRemovingMember(null)} memberName={removingMember.name} onConfirm={() => { onRemoveMember(removingMember.id); setRemovingMember(null); }} />}
      {awardingMember && <AwardAchievementModal isOpen={!!awardingMember} onClose={() => setAwardingMember(null)} member={awardingMember} allAchievements={team.achievements || []} onSave={handleSaveAwards} />}
      {viewingMember && <TeamMemberProfileModal isOpen={!!viewingMember} onClose={() => setViewingMember(null)} member={viewingMember} allAchievements={team.achievements || []} />}
      {isResetModalOpen && (
        <ConfirmResetModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            onConfirm={handleConfirmReset}
            teamName={team.name}
        />
      )}
      {isDeleteTeamModalOpen && (
        <ConfirmDeleteTeamModal 
            isOpen={isDeleteTeamModalOpen}
            onClose={() => setIsDeleteTeamModalOpen(false)}
            onConfirm={handleConfirmDeleteTeam}
            teamName={team.name}
        />
      )}
    </div>
  );
};
