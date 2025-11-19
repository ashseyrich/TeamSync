import React, { useState, useEffect } from 'react';
import type { FaqItem } from '../types.ts';

interface AddEditFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: FaqItem) => void;
  faqToEdit?: FaqItem | null;
}

export const AddEditFaqModal: React.FC<AddEditFaqModalProps> = ({ isOpen, onClose, onSave, faqToEdit }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (faqToEdit) {
            setQuestion(faqToEdit.question);
            setAnswer(faqToEdit.answer);
        } else {
            setQuestion('');
            setAnswer('');
        }
    }
  }, [faqToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      alert('Please fill out both the question and answer.');
      return;
    }
    onSave({
      id: faqToEdit?.id || `faq_${Date.now()}`,
      question,
      answer,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{faqToEdit ? 'Edit FAQ' : 'Add New FAQ'}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="faqQuestion" className="block text-sm font-medium text-gray-700">Question</label>
            <input
              type="text"
              id="faqQuestion"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="What do I wear on Sunday?"
            />
          </div>
          <div>
            <label htmlFor="faqAnswer" className="block text-sm font-medium text-gray-700">Answer</label>
            <textarea
              id="faqAnswer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="Our dress code is casual..."
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save FAQ</button>
        </div>
      </div>
    </div>
  );
};