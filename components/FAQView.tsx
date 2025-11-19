import React, { useState, useMemo } from 'react';
import type { Team, TeamMember, FaqItem } from '../types.ts';
import { hasPermission } from '../utils/permissions.ts';
import { AddEditFaqModal } from './AddEditFaqModal.tsx';

interface FAQViewProps {
  team: Team;
  currentUser: TeamMember;
  onAddFaqItem: (item: FaqItem) => void;
  onUpdateFaqItem: (item: FaqItem) => void;
  onDeleteFaqItem: (itemId: string) => void;
}

const SUGGESTED_FAQS: Omit<FaqItem, 'id'>[] = [
    {
        question: "What is the dress code for serving on Sunday?",
        answer: "Our standard dress code is 'all black'. This includes black shirts, black pants/jeans (no rips), and black shoes. This helps us remain unseen on stage and in the background."
    },
    {
        question: "What should I do if I'm running late for my call time?",
        answer: "If you are running late, please send a text message to your team lead or the service producer as soon as possible. Their contact information can be found in the Team view."
    },
    {
        question: "How are training and development handled?",
        answer: "We offer regular training sessions for various roles. Keep an eye on the announcements for upcoming dates. You can also request one-on-one training with a Master/Trainer for your specific role by speaking with your team lead."
    },
    {
        question: "Can I get a copy of the service recording for my portfolio?",
        answer: "Yes, you can request specific clips or full recordings. Please contact the team administrator with the date of the service and the specific parts you need."
    }
];

const FAQItemDisplay: React.FC<{ 
  faq: FaqItem, 
  isOpen: boolean, 
  onClick: () => void,
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ faq, isOpen, onClick, isAdmin, onEdit, onDelete }) => (
  <div className="border-b">
    <div
      className="flex justify-between items-center w-full py-4 text-left cursor-pointer"
      onClick={onClick}
    >
      <span className="font-semibold text-gray-800 pr-4">{faq.question}</span>
      <div className="flex items-center gap-4 flex-shrink-0">
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-xs text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        )}
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    {isOpen && (
      <div className="pb-4 text-gray-600 whitespace-pre-wrap">
        {faq.answer}
      </div>
    )}
  </div>
);

export const FAQView: React.FC<FAQViewProps> = ({ team, currentUser, onAddFaqItem, onUpdateFaqItem, onDeleteFaqItem }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);

    const isAdmin = hasPermission(currentUser, 'admin');
    const faqs = team.faqs || [];
    
    const availableSuggestions = useMemo(() => {
        const existingQuestions = new Set(faqs.map(f => f.question));
        return SUGGESTED_FAQS.filter(s => !existingQuestions.has(s.question));
    }, [faqs]);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleOpenAddModal = () => {
        setEditingFaq(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (faq: FaqItem) => {
        setEditingFaq(faq);
        setIsModalOpen(true);
    };

    const handleDelete = (faq: FaqItem) => {
        if (window.confirm(`Are you sure you want to delete the question: "${faq.question}"?`)) {
            onDeleteFaqItem(faq.id);
        }
    };
    
    const handleSaveFaq = (item: FaqItem) => {
        if (editingFaq) {
            onUpdateFaqItem(item);
        } else {
            onAddFaqItem(item);
        }
    };

    const handleAddSuggestion = (suggestion: Omit<FaqItem, 'id'>) => {
        onAddFaqItem({
            ...suggestion,
            id: `faq_${Date.now()}`
        });
    };

    return (
        <div className="p-4 sm:p-0 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
                </div>
                 <div className="flex items-center gap-4">
                    {isAdmin && (
                        <button 
                            id="guide-add-faq-btn"
                            onClick={handleOpenAddModal}
                            className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark"
                        >
                            Add FAQ
                        </button>
                    )}
                </div>
            </div>

            {isAdmin && availableSuggestions.length > 0 && (
                <div id="guide-suggested-faqs" className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800">Suggested FAQs</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4">Quickly add answers to common questions for your team.</p>
                    <div className="space-y-3">
                        {availableSuggestions.map((suggestion, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-start gap-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800">{suggestion.question}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{suggestion.answer}</p>
                                </div>
                                <button
                                    onClick={() => handleAddSuggestion(suggestion)}
                                    className="px-3 py-1 bg-brand-secondary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark flex-shrink-0"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div id="guide-faq-list" className="bg-white p-6 rounded-lg shadow-md">
                <div>
                    {faqs.length > 0 ? faqs.map((faq, index) => (
                        <FAQItemDisplay 
                            key={faq.id}
                            faq={faq}
                            isOpen={openIndex === index}
                            onClick={() => handleToggle(index)}
                            isAdmin={isAdmin}
                            onEdit={() => handleOpenEditModal(faq)}
                            onDelete={() => handleDelete(faq)}
                        />
                    )) : (
                        <p className="text-center text-gray-500 py-8">No FAQs have been added yet.</p>
                    )}
                </div>
            </div>
            <AddEditFaqModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveFaq}
                faqToEdit={editingFaq}
            />
        </div>
    );
};