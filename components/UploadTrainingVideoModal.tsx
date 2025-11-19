import React, { useState } from 'react';

interface AddYouTubeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoData: { title: string, description: string, videoUrl: string }) => void;
}

const isValidYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return pattern.test(url);
};

export const AddYouTubeVideoModal: React.FC<AddYouTubeVideoModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !videoUrl.trim()) {
      setError('Please provide a title and a YouTube URL.');
      return;
    }
    if (!isValidYouTubeUrl(videoUrl)) {
        setError('Please enter a valid YouTube video URL.');
        return;
    }

    onSave({ title, description, videoUrl });
    // Reset state
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Add YouTube Video</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-700">Video Title</label>
            <input
              type="text" id="videoTitle" value={title} onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., How to Coil Cables"
            />
          </div>
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">YouTube URL</label>
            <input
              type="url" id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div>
            <label htmlFor="videoDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              id="videoDescription" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="A brief summary of what this video covers."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">
            Add Video
          </button>
        </div>
      </div>
    </div>
  );
};