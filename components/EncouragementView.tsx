
import React, { useState, useMemo } from 'react';
import type { TeamMember, ShoutOut, Team } from '../types.ts';
import { generateEncouragementVideo } from '../services/geminiService.ts';
import { VideoScriptPlayer } from './VideoScriptPlayer.tsx';

interface EncouragementViewProps {
  team: Team;
  currentUser: TeamMember;
}

export const EncouragementView: React.FC<EncouragementViewProps> = ({ team, currentUser }) => {
  const [videoScript, setVideoScript] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allShoutOuts = useMemo(() => {
    const shoutOutsWithNames: (ShoutOut & { fromName: string, toName: string })[] = [];
    const memberMap = new Map(team.members.map(m => [m.id, m.name]));
    
    const teamShoutOuts = team.shoutOuts || [];

    teamShoutOuts.forEach(so => {
        const fromName = memberMap.get(so.fromId);
        const toName = memberMap.get(so.toId);
        if (typeof fromName === 'string' && typeof toName === 'string') {
            shoutOutsWithNames.push({ ...so, fromName, toName });
        }
    });

    return shoutOutsWithNames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [team.members, team.shoutOuts]);
  
  const handleGenerateVideo = async () => {
    if (window.aistudio) {
        let hasKey = false;
        try {
            hasKey = await window.aistudio.hasSelectedApiKey();
        } catch (e) {
            console.error("Error checking for API key", e);
        }
        
        if (!hasKey) {
            try {
                await window.aistudio.openSelectKey();
            } catch (e) {
                 console.error("Error opening API key selection", e);
                 setError("Could not open API key selection. Please try again.");
                 return;
            }
        }
    }
    
    // Reset state for new generation
    setIsGenerating(true);
    setError(null);
    setVideoScript(null);
    setVideoUrl(null);
    
    try {
        const { script, videoUrl } = await generateEncouragementVideo();
        setVideoScript(script);
        setVideoUrl(videoUrl);
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        if (message.includes("Requested entity was not found.")) {
             setError("Your API Key is invalid or missing required permissions. Please try generating again to select a different key.");
        } else {
             setError(message);
        }
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm-p-0 space-y-8">
        <div id="guide-weekly-skill-focus" className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Weekly Skill Focus</h3>
            <p className="text-sm text-gray-600 mb-4">A short, AI-generated script with a matching inspirational video to encourage and equip the team on a specific skill each week. <span className="font-semibold">Note: Video generation requires you to select a project with billing enabled.</span></p>
            
            {!isGenerating && (
                 <button 
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400"
                >
                    {videoUrl ? 'Generate New Encouragement' : "Generate this week's encouragement"}
                </button>
            )}

            {(isGenerating || videoUrl || error) && (
                <VideoScriptPlayer 
                    script={videoScript}
                    videoUrl={videoUrl}
                    isLoading={isGenerating}
                    error={error}
                />
            )}
        </div>


      <div className="flex justify-between items-start">
        <div>
            <h2 id="encouragement-title" className="text-3xl font-bold text-gray-900">Team Shout-Outs</h2>
        </div>
      </div>

      <div id="guide-shout-out-btn" className="space-y-4">
          {allShoutOuts.length > 0 ? allShoutOuts.map(shoutOut => (
              <div key={shoutOut.id} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-brand-secondary">
                  <p className="text-gray-800">"{shoutOut.message}"</p>
                  <p className="text-sm text-gray-600 mt-2 text-right">
                      - <strong>{shoutOut.fromName}</strong> to <strong>{shoutOut.toName}</strong>
                  </p>
              </div>
          )) : (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <p className="text-gray-600">No shout-outs yet. Be the first to encourage someone!</p>
            </div>
          )}
      </div>

    </div>
  );
};
