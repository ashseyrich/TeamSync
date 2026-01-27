
import React, { useState, useEffect } from 'react';
import type { Team } from '../types.ts';

interface ManageCorporateChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onSave: (list: string[]) => void;
}

export const ManageCorporateChecklistModal: React.FC<ManageCorporateChecklistModalProps> = ({ isOpen, onClose, team, onSave }) => {
  const [list, setList] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (isOpen) {
      setList([...(team.corporateChecklist || [])]);
    }
  }, [team.corporateChecklist, isOpen]);

  if (!isOpen) return null;

  const handleAdd = () => {
      if (!newItem.trim()) return;
      setList(prev => [...prev, newItem.trim()]);
      setNewItem('');
  };

  const handleRemove = (idx: number) => {
      setList(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg flex flex-col animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Corporate Checklist</h2>
                <p className="text-sm text-gray-500">Tasks shared by the whole team for every service.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
            {list.length === 0 && <p className="text-center py-8 text-gray-400 italic">No corporate tasks defined.</p>}
            {list.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                    <span className="font-bold text-gray-800">{item}</span>
                    <button onClick={() => handleRemove(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            ))}
        </div>

        <div className="flex gap-2 pt-6 border-t">
            <input 
                type="text" 
                value={newItem} 
                onChange={e => setNewItem(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g., Clear stage litter" 
                className="flex-grow block w-full pl-3 py-3 border-gray-300 rounded-xl focus:ring-brand-primary focus:border-brand-primary text-sm font-bold"
            />
            <button onClick={handleAdd} className="px-6 py-3 bg-brand-secondary text-white font-black uppercase rounded-xl shadow-md hover:bg-brand-secondary-dark transition-all">Add</button>
        </div>
        
        <div className="flex justify-end mt-8 gap-3">
             <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
             <button onClick={() => { onSave(list); onClose(); }} className="px-8 py-2 bg-brand-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-brand-primary-dark">Save Checklist</button>
        </div>
      </div>
    </div>
  );
};
