
import React, { useState } from 'react';
import type { InventoryItem, Team } from '../types.ts';
import { BarcodeDisplay } from './BarcodeDisplay.tsx';

interface PrintLabelModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: InventoryItem[];
    team: Team;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({ isOpen, onClose, items, team }) => {
    const [propertyName, setPropertyName] = useState(team.name);
    const [footerNote, setFooterNote] = useState('DO NOT REMOVE FROM FACILITY');
    
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[250] p-4 print:p-0 print:bg-white">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden !important; }
                    #printable-area, #printable-area * { visibility: visible !important; }
                    #printable-area { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .label-item {
                        page-break-after: always;
                        page-break-inside: avoid;
                        margin-bottom: 0;
                        border: none !important;
                    }
                }
            `}} />
            
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-fade-in-up print:hidden h-full max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase italic">Label Station</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Batch Asset Tagging</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-8 flex flex-col items-center">
                        {/* Configuration Area */}
                        <div className="w-full max-w-md bg-brand-light p-5 rounded-2xl border border-brand-primary/10 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-brand-primary tracking-widest mb-2">Custom "Property Of" Name</label>
                                <input 
                                    type="text"
                                    value={propertyName}
                                    onChange={(e) => setPropertyName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold focus:ring-brand-primary"
                                    placeholder="Organization Name"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-brand-primary tracking-widest mb-2">Footer Warning / Note</label>
                                <input 
                                    type="text"
                                    value={footerNote}
                                    onChange={(e) => setFooterNote(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold focus:ring-brand-primary uppercase"
                                    placeholder="e.g. DO NOT REMOVE"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-6 w-full max-w-md">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Preview ({items.length} Tags)</p>
                            
                            {/* Scrollable Preview */}
                            <div className="space-y-4 w-full">
                                {items.map((item, idx) => (
                                    <div 
                                        key={item.id} 
                                        className="w-full aspect-[2/1] border-2 border-black p-4 flex flex-col justify-between bg-white text-black relative"
                                    >
                                        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-brand-primary border-2 border-white text-[10px] font-black flex items-center justify-center text-white shadow-lg z-10">{idx + 1}</div>
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <h3 className="font-black text-lg uppercase leading-none truncate max-w-[200px]">{item.name}</h3>
                                                <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">{item.category}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-[8px] font-black uppercase">Property of</p>
                                                <p className="text-[10px] font-black uppercase text-brand-primary truncate max-w-[120px]">{propertyName}</p>
                                            </div>
                                        </div>

                                        <div className="flex-grow flex items-center justify-center py-2">
                                            <div className="w-full">
                                                <BarcodeDisplay value={item.barcode || item.id} />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end border-t border-black pt-1">
                                            <p className="text-[7px] font-bold uppercase tracking-tighter italic">{footerNote || 'ASSET TRACKING'}</p>
                                            <p className="text-[7px] font-black uppercase">ID: {item.id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Print Logic Area */}
                <div id="printable-area" className="hidden print:block">
                    {items.map((item) => (
                        <div 
                            key={item.id} 
                            className="label-item w-full aspect-[2/1] p-4 flex flex-col justify-between bg-white text-black"
                            style={{ width: '4in', height: '2in' }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-xl uppercase leading-none truncate">{item.name}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{item.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase">Property of</p>
                                    <p className="text-[12px] font-black uppercase text-black">{propertyName}</p>
                                </div>
                            </div>

                            <div className="flex-grow flex items-center justify-center py-2">
                                <div className="w-full">
                                    <BarcodeDisplay value={item.barcode || item.id} />
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-black pt-1">
                                <p className="text-[9px] font-bold uppercase tracking-tighter italic">{footerNote || 'ASSET TRACKING'}</p>
                                <p className="text-[9px] font-black uppercase">ID: {item.id}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-gray-50 flex flex-col gap-4 border-t flex-shrink-0">
                    <button 
                        onClick={handlePrint}
                        className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-brand-primary-dark transition-all transform active:scale-95 flex items-center justify-center gap-3"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print {items.length} {items.length === 1 ? 'Tag' : 'Tags'}
                    </button>
                    <button onClick={onClose} className="text-[10px] font-black uppercase text-gray-500 hover:text-gray-700 tracking-widest text-center">Abort and Return</button>
                </div>
            </div>
        </div>
    );
};
