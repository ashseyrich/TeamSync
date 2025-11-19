
import React from 'react';
// FIX: Corrected import path for types module by adding file extension.
import { Proficiency } from '../types.ts';

interface SkillBadgeProps {
  skillName: string;
  proficiency: Proficiency;
}

const proficiencyColors: Record<Proficiency, string> = {
  [Proficiency.TRAINEE]: 'bg-gray-200 text-gray-800',
  [Proficiency.NOVICE]: 'bg-blue-200 text-blue-800',
  [Proficiency.SOLO_OPERATOR]: 'bg-green-200 text-green-800',
  [Proficiency.MASTER_TRAINER]: 'bg-purple-200 text-purple-800',
};

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skillName, proficiency }) => {
  return (
    <div className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center ${proficiencyColors[proficiency]}`}>
      {skillName}
    </div>
  );
};