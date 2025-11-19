
import React, { useState, useMemo } from 'react';
import type { Team, InventoryItem, TeamMember } from '../types.ts';
import { AddEditInventoryModal } from './AddEditInventoryModal.tsx';
import { hasPermission } from '../utils/permissions.ts';

interface InventoryViewProps {
    team: Team;
    currentUser: TeamMember;
    onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'status'>) => void;
    onUpdateInventoryItem: (item: InventoryItem) => void;
    onDeleteInventoryItem: (itemId: string) => void;
    onCheckOutItem: (itemId: string, memberId: string) => void;
    onCheckInItem: (itemId: string) => void;
}

const statusColors = {
    'available': 'bg-green-100 text-green-800 border-green-200',
    'in-use': 'bg-blue-100 text-blue-800 border-blue-200',
    'maintenance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'lost': 'bg-red-100 text-red-800 border-red-200',
};

export const InventoryView: React.FC<InventoryViewProps> = ({ team, currentUser, onAddInventoryItem, onUpdateInventoryItem, onDeleteInventoryItem, onCheckOutItem, onCheckInItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [checkingOutItem, setCheckingOutItem] = useState<string | null>(null); // itemId
    const [assignToMemberId, setAssignToMemberId] = useState<string>('');

    const isAdmin = hasPermission(currentUser, 'admin');
    const memberMap = useMemo(() => new Map(team.members.map(m => [m.id, m.name])), [team.members]);

    const filteredItems = useMemo(() => {
        return (team.inventory || []).filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [team.inventory, searchTerm]);

    const handleSave = (itemData: Omit<InventoryItem, 'id' | 'status'>) => {
        if (editingItem) {
            onUpdateInventoryItem({ ...editingItem, ...itemData });
        } else {
            onAddInventoryItem(itemData);
        }
    };

    const handleDelete = (item: InventoryItem) => {
        if (window.confirm(`Are you sure you want to delete ${item.name}? This cannot be undone.`)) {
            onDeleteInventoryItem(item.id);
        }
    }

    const handleCheckOut = () => {
        if (checkingOutItem && assignToMemberId) {
            onCheckOutItem(checkingOutItem, assignToMemberId);
            setCheckingOutItem(null);
            setAssignToMemberId('');
        }
    };
    
    const toggleMaintenance = (item: InventoryItem) => {
        const newStatus = item.status === 'maintenance' ? 'available' : 'maintenance';
        onUpdateInventoryItem({ ...item, status: newStatus });
    };

    const toggleLost = (item: InventoryItem) => {
        const newStatus = item.status === 'lost' ? 'available' : 'lost';
        const confirmMsg = newStatus === 'lost' 
            ? `Mark "${item.name}" as LOST?` 
            : `Mark "${item.name}" as FOUND/AVAILABLE?`;
            
        if (window.confirm(confirmMsg)) {
            onUpdateInventoryItem({ ...item, status: newStatus });
        }
    };

    return (
        <div className="p-4 sm:p-0 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Inventory</h2>
                {isAdmin && (
                    <button id="guide-add-item-btn" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">
                        + Add Item
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border relative">
                <input 
                    type="text" 
                    placeholder="Search inventory..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>

            <div id="guide-inventory-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className={`bg-white rounded-lg shadow-md p-4 flex flex-col border-l-4 ${statusColors[item.status].replace('bg-', 'border-')}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-grow mr-2">
                                <h3 className="font-bold text-gray-800 break-words">{item.name}</h3>
                                <p className="text-xs text-gray-500">{item.category}</p>
                            </div>
                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${statusColors[item.status]}`}>
                                {item.status}
                            </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 flex-grow space-y-1 mb-4">
                            {item.serialNumber && <p><span className="font-semibold">SN:</span> {item.serialNumber}</p>}
                            {item.notes && <p className="italic">{item.notes}</p>}
                            {item.assignedTo && (
                                <p className="text-blue-600 font-medium">Assigned to: {memberMap.get(item.assignedTo)}</p>
                            )}
                        </div>

                        <div className="mt-auto border-t pt-3">
                             {isAdmin && (
                                 <div className="flex flex-col gap-2 mb-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-3 text-xs">
                                            <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-gray-500 hover:text-gray-800 underline">Edit</button>
                                            <button onClick={() => handleDelete(item)} className="text-red-400 hover:text-red-600 underline">Delete</button>
                                        </div>
                                    </div>
                                    {(item.status === 'available' || item.status === 'maintenance' || item.status === 'lost') && (
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => toggleMaintenance(item)} className="flex-grow sm:flex-grow-0 text-xs text-yellow-600 hover:underline font-semibold bg-yellow-50 px-2 py-1 rounded border border-yellow-100 text-center">{item.status === 'maintenance' ? 'Mark Fixed' : 'Maintenance'}</button>
                                            <button onClick={() => toggleLost(item)} className={`flex-grow sm:flex-grow-0 text-xs font-semibold px-2 py-1 rounded border text-center ${item.status === 'lost' ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'}`}>
                                                {item.status === 'lost' ? 'Mark Found' : 'Mark Lost'}
                                            </button>
                                        </div>
                                    )}
                                 </div>
                             )}
                            
                             <div className="flex justify-end">
                                {item.status === 'in-use' ? (
                                    <button onClick={() => onCheckInItem(item.id)} className="w-full sm:w-auto px-3 py-1.5 bg-green-100 text-green-800 text-sm font-bold rounded hover:bg-green-200 transition-colors">
                                        Check In
                                    </button>
                                ) : (
                                    item.status === 'available' && (
                                        checkingOutItem === item.id ? (
                                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full animate-fade-in">
                                                <div className="flex w-full gap-2">
                                                    <select 
                                                        value={assignToMemberId} 
                                                        onChange={e => setAssignToMemberId(e.target.value)}
                                                        className="flex-grow py-1 pl-1 pr-8 text-sm border-gray-300 rounded focus:ring-brand-primary focus:border-brand-primary"
                                                        autoFocus
                                                    >
                                                        <option value="">Assign to...</option>
                                                        {team.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                    </select>
                                                    <button onClick={() => setCheckingOutItem(null)} className="px-2 py-1 bg-gray-200 text-gray-600 text-sm rounded hover:bg-gray-300">&times;</button>
                                                </div>
                                                <button onClick={handleCheckOut} disabled={!assignToMemberId} className="w-full sm:w-auto px-3 py-1 bg-brand-primary text-white text-sm rounded disabled:opacity-50">OK</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setCheckingOutItem(item.id)} className="w-full sm:w-auto px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-bold rounded hover:bg-blue-200 transition-colors">
                                                Check Out
                                            </button>
                                        )
                                    )
                                )}
                             </div>
                        </div>
                    </div>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">No items found.</div>
                )}
            </div>
            
            <AddEditInventoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                itemToEdit={editingItem} 
            />
        </div>
    );
};
