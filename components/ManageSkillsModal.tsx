import React, { useState, useEffect } from 'react';
import type { Skill } from '../types.ts';

const genId = () => `new_${Math.random().toString(36).substr(2, 9)}`;

interface ManageSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSkills: Skill[];
  onSave: (skills: Skill[]) => void;
}

export const ManageSkillsModal: React.FC<ManageSkillsModalProps> = ({ isOpen, onClose, allSkills, onSave }) => {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    // Deep copy to avoid mutating props
    if (isOpen) {
      setSkills(JSON.parse(JSON.stringify(allSkills)));
    }
  }, [allSkills, isOpen]);

  if (!isOpen) return null;

  const handleSkillNameChange = (index: number, name: string) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], name };
    setSkills(updatedSkills);
  };
  
  const handleAddSkill = () => {
    setSkills([...skills, { id: genId(), name: '' }]);
  };

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };
  
  const handleSaveChanges = () => {
    // Filter out empty skills before saving
    const validSkills = skills.filter(skill => skill.name.trim() !== '');
    onSave(validSkills);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Skills</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
          {skills.map((skill, index) => (
            <div key={skill.id} className="p-3 bg-gray-50 rounded-lg flex items-center gap-4 border border-gray-200">
              <div className="flex-grow">
                 <label className="text-xs font-medium text-gray-500">Skill Name</label>
                <input
                  type="text"
                  value={skill.name}
                  onChange={e => handleSkillNameChange(index, e.target.value)}
                  className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  placeholder="e.g., Camera Operation"
                />
              </div>
              <button onClick={() => handleRemoveSkill(skill.id)} className="text-red-500 hover:text-red-700 mt-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
           <button onClick={handleAddSkill} className="w-full text-center px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 hover:border-gray-400">
                + Add New Skill
            </button>
        </div>

        <div className="flex justify-end gap-2 mt-auto border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSaveChanges} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Skills</button>
        </div>
      </div>
    </div>
  );
};