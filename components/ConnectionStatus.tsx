import React from 'react';

export const ConnectionStatus: React.FC = () => {
    const hasApiKey = !!process.env.API_KEY && process.env.API_KEY !== '' && process.env.API_KEY !== 'undefined';

    // If API key is found and we are on cloud, we "take away the area" as requested.
    // We only show it if there is a configuration error that needs fixing.
    if (hasApiKey) return null;

    return (
        <div className="fixed bottom-2 left-2 z-[100] flex gap-2">
            <div 
                className="relative group px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border cursor-help bg-red-100 text-red-700 border-red-200" &gt;
                AI Configuration Needed
                
                <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 text-white text-[11px] font-normal normal-case rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                    <p className="font-bold text-red-400 mb-1">Gemini API Key Missing</p>
                    <p className="mb-2">To enable AI features on Netlify:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-300">
                        <li>Go to Netlify Dashboard </li>
                        <li>Site Settings > Environment Variables</li>
                        <li>Add <code className="bg-gray-700 px-1 rounded">API_KEY</code> with your Gemini Key</li>
                        <li>Re-trigger deployment</li>
                    </ol>
                    <div className="absolute top-full left-4 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-800"></div>
                </div>
            </div>
        </div>
    );
};
