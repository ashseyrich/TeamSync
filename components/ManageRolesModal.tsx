
import React, { useState, useEffect } from 'react';
import type { Role, Skill, Department } from '../types.ts';

const genId = () => `new_${Math.random().toString(36).substr(2, 9)}`;

interface ManageRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRoles: Role[];
  allSkills: Skill[];
  departments?: Department[];
  onSave: (roles: Role[]) => void;
}

export const ManageRolesModal: React.FC<ManageRolesModalProps> = ({ isOpen, onClose, allRoles, allSkills, departments = [], onSave }) => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    // Deep copy to avoid mutating props
    if (isOpen) {
      setRoles(JSON.parse(JSON.stringify(allRoles)));
    }
  }, [allRoles, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (index: number, field: keyof Role, value: string) => {
    const updatedRoles = [...roles];
    if ((field === 'requiredSkillId' || field === 'departmentId') && value === 'none') {
        const role = { ...updatedRoles[index] };
        delete role[field];
        updatedRoles[index] = role;
    } else {
        updatedRoles[index] = { ...updatedRoles[index], [field]: value };
    }
    setRoles(updatedRoles);
  };
  
  const handleAddRole = () => {
    setRoles([...roles, { id: genId(), name: '' }]);
  };

  const handleRemoveRole = (id: string) => {
    setRoles(roles.filter(role => role.id !== id));
  };
  
  const handleSaveChanges = () => {
    // Filter out empty roles before saving
    const validRoles = roles.filter(role => role.name.trim() !== '');
    onSave(validRoles);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Roles</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
          {roles.map((role, index) => (
            <div key={role.id} className="p-3 bg-gray-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-gray-200">
              <div className="flex-grow w-full sm:w-auto">
                 <label className="text-xs font-medium text-gray-500">Role Name</label>
                <input
                  type="text"
                  value={role.name}
                  onChange={e => handleRoleChange(index, 'name', e.target.value)}
                  className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  placeholder="e.g., Audio Engineer"
                />
              </div>
               <div className="w-full sm:w-1/4">
                 <label className="text-xs font-medium text-gray-500">Required Skill</label>
                <select
                  value={role.requiredSkillId || 'none'}
                  onChange={e => handleRoleChange(index, 'requiredSkillId', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                  <option value="none">None</option>
                  {allSkills.map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>
              {departments.length > 0 && (
                  <div className="w-full sm:w-1/4">
                    <label className="text-xs font-medium text-gray-500">Department</label>
                    <select
                      value={role.departmentId || 'none'}
                      onChange={e => handleRoleChange(index, 'departmentId', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                    >
                      <option value="none">None</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
              )}
              <button onClick={() => handleRemoveRole(role.id)} className="text-red-500 hover:text-red-700 mt-2 sm:mt-6 align-self-end">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
           <button onClick={handleAddRole} className="w-full text-center px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 hover:border-gray-400">
                + Add New Role
            </button>
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSaveChanges} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Roles</button>
        </div>
      </div>
    </div>
  );
};
