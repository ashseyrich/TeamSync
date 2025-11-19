import React, { useState, useMemo } from 'react';
import type { ServiceEvent, TeamMember, Role, Skill } from '../types.ts';
import { Proficiency } from '../types.ts';

interface AssignTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ServiceEvent;
  role: Role;
  teamMembers: TeamMember[];
  skills: Skill[];
  onSave: (memberId: string | null, traineeId: string | null) => void;
}

const getMemberSuitability = (member: TeamMember, requiredSkillId: string | undefined, skills: Skill[]): { score: number; text: string } => {
    if (!requiredSkillId) return { score: 3, text: "No specific skill required" };

    const memberSkill = member.skills.find(s => s.skillId === requiredSkillId);
    if (!memberSkill) return { score: 0, text: "Lacks required skill" };
    
    switch (memberSkill.proficiency) {
        case Proficiency.MASTER_TRAINER: return { score: 5, text: Proficiency.MASTER_TRAINER };
        case Proficiency.SOLO_OPERATOR: return { score: 4, text: Proficiency.SOLO_OPERATOR };
        case Proficiency.NOVICE: return { score: 3, text: Proficiency.NOVICE };
        case Proficiency.TRAINEE: return { score: 2, text: Proficiency.TRAINEE };
        default: return { score: 0, text: "Lacks required skill" };
    }
};

export const AssignTeamModal: React.FC<AssignTeamModalProps> = ({ isOpen, onClose, event, role, teamMembers, skills, onSave }) => {
  const currentAssignment = event.assignments.find(a => a.roleId === role.id);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(currentAssignment?.memberId || null);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(currentAssignment?.traineeId || null);

  const sortedMembers = useMemo(() => {
    return [...teamMembers].sort((a, b) => {
        const suitabilityA = getMemberSuitability(a, role.requiredSkillId, skills);
        const suitabilityB = getMemberSuitability(b, role.requiredSkillId, skills);
        if (suitabilityB.score !== suitabilityA.score) {
            return suitabilityB.score - suitabilityA.score;
        }
        return a.name.localeCompare(b.name);
    });
  }, [teamMembers, role.requiredSkillId, skills]);

  if (!isOpen) return null;
  
  const handleSave = () => {
    onSave(selectedMemberId, selectedTraineeId);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Assign to: <span className="text-brand-primary">{role.name}</span></h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{event.name} on {event.date.toLocaleDateString()}</p>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">Main Assignee</label>
                <select
                    id="assignee"
                    value={selectedMemberId || ''}
                    onChange={(e) => setSelectedMemberId(e.target.value || null)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                    <option value="">Unassigned</option>
                    {sortedMembers.map(member => (
                       <option key={member.id} value={member.id}>
                         {member.name} ({getMemberSuitability(member, role.requiredSkillId, skills).text})
                       </option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="trainee" className="block text-sm font-medium text-gray-700">Trainee (Optional)</label>
                <select
                    id="trainee"
                    value={selectedTraineeId || ''}
                    onChange={(e) => setSelectedTraineeId(e.target.value || null)}
                    disabled={!selectedMemberId}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md disabled:bg-gray-100"
                >
                    <option value="">None</option>
                    {sortedMembers
                        .filter(member => member.id !== selectedMemberId)
                        .map(member => (
                       <option key={member.id} value={member.id}>
                         {member.name} ({getMemberSuitability(member, role.requiredSkillId, skills).text})
                       </option>
                    ))}
                </select>
            </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Assignment</button>
        </div>
      </div>
    </div>
  );
};