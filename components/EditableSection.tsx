import React, { useState, useEffect } from 'react';

interface EditableSectionProps {
  title: string;
  content: string;
  onSave: (newContent: string) => void;
  placeholder: string;
  isTextarea?: boolean;
}

export const EditableSection: React.FC<EditableSectionProps> = ({ title, content, onSave, placeholder, isTextarea = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(content);

  useEffect(() => {
    setCurrentValue(content);
  }, [content]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setCurrentValue(content);
    setIsEditing(false);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-sm text-blue-600 hover:underline">
                Edit
            </button>
        )}
      </div>
      {isEditing ? (
        <div>
          {isTextarea ? (
             <textarea
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
          ) : (
             <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder={placeholder}
                className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={handleCancel} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleSave} className="px-3 py-1 bg-brand-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-sm whitespace-pre-wrap min-h-[40px]">
          {content || <span className="italic text-gray-400">{placeholder}</span>}
        </p>
      )}
    </div>
  );
};