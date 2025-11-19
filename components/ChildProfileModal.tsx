
import React, { useState, useEffect } from 'react';
import type { Child, TeamMember, TeacherNote } from '../types.ts';

interface ChildProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    child: Child | null;
    onSave: (childData: Omit<Child, 'id' | 'status' | 'lastCheckIn' | 'lastCheckOut' | 'checkedInBy'>) => void;
    currentUser?: TeamMember;
}

export const ChildProfileModal: React.FC<ChildProfileModalProps> = ({ isOpen, onClose, child, onSave, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'notes'>('profile');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [birthday, setBirthday] = useState('');
    const [grade, setGrade] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [medicalNotes, setMedicalNotes] = useState('');
    const [notes, setNotes] = useState('');
    
    // Teacher Notes state
    const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveTab('profile');
            if (child) {
                setName(child.name);
                setAge(child.age || '');
                setBirthday(child.birthday ? child.birthday.toISOString().split('T')[0] : '');
                setGrade(child.grade || '');
                setGuardianName(child.guardianName);
                setGuardianPhone(child.guardianPhone);
                setMedicalNotes(child.medicalNotes || '');
                setNotes(child.notes || '');
                setTeacherNotes(child.teacherNotes || []);
            } else {
                setName('');
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
        setTeacherNotes(prev => [newNote, ...prev]); // Add to top
        setNewNoteContent('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
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
                                Profile Info
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'notes' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                Growth & Observations
                            </button>
                        </div>
                    )}
                </div>
                
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        {activeTab === 'profile' && (
                            <>
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
                            </>
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
                    </div>
                    
                    <div className="p-6 bg-gray-50 flex justify-end gap-2 border-t">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                         <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Profile</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
