
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
  const [showKeyPicker, setShowKeyPicker] = useState(false);

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

  const handleOpenKeySelector = async () => {
    const aiWin = window as any;
    if (aiWin.aistudio) {
        try {
            await aiWin.aistudio.openSelectKey();
            setError(null);
            setShowKeyPicker(false);
        } catch (e) {
            console.error("Error opening API key selection", e);
            setError("Could not open API key selection. Please try again.");
        }
    }
  };
  
  const handleGenerateVideo = async () => {
    const aiWin = window as any;
    if (aiWin.aistudio) {
        let hasKey = false;
        try {
            hasKey = await aiWin.aistudio.hasSelectedApiKey();
        } catch (e) {
            console.error("Error checking for API key", e);
        }
        
        if (!hasKey) {
            await handleOpenKeySelector();
            // Proceed as per rules: assume success and proceed
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
        
        // Handle specific billing or "Not Found" errors per rules
        const isBillingError = message.toLowerCase().includes("billing") || 
                               message.toLowerCase().includes("quota") ||
                               message.toLowerCase().includes("budget") ||
                               message.includes("Requested entity was not found.");
        
        if (isBillingError) {
             setError("API Key Error: A paid GCP project with active billing is required for high-quality video generation. Your current project may have expired billing or lack the required permissions.");
             setShowKeyPicker(true);
        } else {
             setError(message);
        }
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-0 space-y-8">
        <div id="guide-weekly-skill-focus" className={`bg-white rounded-3xl shadow-xl p-8 border-t-8 transition-colors ${error && showKeyPicker ? 'border-red-500' : 'border-brand-primary'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Weekly Skill Focus</h3>
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">Generate AI-powered scripts and cinematic motion graphics to encourage your team. This requires a <strong>Paid Google Cloud Project</strong> with active billing.</p>
                </div>
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase text-brand-primary hover:text-brand-primary-dark transition-colors px-3 py-1 bg-brand-light rounded-full border border-brand-primary/20"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Billing Docs
                </a>
            </div>
            
            {error && showKeyPicker && (
                <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 animate-fade-in">
                    <div className="flex gap-3">
                        <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <p className="text-sm font-bold text-red-800">Billing or Account Issue Detected</p>
                            <p className="text-xs text-red-700 mt-1 leading-relaxed">{error}</p>
                            <button 
                                onClick={handleOpenKeySelector}
                                className="mt-3 px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-700 shadow-md transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                Select Different API Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isGenerating && (
                 <button 
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                    className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-brand-primary-dark transition-all transform active:scale-95 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                    {videoUrl ? 'Regenerate Weekly Focus' : '✨ Launch Video Generator'}
                </button>
            )}

            {(isGenerating || videoUrl || (error && !showKeyPicker)) && (
                <VideoScriptPlayer 
                    script={videoScript}
                    videoUrl={videoUrl}
                    isLoading={isGenerating}
                    error={!showKeyPicker ? error : null}
                />
            )}
            
            <div className="mt-6 flex sm:hidden">
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-brand-primary underline"
                >
                    View Billing Requirements Documentation
                </a>
            </div>
        </div>


      <div className="flex justify-between items-start">
        <div>
            <h2 id="encouragement-title" className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Team Shout-Outs</h2>
        </div>
      </div>

      <div id="guide-shout-out-btn" className="space-y-4">
          {allShoutOuts.length > 0 ? allShoutOuts.map(shoutOut => (
              <div key={shoutOut.id} className="bg-white rounded-3xl shadow-lg p-6 border-l-8 border-brand-secondary transform hover:scale-[1.01] transition-all">
                  <p className="text-lg text-gray-800 font-medium leading-relaxed italic">"{shoutOut.message}"</p>
                  <div className="mt-4 flex items-center justify-end gap-3">
                      <div className="h-[1px] w-8 bg-gray-200"></div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                          <strong>{shoutOut.fromName}</strong> for <strong>{shoutOut.toName}</strong>
                      </p>
                  </div>
              </div>
          )) : (
            <div className="text-center py-12 bg-white rounded-3xl shadow-md border-2 border-dashed">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Roster Quiet</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to recognize a technical operator today.</p>
            </div>
          )}
      </div>

    </div>
  );
};
