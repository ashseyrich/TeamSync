
import React from 'react';
import { TrainingScenario } from './TrainingScenario.tsx';
import type { TeamType } from '../types.ts';

interface PracticeScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  growthArea: string;
  teamType: TeamType;
  teamDescription?: string;
}

export const PracticeScenarioModal: React.FC<PracticeScenarioModalProps> = ({ isOpen, onClose, growthArea, teamType, teamDescription }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col animate-fade-in-up">
        <div className="p-6 border-b flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Practice Scenario</h2>
                <p className="text-sm font-semibold text-brand-primary">{growthArea}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="p-6">
            <TrainingScenario 
                key={growthArea} 
                skill={growthArea} 
                teamType={teamType} 
                teamDescription={teamDescription}
            />
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};
