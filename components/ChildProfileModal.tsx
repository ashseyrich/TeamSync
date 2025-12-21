
import React, { useState, useEffect, useRef } from 'react';
import type { Child, TeamMember, TeacherNote, CheckInLogEntry } from '../types.ts';
import { Avatar } from './Avatar.tsx';

interface ChildProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    child: Child | null;
    onSave: (childData: Omit<Child, 'id' | 'status' | 'lastCheckIn' | 'lastCheckOut'>) => void;
    currentUser?: TeamMember;
}

export const ChildProfileModal: React.FC<ChildProfileModalProps> = ({ isOpen, onClose, child, onSave, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'notes' | 'history'>('profile');
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [age, setAge] = useState('');
    const [birthday, setBirthday] = useState('');
    const [grade, setGrade] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [medicalNotes, setMedicalNotes] = useState('');
    const [notes, setNotes] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Teacher Notes state
    const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    
    const checkInHistory = child?.checkInHistory || [];

    useEffect(() => {
        if (isOpen) {
            setActiveTab('profile');
            if (child) {
                setName(child.name);
                setAvatarUrl(child.avatarUrl);
                setAge(child.age || '');
                setBirthday(child.birthday ? (child.birthday instanceof Date ? child.birthday : new Date(child.birthday)).toISOString().split('T')[0] : '');
                setGrade(child.grade || '');
                setGuardianName(child.guardianName);
                setGuardianPhone(child.guardianPhone);
                setMedicalNotes(child.medicalNotes || '');
                setNotes(child.notes || '');
                setTeacherNotes(child.teacherNotes || []);
            } else {
                setName('');
                setAvatarUrl(undefined);
                setAge('');
                setBirthday('');
                setGrade('');
                setGuardianName('');
                setGuardianPhone('');
                setMedicalNotes('');
                setNotes('');
                setTeacherNotes([]);
            }
        }
    }, [isOpen, child]);

    if (!isOpen) return null;

    const handleAddNote = () => {
        if (!newNoteContent.trim() || !currentUser) return;
        const newNote: TeacherNote = {
            id: `note_${Date.now()}`,
            content: newNoteContent.trim(),
            authorName: currentUser.name,
            date: new Date()
        };
        setTeacherNotes(prev => [newNote, ...prev]);
        setNewNoteContent('');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
            setAvatarUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            avatarUrl,
            age,
            birthday: birthday ? new Date(birthday) : undefined,
            grade,
            guardianName,
            guardianPhone,
            medicalNotes,
            notes,
            teacherNotes
        });
        onClose();
    };
    
    const calculatedAge = birthday ? Math.abs(new Date(Date.now() - new Date(birthday).getTime()).getUTCFullYear() - 1970) : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">{child ? 'Edit Child Profile' : 'Register New Child'}</h2>
                    {child && (
                        <div className="flex mt-4 border-b">
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'profile' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                Profile
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'notes' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                Observations
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('history')}
                            >
                                Log
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    <div className="p-6">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative">
                                        <Avatar avatarUrl={avatarUrl} name={name || 'Child'} sizeClassName="w-24 h-24 text-4xl" />
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 bg-brand-primary text-white rounded-full p-1.5 hover:bg-brand-primary-dark border-2 border-white shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Tap to upload photo</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Child's Name</label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full input-style" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Birthday</label>
                                        <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="mt-1 block w-full input-style" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Grade</label>
                                        <input type="text" value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 block w-full input-style" />
                                    </div>
                                </div>
                                {birthday && <p className="text-xs text-gray-500">Calculated Age: {calculatedAge}</p>}
                                
                                {!birthday && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Age (Manual Override)</label>
                                        <input type="text" value={age} onChange={e => setAge(e.target.value)} className="mt-1 block w-full input-style" placeholder="Use if birthday is unknown" />
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">Guardian Info</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                                            <input type="text" required value={guardianName} onChange={e => setGuardianName(e.target.value)} className="mt-1 block w-full input-style" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                            <input type="tel" required value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} className="mt-1 block w-full input-style" />
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">Medical & Notes</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Allergies / Medical Notes</label>
                                        <textarea value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} rows={2} className="mt-1 block w-full input-style" placeholder="e.g., Peanuts, Dairy" />
                                    </div>
                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700">Other Notes</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full input-style" placeholder="Authorized pick-up, etc." />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Profile</button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'notes' && (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
                                    <p className="text-sm text-yellow-800">Use this section to track the child's spiritual growth, behavior improvements, and general observations over time.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Add New Observation</label>
                                    <textarea 
                                        value={newNoteContent} 
                                        onChange={e => setNewNoteContent(e.target.value)} 
                                        rows={3} 
                                        className="mt-1 block w-full input-style" 
                                        placeholder="Today I noticed..." 
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAddNote}
                                        disabled={!newNoteContent.trim()}
                                        className="mt-2 px-3 py-1.5 bg-brand-secondary text-white text-sm font-semibold rounded-md shadow-sm hover:bg-brand-secondary-dark disabled:bg-gray-300"
                                    >
                                        Add Note
                                    </button>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-700 mb-3">History</h4>
                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                        {teacherNotes.length > 0 ? teacherNotes.map(note => (
                                            <div key={note.id} className="relative pl-4 border-l-2 border-gray-200">
                                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {new Date(note.date).toLocaleDateString()} • <span className="font-medium text-gray-700">{note.authorName}</span>
                                                </p>
                                                <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded-md">
                                                    {note.content}
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-gray-500 italic">No observations recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-800 border-b pb-2">Full Check-in History</h4>
                                <div className="space-y-3">
                                    {checkInHistory.length > 0 ? checkInHistory.map((entry) => (
                                        <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full border ${entry.type === 'in' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                                                    {entry.type === 'in' ? 'Check In' : 'Check Out'}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Processed by {entry.processedByName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 text-gray-500 italic">
                                            No check-in history found for this child.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
