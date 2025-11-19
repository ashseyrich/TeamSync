import React, { useState, useRef } from 'react';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Image: string) => void;
}

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (preview) {
      onSave(preview);
      onClose();
      // Reset state for next time
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedFile(null);
    setPreview(null);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Change Profile Picture</h2>
        </div>
        <div className="p-6">
          <div className="w-48 h-48 mx-auto rounded-full bg-gray-100 border-2 border-dashed flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <p className="text-sm text-gray-500">Image Preview</p>
            )}
          </div>
          <div className="mt-4">
            <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
              {selectedFile ? 'Change Image' : 'Select Image'}
            </button>
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} disabled={!selectedFile} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400">
            Save Picture
          </button>
        </div>
      </div>
    </div>
  );
};