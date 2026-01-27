
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
  const [editingChecklistIndex, setEditingChecklistIndex] = useState<number | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRoles(JSON.parse(JSON.stringify(allRoles)));
    }
  }, [allRoles, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (index: number, field: keyof Role, value: any) => {
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
    setRoles([...roles, { id: genId(), name: '', defaultChecklist: [] }]);
  };

  const handleRemoveRole = (id: string) => {
    setRoles(roles.filter(role => role.id !== id));
  };
  
  const handleAddChecklistItem = (index: number) => {
      if (!newChecklistItem.trim()) return;
      const updatedRoles = [...roles];
      const currentList = updatedRoles[index].defaultChecklist || [];
      updatedRoles[index] = { ...updatedRoles[index], defaultChecklist: [...currentList, newChecklistItem.trim()] };
      setRoles(updatedRoles);
      setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (roleIndex: number, itemIndex: number) => {
      const updatedRoles = [...roles];
      const currentList = [...(updatedRoles[roleIndex].defaultChecklist || [])];
      currentList.splice(itemIndex, 1);
      updatedRoles[roleIndex] = { ...updatedRoles[roleIndex], defaultChecklist: currentList };
      setRoles(updatedRoles);
  };

  const handleSaveChanges = () => {
    const validRoles = roles.filter(role => role.name.trim() !== '');
    onSave(validRoles);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl m-4 flex flex-col h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Role Definitions & Ready Checks</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6 mb-6 flex-grow overflow-y-auto pr-2 -mr-2">
          {roles.map((role, index) => (
            <div key={role.id} className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm transition-all hover:border-brand-primary/20">
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                <div className="flex-grow w-full sm:w-auto">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Role Name</label>
                    <input
                    type="text"
                    value={role.name}
                    onChange={e => handleRoleChange(index, 'name', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm font-bold"
                    placeholder="e.g., FOH Engineer"
                    />
                </div>
                <div className="w-full sm:w-1/4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Required Skill</label>
                    <select
                    value={role.requiredSkillId || 'none'}
                    onChange={e => handleRoleChange(index, 'requiredSkillId', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-lg font-medium"
                    >
                    <option value="none">Open Access</option>
                    {allSkills.map(skill => (
                        <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                    </select>
                </div>
                {departments.length > 0 && (
                    <div className="w-full sm:w-1/4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Department</label>
                        <select
                        value={role.departmentId || 'none'}
                        onChange={e => handleRoleChange(index, 'departmentId', e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-lg font-medium"
                        >
                        <option value="none">Unassigned</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                        </select>
                    </div>
                )}
                <button onClick={() => handleRemoveRole(role.id)} className="text-red-300 hover:text-red-500 mt-6 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              {/* Individual Checklist Section */}
              <div className="bg-gray-50/50 rounded-lg p-3 border border-dashed">
                  <div className="flex justify-between items-center mb-2">
                      <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Ready Check Requirements</h4>
                      <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{role.defaultChecklist?.length || 0} Tasks</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                      {(role.defaultChecklist || []).map((task, taskIdx) => (
                          <div key={taskIdx} className="flex items-center gap-1 bg-white border rounded-full px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm group">
                              {task}
                              <button onClick={() => handleRemoveChecklistItem(index, taskIdx)} className="text-gray-300 hover:text-red-500 group-hover:text-gray-500">&times;</button>
                          </div>
                      ))}
                  </div>

                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editingChecklistIndex === index ? newChecklistItem : ''}
                        onChange={(e) => { setEditingChecklistIndex(index); setNewChecklistItem(e.target.value); }}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem(index)}
                        placeholder="Add preparation task (e.g. Test all mics)"
                        className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-brand-primary"
                      />
                      <button 
                        onClick={() => handleAddChecklistItem(index)}
                        className="px-4 py-1.5 bg-brand-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-brand-primary-dark"
                      >
                        Add
                      </button>
                  </div>
              </div>
            </div>
          ))}
           <button onClick={handleAddRole} className="w-full text-center py-4 border-2 border-dashed border-gray-300 text-gray-500 font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all">
                + Define New Role
            </button>
        </div>

        <div className="flex justify-end gap-2 mt-auto border-t pt-6">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={handleSaveChanges} className="px-8 py-2 bg-brand-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-brand-primary-dark transition-all">Save All Changes</button>
        </div>
      </div>
    </div>
  );
};
