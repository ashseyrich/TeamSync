
import React, { useState, useEffect } from 'react';
import type { Department } from '../types.ts';

interface ManageDepartmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export const ManageDepartmentsModal: React.FC<ManageDepartmentsModalProps> = ({ isOpen, onClose, departments, onAdd, onRemove }) => {
  const [newDeptName, setNewDeptName] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
      if (newDeptName.trim()) {
          onAdd(newDeptName.trim());
          setNewDeptName('');
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Departments</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            {departments.length === 0 && <p className="text-gray-500 italic">No departments defined. Use departments to group roles (e.g., Audio, Video, Lighting).</p>}
            {departments.map((dept) => (
                <div key={dept.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                    <span className="font-medium text-gray-800">{dept.name}</span>
                    <button onClick={() => onRemove(dept.id)} className="text-red-500 hover:text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>

        <div className="flex gap-2 border-t pt-4">
            <input 
                type="text" 
                value={newDeptName} 
                onChange={e => setNewDeptName(e.target.value)} 
                placeholder="New Department Name" 
                className="flex-grow block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
            <button onClick={handleAdd} className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark">Add</button>
        </div>
        
        <div className="flex justify-end mt-4">
             <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};
