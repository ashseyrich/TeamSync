import React, { useState, useEffect } from 'react';
import type { Team } from '../types.ts';

interface TeamBrandingCardProps {
    team: Team;
    onUpdateTeam: (updatedData: Partial<Team>) => void;
}

const DEFAULT_PRIMARY = '#0d9488';
const DEFAULT_SECONDARY = '#f59e0b';

export const TeamBrandingCard: React.FC<TeamBrandingCardProps> = ({ team, onUpdateTeam }) => {
    const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
    const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);

    useEffect(() => {
        setPrimaryColor(team.brandColors?.primary || DEFAULT_PRIMARY);
        setSecondaryColor(team.brandColors?.secondary || DEFAULT_SECONDARY);
    }, [team.brandColors]);

    const handleSave = () => {
        onUpdateTeam({ brandColors: { primary: primaryColor, secondary: secondaryColor } });
    };

    const handleReset = () => {
        setPrimaryColor(DEFAULT_PRIMARY);
        setSecondaryColor(DEFAULT_SECONDARY);
        onUpdateTeam({ brandColors: undefined });
    };

    const hasChanges = primaryColor !== (team.brandColors?.primary || DEFAULT_PRIMARY) || secondaryColor !== (team.brandColors?.secondary || DEFAULT_SECONDARY);
    const isDefault = !team.brandColors;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">Team Branding</h3>
            <p className="text-sm text-gray-600 mt-1">Customize the app's color scheme to match your team's identity.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                    <div className="mt-1 flex items-center gap-2">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer bg-white"
                        />
                        <span className="font-mono text-sm">{primaryColor}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary / Accent Color</label>
                    <div className="mt-1 flex items-center gap-2">
                         <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer bg-white"
                        />
                        <span className="font-mono text-sm">{secondaryColor}</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Save Colors
                </button>
                <button
                    onClick={handleReset}
                    disabled={isDefault}
                    className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Reset to Default
                </button>
            </div>
        </div>
    );
};