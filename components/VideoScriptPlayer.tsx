import React from 'react';

interface VideoScriptPlayerProps {
    script: string | null;
    videoUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

export const VideoScriptPlayer: React.FC<VideoScriptPlayerProps> = ({ script, videoUrl, isLoading, error }) => {
    
    const renderVideoContent = () => {
        if (isLoading && !videoUrl) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
                    <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-semibold">Generating Content...</p>
                </div>
            );
        }
        if (videoUrl) {
            return (
                <video src={videoUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
            );
        }
        // Initial state before loading
        return (
            <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
            </div>
        );
    }

    if (error) {
        return (
             <div className="border rounded-lg p-4 bg-red-50 text-red-700">
                <h4 className="font-bold">Generation Failed</h4>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg overflow-hidden mt-4">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
                {renderVideoContent()}
            </div>
            {script && (
                <div className="p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-2">Video Script</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded-md border max-h-48 overflow-y-auto">
                        {script}
                    </div>
                </div>
            )}
        </div>
    )
}