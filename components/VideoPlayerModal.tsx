import React from 'react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoUrl: string;
}

const getYoutubeEmbedUrl = (url: string) => {
    let videoId = '';
    const urlObj = new URL(url);
    if (url.includes('youtu.be')) {
        videoId = urlObj.pathname.substring(1);
    } else {
        videoId = urlObj.searchParams.get('v') || '';
    }
    return `https://www.youtube.com/embed/${videoId}`;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, title, videoUrl }) => {
  if (!isOpen) return null;

  const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const embedUrl = isYoutube ? getYoutubeEmbedUrl(videoUrl) : videoUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 truncate pr-4">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none flex-shrink-0">&times;</button>
        </div>
        <div className="p-2 bg-black">
          <div className="aspect-video">
            {isYoutube ? (
                <iframe
                    src={embedUrl}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            ) : (
                <video src={embedUrl} controls autoPlay className="w-full h-full bg-black" />
            )}
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark">Close</button>
        </div>
      </div>
    </div>
  );
};