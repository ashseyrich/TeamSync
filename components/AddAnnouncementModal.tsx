import React, { useState } from 'react';

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (announcement: { title: string; content: string }, notify: { email: boolean, sms: boolean, push: boolean }) => void;
}

export const AddAnnouncementModal: React.FC<AddAnnouncementModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notify, setNotify] = useState({ email: false, sms: false, push: true });

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide a title and content for the announcement.');
      return;
    }
    onSave({ title, content }, notify);
    setTitle('');
    setContent('');
    setNotify({ email: false, sms: false, push: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Add New Announcement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="announcementTitle" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="announcementTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Team Meeting"
            />
          </div>
          <div>
            <label htmlFor="announcementContent" className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              id="announcementContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Mandatory team meeting this Wednesday..."
            />
          </div>
           <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-700">Notify Team Members</h4>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={notify.push} onChange={e => setNotify(p => ({...p, push: e.target.checked}))} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                    <span className="text-sm text-gray-700">Send Push Notification</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={notify.email} onChange={e => setNotify(p => ({...p, email: e.target.checked}))} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                    <span className="text-sm text-gray-700">Send via Email</span>
                </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={notify.sms} onChange={e => setNotify(p => ({...p, sms: e.target.checked}))} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                    <span className="text-sm text-gray-700">Send via SMS</span>
                </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Push notifications are sent to members who have enabled them. Email/SMS is sent to members who have provided contact info.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Post Announcement</button>
        </div>
      </div>
    </div>
  );
};