
import React, { useState, useMemo, useEffect } from 'react';
import type { Team, InventoryItem, TeamMember } from '../types.ts';
import { AddEditInventoryModal } from './AddEditInventoryModal.tsx';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';
import { BarcodeDisplay } from './BarcodeDisplay.tsx';
import { PrintLabelModal } from './PrintLabelModal.tsx';
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

const statusColors: Record<string, string> = {
    'available': 'bg-green-100 text-green-800 border-green-200',
    'in-use': 'bg-blue-100 text-blue-800 border-blue-200',
    'maintenance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'lost': 'bg-red-100 text-red-800 border-red-200',
};

export const InventoryView: React.FC<InventoryViewProps> = ({ team, currentUser, onAddInventoryItem, onUpdateInventoryItem, onDeleteInventoryItem, onCheckOutItem, onCheckInItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [printingItems, setPrintingItems] = useState<InventoryItem[] | null>(null);
    const [checkingOutItem, setCheckingOutItem] = useState<string | null>(null); // itemId
    const [assignToMemberId, setAssignToMemberId] = useState<string>('');
    const [showingBarcodeId, setShowingBarcodeId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isAdmin = hasPermission(currentUser, 'admin');
    const memberMap = useMemo(() => new Map(team.members.map(m => [m.id, m.name])), [team.members]);

    const filteredItems = useMemo(() => {
        return (team.inventory || []).filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [team.inventory, searchTerm]);

    const handleSave = (itemData: Omit<InventoryItem, 'id' | 'status'>) => {
        if (editingItem) {
            onUpdateInventoryItem({ ...editingItem, ...itemData });
        } else {
            onAddInventoryItem(itemData);
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDelete = (item: InventoryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${item.name}? This cannot be undone.`)) {
            onDeleteInventoryItem(item.id);
        }
    }

    const handleCheckOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (checkingOutItem && assignToMemberId) {
            onCheckOutItem(checkingOutItem, assignToMemberId);
            setCheckingOutItem(null);
            setAssignToMemberId('');
        }
    };
    
    const handleScan = (barcode: string) => {
        const item = (team.inventory || []).find(i => i.barcode === barcode || i.id === barcode);
        if (!item) {
            alert(`No item found with barcode: ${barcode}`);
            return;
        }

        if (item.status === 'in-use') {
            onCheckInItem(item.id);
            alert(`Checked in: ${item.name}`);
        } else if (item.status === 'available') {
            setCheckingOutItem(item.id);
            setSearchTerm(item.name); 
            setIsScannerOpen(false);
        } else {
            alert(`${item.name} is currently ${item.status}.`);
        }
        setIsScannerOpen(false);
    };

    const toggleMaintenance = (item: InventoryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = item.status === 'maintenance' ? 'available' : 'maintenance';
        onUpdateInventoryItem({ ...item, status: newStatus });
    };

    const toggleLost = (item: InventoryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = item.status === 'lost' ? 'available' : 'lost';
        if (window.confirm(newStatus === 'lost' ? `Mark "${item.name}" as LOST?` : `Mark "${item.name}" as FOUND?`)) {
            onUpdateInventoryItem({ ...item, status: newStatus });
        }
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkPrint = (e: React.MouseEvent) => {
        e.stopPropagation();
        const itemsToPrint = (team.inventory || []).filter(i => selectedIds.has(i.id));
        if (itemsToPrint.length > 0) {
            setPrintingItems(itemsToPrint);
        }
    };

    const selectAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        const visibleIds = filteredItems.map(i => i.id);
        const allVisibleSelected = visibleIds.every(id => selectedIds.has(id));

        if (allVisibleSelected) {
            const next = new Set(selectedIds);
            visibleIds.forEach(id => next.delete(id));
            setSelectedIds(next);
        } else {
            const next = new Set(selectedIds);
            visibleIds.forEach(id => next.add(id));
            setSelectedIds(next);
        }
    };

    return (
        <div className="p-4 sm:p-0 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Tech Gear Log</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Inventory Management & Tracking</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="flex-grow sm:flex-grow-0 px-6 py-2.5 bg-brand-secondary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-brand-secondary-dark flex items-center justify-center gap-2 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16" /></svg>
                        Scan Barcode
                    </button>
                    {isAdmin && (
                        <button id="guide-add-item-btn" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex-grow sm:flex-grow-0 px-6 py-2.5 bg-brand-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-brand-primary-dark">
                            + Add Item
                        </button>
                    )}
                </div>
            </div>

            {filteredItems.length > 0 && (
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={selectAll}
                            className="text-[10px] font-black uppercase text-gray-500 hover:text-brand-primary tracking-widest flex items-center gap-2"
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filteredItems.every(i => selectedIds.has(i.id)) && filteredItems.length > 0 ? 'bg-brand-primary border-brand-primary' : 'bg-gray-50 border-gray-300'}`}>
                                {filteredItems.every(i => selectedIds.has(i.id)) && filteredItems.length > 0 && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                            </div>
                            Select Page
                        </button>
                        {selectedIds.size > 0 && (
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{selectedIds.size} Selected</span>
                        )}
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="flex gap-2 animate-fade-in">
                            <button 
                                onClick={handleBulkPrint}
                                className="px-4 py-1.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-brand-primary-dark transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Print ({selectedIds.size})
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 relative">
                <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Search name, category, or scan ID..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-10 py-3 border-gray-100 bg-gray-50 rounded-xl focus:ring-brand-primary text-sm font-bold"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-7 flex items-center text-gray-400 hover:text-gray-600">&times;</button>
                )}
            </div>

            <div id="guide-inventory-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => {
                    const colorClass = statusColors[item.status] || 'bg-gray-100 text-gray-800 border-gray-200';
                    const borderColorClass = colorClass.includes('border-') ? colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-gray-200' : 'border-gray-200';
                    const itemBarcode = item.barcode || item.id;
                    const isSelected = selectedIds.has(item.id);
                    
                    return (
                    <div 
                        key={item.id} 
                        onClick={() => toggleSelection(item.id)}
                        className={`bg-white rounded-3xl shadow-xl p-6 flex flex-col border-2 transition-all cursor-pointer relative ${isSelected ? 'border-brand-primary ring-4 ring-brand-primary/10' : borderColorClass} ${item.status === 'in-use' ? 'ring-4 ring-blue-50' : ''}`}
                    >
                        <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary border-brand-primary scale-110 shadow-lg' : 'bg-white border-gray-200'}`}>
                            {isSelected && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                        </div>

                        <div className="flex justify-between items-start mb-4 pl-8">
                            <div className="flex-grow mr-2">
                                <h3 className="font-black text-gray-900 leading-tight uppercase italic">{item.name}</h3>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{item.category}</p>
                            </div>
                            <span className={`flex-shrink-0 px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter border ${colorClass}`}>
                                {item.status}
                            </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 flex-grow space-y-3 mb-6">
                            {item.serialNumber && <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase"><span className="bg-gray-100 px-1.5 py-0.5 rounded">SN</span> {item.serialNumber}</div>}
                            {item.notes && <p className="italic text-gray-500 bg-gray-50 p-2 rounded-lg text-xs leading-relaxed">"{item.notes}"</p>}
                            {item.assignedTo && (
                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 animate-fade-in">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <p className="text-xs font-bold">In possession of: <span className="underline">{memberMap.get(item.assignedTo) || 'Unknown'}</span></p>
                                </div>
                            )}
                        </div>

                        {showingBarcodeId === item.id && (
                            <div className="mb-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                                <BarcodeDisplay value={itemBarcode} />
                                <button onClick={() => setShowingBarcodeId(null)} className="w-full mt-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600">Close Label</button>
                            </div>
                        )}

                        <div className="mt-auto border-t border-gray-100 pt-4" onClick={e => e.stopPropagation()}>
                             <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-4">
                                        <button onClick={(e) => { e.stopPropagation(); setShowingBarcodeId(showingBarcodeId === item.id ? null : item.id); }} className="text-[10px] font-black uppercase text-brand-primary hover:underline tracking-widest">
                                            {showingBarcodeId === item.id ? 'Hide Label' : 'Show Label'}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setPrintingItems([item]); }} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-800 underline tracking-widest">Print Tag</button>
                                        {isAdmin && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsModalOpen(true); }} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-800 underline tracking-widest">Edit</button>
                                                <button onClick={(e) => handleDelete(item, e)} className="text-[10px] font-black uppercase text-red-300 hover:text-red-600 underline tracking-widest">Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {isAdmin && (item.status === 'available' || item.status === 'maintenance' || item.status === 'lost') && (
                                    <div className="flex gap-2">
                                        <button onClick={(e) => toggleMaintenance(item, e)} className="flex-1 text-[9px] font-black uppercase tracking-tighter text-yellow-700 bg-yellow-50 px-2 py-1.5 rounded-lg border border-yellow-200 hover:bg-yellow-100">{item.status === 'maintenance' ? 'Fixed' : 'Maintenance'}</button>
                                        <button onClick={(e) => toggleLost(item, e)} className={`flex-1 text-[9px] font-black uppercase tracking-tighter px-2 py-1.5 rounded-lg border transition-colors ${item.status === 'lost' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {item.status === 'lost' ? 'Found' : 'Lost'}
                                        </button>
                                    </div>
                                )}
                            
                                <div className="mt-2">
                                    {item.status === 'in-use' ? (
                                        <button onClick={(e) => { e.stopPropagation(); onCheckInItem(item.id); }} className="w-full py-3 bg-green-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-green-700 transform active:scale-95 transition-all">
                                            Log Check In
                                        </button>
                                    ) : (
                                        item.status === 'available' && (
                                            checkingOutItem === item.id ? (
                                                <div className="space-y-3 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                                                    <select 
                                                        value={assignToMemberId} 
                                                        onChange={e => setAssignToMemberId(e.target.value)}
                                                        className="w-full py-2 px-3 text-xs border-2 border-brand-primary rounded-xl font-bold focus:ring-0"
                                                        autoFocus
                                                    >
                                                        <option value="">Assign to Operator...</option>
                                                        {team.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                    </select>
                                                    <div className="flex gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); setCheckingOutItem(null); }} className="flex-1 py-2 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-xl">Cancel</button>
                                                        <button onClick={handleCheckOut} disabled={!assignToMemberId} className="flex-[2] py-2 bg-brand-primary text-white text-[10px] font-black uppercase rounded-xl disabled:bg-gray-300">Authorize Gear</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); setCheckingOutItem(item.id); }} className="w-full py-3 bg-brand-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-brand-primary-dark transition-all transform active:scale-95">
                                                    Issue Gear
                                                </button>
                                            )
                                        )
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                )})}
            </div>
            
            <AddEditInventoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                itemToEdit={editingItem} 
            />

            <BarcodeScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />

            {printingItems && (
                <PrintLabelModal 
                    isOpen={!!printingItems}
                    onClose={() => setPrintingItems(null)}
                    items={printingItems}
                    team={team}
                />
            )}
        </div>
    );
};
