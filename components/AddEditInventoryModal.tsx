
import React, { useState, useEffect } from 'react';
import type { InventoryItem } from '../types.ts';

interface AddEditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'status' | 'assignedTo'>) => void;
  itemToEdit?: InventoryItem | null;
}

export const AddEditInventoryModal: React.FC<AddEditInventoryModalProps> = ({ isOpen, onClose, onSave, itemToEdit }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setCategory(itemToEdit.category);
            setSerialNumber(itemToEdit.serialNumber || '');
            setNotes(itemToEdit.notes || '');
        } else {
            setName('');
            setCategory('');
            setSerialNumber('');
            setNotes('');
        }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !category.trim()) {
      alert('Please provide a name and category.');
      return;
    }
    onSave({ name, category, serialNumber, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{itemToEdit ? 'Edit Item' : 'Add Inventory Item'}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Shure SM58 Microphone"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="categories"
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Audio"
            />
            <datalist id="categories">
                <option value="Audio" />
                <option value="Video" />
                <option value="Lighting" />
                <option value="Cables" />
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Serial Number (Optional)</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="Condition, location, etc."
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Item</button>
        </div>
      </div>
    </div>
  );
};
