import React, { useState } from 'react';
import type { ServiceEvent, TeamMember, Role, SuggestedAssignment, Assignment } from '../types.ts';
import { suggestSchedule } from '../services/geminiService.ts';

interface AISchedulingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ServiceEvent;
  teamMembers: TeamMember[];
  roles: Role[];
  onApplySuggestions: (updatedAssignments: Assignment[]) => void;
}

const SuggestionDisplay: React.FC<{ suggestions: SuggestedAssignment[], roles: Role[], teamMembers: TeamMember[], onApply: () => void }> = ({ suggestions, roles, teamMembers, onApply }) => {
    const getRoleName = (id: string) => roles.find(r => r.id === id)?.name || 'Unknown Role';
    const getMemberName = (id: string) => teamMembers.find(m => m.id === id)?.name || 'Unknown Member';
    
    return (
        <div className="mt-4 border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-2">Suggested Roster</h3>
            <div className="space-y-2">
                {suggestions.map((s, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                        <p className="font-semibold text-gray-800">{getRoleName(s.roleId)}: <span className="text-brand-primary">{getMemberName(s.memberId)}</span></p>
                        <p className="text-xs text-gray-600 mt-1 italic">Reasoning: "{s.reasoning}"</p>
                    </div>
                ))}
            </div>
             <div className="flex justify-end mt-4">
                <button onClick={onApply} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark">
                    Apply Suggestions
                </button>
            </div>
        </div>
    )
}

export const AISchedulingAssistantModal: React.FC<AISchedulingAssistantModalProps> = ({ isOpen, onClose, event, teamMembers, roles, onApplySuggestions }) => {
  const [prompt, setPrompt] = useState('Schedule a proficient and reliable team for this service.');
  const [suggestions, setSuggestions] = useState<SuggestedAssignment[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const rolesForEvent = roles.filter(r => event.assignments.some(a => a.roleId === r.id));

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
        const result = await suggestSchedule(prompt, teamMembers, rolesForEvent);
        setSuggestions(result);
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleApply = () => {
      if (!suggestions) return;
      const updatedAssignments = [...event.assignments];
      suggestions.forEach(suggestion => {
          const assignmentIndex = updatedAssignments.findIndex(a => a.roleId === suggestion.roleId);
          if(assignmentIndex > -1) {
              updatedAssignments[assignmentIndex] = {
                  ...updatedAssignments[assignmentIndex],
                  memberId: suggestion.memberId,
              };
          }
      });
      onApplySuggestions(updatedAssignments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">✨ AI Scheduling Assistant</h2>
          <p className="text-sm text-gray-600">{event.name} on {event.date.toLocaleDateString()}</p>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
                <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700">Scheduling Request</label>
                <textarea
                    id="ai-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="e.g., Schedule experienced members, give new people a chance..."
                />
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isLoading ? 'Generating...' : 'Generate Suggestions'}
            </button>

            {error && <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm"><p><span className="font-bold">Error:</span> {error}</p></div>}
            {suggestions && <SuggestionDisplay suggestions={suggestions} roles={roles} teamMembers={teamMembers} onApply={handleApply} />}
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};