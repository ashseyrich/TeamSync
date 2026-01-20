import React, { useState, useEffect } from 'react';
import type { TeamMember } from '../types.ts';

interface EditPersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  onSave: (updatedMember: TeamMember) => void;
}

export const EditPersonalInfoModal: React.FC<EditPersonalInfoModalProps> = ({ isOpen, onClose, member, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    pronouns: '',
    email: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: member.name || '',
        pronouns: member.pronouns || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || ''
      });
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Name is required.');
      return;
    }
    onSave({
      ...member,
      ...formData
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 flex flex-col animate-fade-in-up">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Edit Personal Information</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-style"
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="pronouns" className="block text-sm font-bold text-gray-700">Pronouns (Optional)</label>
            <input
              type="text"
              id="pronouns"
              name="pronouns"
              value={formData.pronouns}
              onChange={handleChange}
              className="input-style"
              placeholder="e.g., she/her"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-style"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-bold text-gray-700">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="input-style"
              placeholder="(555) 000-0000"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};