import React, { useState } from 'react';

interface UploadCustomVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoData: { title: string, description: string, videoUrl: string }) => void;
}

export const UploadCustomVideoModal: React.FC<UploadCustomVideoModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File is too large. Maximum size is 50MB.');
        setSelectedFile(null);
        return;
      }
      setError('');
      setSelectedFile(file);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !selectedFile) {
      setError('Please provide a title and select a video file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onSave({ 
        title, 
        description, 
        videoUrl: reader.result as string 
      });
      // Reset state
      handleClose();
    };
    reader.onerror = () => {
        setError('Failed to read the video file.');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleClose = () => {
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setError('');
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Upload Custom Video</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="videoTitleUpload" className="block text-sm font-medium text-gray-700">Video Title</label>
            <input
              type="text" id="videoTitleUpload" value={title} onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Stage Setup Walkthrough"
            />
          </div>
          <div>
            <label htmlFor="videoDescriptionUpload" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              id="videoDescriptionUpload" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="A brief summary of what this video covers."
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Video File</label>
             <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="video/*" onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    {selectedFile ? (
                        <p className="text-sm text-green-600 font-semibold">{selectedFile.name}</p>
                    ) : (
                        <p className="text-xs text-gray-500">Video file up to 50MB</p>
                    )}
                </div>
             </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">
            Upload Video
          </button>
        </div>
      </div>
    </div>
  );
};
