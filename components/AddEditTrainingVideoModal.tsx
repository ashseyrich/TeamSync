import React, { useState, useEffect } from 'react';
import type { TrainingVideo } from '../types.ts';

interface AddEditTrainingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoData: Partial<TrainingVideo>) => void;
  videoToEdit: TrainingVideo | null;
  existingSubjects: string[];
}

const isValidYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return pattern.test(url);
};

export const AddEditTrainingVideoModal: React.FC<AddEditTrainingVideoModalProps> = ({ isOpen, onClose, onSave, videoToEdit, existingSubjects }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [month, setMonth] = useState('');
    const [subject, setSubject] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoSourceType, setVideoSourceType] = useState<'url' | 'upload'>('url');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (videoToEdit) {
                setTitle(videoToEdit.title);
                setDescription(videoToEdit.description || '');
                setMonth(videoToEdit.month || '');
                setSubject(videoToEdit.subject || '');
                setVideoUrl(videoToEdit.videoUrl || '');
                if (videoToEdit.videoUrl.startsWith('data:video')) {
                    setVideoSourceType('upload');
                } else {
                    setVideoSourceType('url');
                }
            } else {
                // Reset for new video
                setTitle('');
                setDescription('');
                setMonth('');
                setSubject('');
                setVideoUrl('');
                setVideoSourceType('url');
                setSelectedFile(null);
            }
            setError('');
        }
    }, [isOpen, videoToEdit]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title.trim()) {
            setError('Please provide a title.');
            return;
        }

        if (videoSourceType === 'url') {
            if (!videoUrl.trim() || !isValidYouTubeUrl(videoUrl)) {
                setError('Please enter a valid YouTube video URL.');
                return;
            }
            const finalVideoData = { ...videoToEdit, id: videoToEdit?.id || '', title, description, videoUrl, month, subject };
            onSave(finalVideoData);
        } else { // Upload
            if (!videoToEdit && !selectedFile) { // only require file for new uploads
                setError('Please select a video file to upload.');
                return;
            }

            if (selectedFile) { // New file was selected
                const reader = new FileReader();
                reader.onloadend = () => {
                    const finalVideoData = { ...videoToEdit, id: videoToEdit?.id || '', title, description, videoUrl: reader.result as string, month, subject };
                    onSave(finalVideoData);
                };
                reader.onerror = () => setError('Failed to read the video file.');
                reader.readAsDataURL(selectedFile);
            } else { // Editing metadata of an already uploaded video
                 const finalVideoData = { ...videoToEdit, id: videoToEdit?.id || '', title, description, videoUrl, month, subject };
                 onSave(finalVideoData);
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB
                setError('File size cannot exceed 50MB.');
                return;
            }
            setSelectedFile(file);
            setError('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">{videoToEdit ? 'Edit Training Video' : 'Add Training Video'}</h2>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-700">Video Title</label>
                        <input type="text" id="videoTitle" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full input-style" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month</label>
                            <input type="text" id="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block w-full input-style" placeholder="e.g., January 2024" />
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                            <input type="text" id="subject" list="subjects" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full input-style" placeholder="e.g., Audio" />
                            <datalist id="subjects">
                                {existingSubjects.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="videoDescription" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea id="videoDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Video Source</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <button onClick={() => setVideoSourceType('url')} disabled={!!videoToEdit && videoToEdit.videoUrl.startsWith('data:video')} className={`px-4 py-2 text-sm font-medium rounded-l-md border ${videoSourceType === 'url' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:bg-gray-100'}`}>YouTube URL</button>
                            <button onClick={() => setVideoSourceType('upload')} disabled={!!videoToEdit && !videoToEdit.videoUrl.startsWith('data:video')} className={`-ml-px px-4 py-2 text-sm font-medium rounded-r-md border ${videoSourceType === 'upload' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:bg-gray-100'}`}>Upload File</button>
                        </div>
                    </div>
                    {videoSourceType === 'url' ? (
                        <div>
                            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">YouTube URL</label>
                            <input type="url" id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="mt-1 block w-full input-style" placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Video File (Max 50MB)</label>
                            {videoToEdit?.videoUrl.startsWith('data:video') && !selectedFile ? (
                                <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-100 rounded-md">A video has already been uploaded. Select a new file below to replace it.</p>
                            ): null}
                            <input type="file" id="videoFile" accept="video/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-teal-100"/>
                            {selectedFile && <p className="text-sm text-green-600 mt-1">Selected: {selectedFile.name}</p>}
                        </div>
                    )}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">Save Video</button>
                </div>
            </div>
        </div>
    );
};