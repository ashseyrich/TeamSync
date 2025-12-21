
import React, { useState, useMemo } from 'react';
import type { Team, TeamMember, Child } from '../types.ts';
import { ChildProfileModal } from './ChildProfileModal.tsx';
import { hasPermission } from '../utils/permissions.ts';
import { Avatar } from './Avatar.tsx';

interface ChildrenViewProps {
    team: Team;
    currentUser: TeamMember;
    onAddChild: (childData: Omit<Child, 'id' | 'status' | 'lastCheckIn' | 'lastCheckOut'>) => void;
    onUpdateChild: (child: Child) => void;
    onDeleteChild: (childId: string) => void;
    onCheckIn: (childId: string) => void;
    onCheckOut: (childId: string) => void;
}

const ChildCard: React.FC<{ 
    child: Child, 
    onEdit: () => void, 
    onDelete: () => void,
    onCheckIn: () => void, 
    onCheckOut: () => void,
    isAdmin: boolean
}> = ({ child, onEdit, onDelete, onCheckIn, onCheckOut, isAdmin }) => {
    const isCheckedIn = child.status === 'checked-in';

    const calculateAge = (birthday: Date | string) => {
        const bday = typeof birthday === 'string' ? new Date(birthday) : birthday;
        const ageDifMs = Date.now() - bday.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const ageDisplay = child.birthday ? calculateAge(child.birthday) : child.age;
    
    return (
        <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 flex flex-col justify-between ${isCheckedIn ? 'border-green-500' : 'border-gray-300'}`}>
            <div className="flex justify-between items-start">
                <div onClick={onEdit} className="cursor-pointer flex gap-3 flex-grow">
                    <Avatar avatarUrl={child.avatarUrl} name={child.name} sizeClassName="w-12 h-12 flex-shrink-0" />
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-800 truncate">{child.name}</h3>
                        <p className="text-sm text-gray-600">
                            <span>Age: {ageDisplay || '?'}</span>
                            {(ageDisplay || child.grade) && <span> • </span>}
                            {child.grade && <span>Grade: {child.grade}</span>}
                        </p>
                        {child.medicalNotes && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full mt-1 font-semibold truncate max-w-full">
                                ⚠️ {child.medicalNotes}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {isCheckedIn ? 'Checked In' : 'Checked Out'}
                    </span>
                     {child.lastCheckIn && (
                        <div className="text-right mt-1">
                            <p className="text-[10px] text-gray-400 font-medium">
                                {new Date(isCheckedIn ? child.lastCheckIn : child.lastCheckOut!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            {child.lastProcessedByName && (
                                <p className="text-[9px] text-gray-400 italic">By {child.lastProcessedByName}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                     <div className="text-xs text-gray-500">
                         <p className="font-semibold">{child.guardianName}</p>
                         <p>{child.guardianPhone}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        {isAdmin && (
                             <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-xs font-semibold">
                                Delete
                            </button>
                        )}
                        <button
                            onClick={isCheckedIn ? onCheckOut : onCheckIn}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm text-white transition-colors ${isCheckedIn ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isCheckedIn ? 'Check Out' : 'Check In'}
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export const ChildrenView: React.FC<ChildrenViewProps> = ({ team, currentUser, onAddChild, onUpdateChild, onDeleteChild, onCheckIn, onCheckOut }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'checked-in' | 'checked-out'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);

    const isAdmin = hasPermission(currentUser, 'admin');
    const children = team.children || [];

    const filteredChildren = useMemo(() => {
        return children.filter(child => {
            const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  child.guardianName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filter === 'all' || child.status === filter;
            return matchesSearch && matchesFilter;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [children, searchTerm, filter]);

    const handleSaveChild = (childData: Omit<Child, 'id' | 'status' | 'lastCheckIn' | 'lastCheckOut'>) => {
        if (editingChild) {
            onUpdateChild({ ...editingChild, ...childData });
        } else {
            onAddChild(childData);
        }
    };
    
    const handleDelete = (child: Child) => {
        if (window.confirm(`Are you sure you want to delete ${child.name}'s profile? This cannot be undone.`)) {
            onDeleteChild(child.id);
        }
    };

    const openAddModal = () => {
        setEditingChild(null);
        setIsModalOpen(true);
    }

    const openEditModal = (child: Child) => {
        setEditingChild(child);
        setIsModalOpen(true);
    }

    return (
        <div className="space-y-6 p-4 sm:p-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Kids Check-in</h2>
                    <p className="text-gray-600 text-sm">Manage attendance and safety for {team.name}.</p>
                </div>
                <button id="guide-register-child-btn" onClick={openAddModal} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                    Register Child
                </button>
            </div>

            <div id="guide-child-search" className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row gap-4">
                <div className="flex-grow relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search by child or guardian..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                     {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {(['all', 'checked-in', 'checked-out'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-2 rounded-md text-sm font-medium capitalize ${filter === f ? 'bg-brand-light text-brand-primary ring-1 ring-brand-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {f.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChildren.length > 0 ? (
                    filteredChildren.map(child => (
                        <ChildCard 
                            key={child.id} 
                            child={child} 
                            onEdit={() => openEditModal(child)}
                            onDelete={() => handleDelete(child)}
                            onCheckIn={() => onCheckIn(child.id)}
                            onCheckOut={() => onCheckOut(child.id)}
                            isAdmin={isAdmin}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-500 italic">
                        {searchTerm ? 'No children found matching your search.' : 'No children registered yet.'}
                    </div>
                )}
            </div>

            <ChildProfileModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                child={editingChild} 
                onSave={handleSaveChild}
                currentUser={currentUser}
            />
        </div>
    );
};
