
import React, { useState, useEffect } from 'react';
import type { TeamMember, TeamType, SignUpDetails } from '../types.ts';

interface AdminRegistrationViewProps {
  onRegister: (teamName: string, type: TeamType, details: SignUpDetails, password: string, description?: string, focusAreas?: string[]) => Promise<string | boolean>;
  onRegistrationComplete: () => void;
  onBack: () => void;
}

const TEAM_TYPES: { id: TeamType; label: string; icon: string; description: string }[] = [
    { id: 'media', label: 'Media / Production', icon: '📹', description: 'For AV teams. Includes Video Analysis, technical roles.' },
    { id: 'worship', label: 'Worship Team', icon: '🎸', description: 'For bands and vocalists. Focus on music roles.' },
    { id: 'ushering', label: 'Ushers / Greeters', icon: '🤝', description: 'For hospitality. Focus on people and logistics.' },
    { id: 'youth', label: 'Youth Ministry', icon: '🎮', description: 'Includes Child Check-in, small groups, and safety.' },
    { id: 'general', label: 'General Team', icon: '👥', description: 'Flexible setup for any volunteer group.' },
    { id: 'custom', label: 'Custom Team', icon: '✨', description: 'Describe your team, and AI will generate roles, skills, and settings.' },
];

const FOCUS_AREAS = [
    { id: 'videoAnalysis', label: 'Video Analysis & Review' },
    { id: 'attire', label: 'Attire / Uniform Tracking' },
    { id: 'training', label: 'Training Library & Scenarios' },
    { id: 'childCheckIn', label: 'Child Check-in System', restrictedTo: 'youth' },
];

export const AdminRegistrationView: React.FC<AdminRegistrationViewProps> = ({ onRegister, onRegistrationComplete, onBack }) => {
    const [teamName, setTeamName] = useState('');
    const [teamType, setTeamType] = useState<TeamType>('media');
    const [customDescription, setCustomDescription] = useState('');
    const [selectedFocusAreas, setSelectedFocusAreas] = useState<Set<string>>(new Set());
    const [fullName, setFullName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        let timer: number;
        if (isSuccess) {
            timer = window.setTimeout(() => {
                onRegistrationComplete();
            }, 3000); 
        }
        return () => clearTimeout(timer);
    }, [isSuccess, onRegistrationComplete]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (teamType === 'custom' && !customDescription.trim()) {
            setError('Please provide a description for your custom team.');
            return;
        }

        setIsLoading(true);
        try {
            const details: SignUpDetails = {
                name: fullName.trim(),
                pronouns,
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                username: username.trim().toLowerCase(),
            };
            const result = await onRegister(teamName.trim(), teamType, details, password, customDescription.trim(), Array.from(selectedFocusAreas));

            if (result === true) {
                setIsSuccess(true);
            } else {
                setError(result as string);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const toggleFocusArea = (areaId: string) => {
        const newAreas = new Set(selectedFocusAreas);
        if (newAreas.has(areaId)) {
            newAreas.delete(areaId);
        } else {
            newAreas.add(areaId);
        }
        setSelectedFocusAreas(newAreas);
    };

    const availableFocusAreas = FOCUS_AREAS.filter(area => !area.restrictedTo || area.restrictedTo === teamType);

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Team Created!</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Your administrator account has been created. Redirecting you to the login page...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
         <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create Your Admin Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          As the first administrator, you'll set up and manage your team.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md pb-10">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 relative">
            <button 
                onClick={onBack}
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Go Back"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>

            <form className="space-y-6 pt-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">Team Name</label>
                    <input type="text" id="teamName" value={teamName} onChange={e => setTeamName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., Sunday Service Team"/>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Type (Pre-sets Roles & Features)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {TEAM_TYPES.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => {
                                    setTeamType(type.id);
                                    const newAreas = new Set(selectedFocusAreas);
                                    FOCUS_AREAS.forEach(area => {
                                        if (area.restrictedTo && area.restrictedTo !== type.id) {
                                            newAreas.delete(area.id);
                                        }
                                    });
                                    setSelectedFocusAreas(newAreas);
                                }}
                                className={`p-2 rounded border text-left text-sm ${teamType === type.id ? 'border-brand-primary bg-brand-light ring-1 ring-brand-primary' : 'border-gray-300 hover:bg-gray-50'}`}
                            >
                                <span className="mr-1">{type.icon}</span> <span className="font-semibold">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="animate-fade-in space-y-4">
                    {teamType === 'custom' && (
                        <div>
                            <label htmlFor="customDescription" className="block text-sm font-medium text-gray-700">Describe Your Team</label>
                            <textarea 
                                id="customDescription" 
                                value={customDescription} 
                                onChange={e => setCustomDescription(e.target.value)} 
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" 
                                placeholder="e.g., A parking lot safety team that directs traffic and helps elderly people to the door."
                            />
                            <p className="text-xs text-gray-500 mt-1">AI will generate roles and skills based on this description.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Include Features</label>
                        <p className="text-xs text-gray-500 mb-2">Select areas you specifically need for this team.</p>
                        <div className="space-y-2">
                            {availableFocusAreas.map(area => (
                                <label key={area.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedFocusAreas.has(area.id)}
                                        onChange={() => toggleFocusArea(area.id)}
                                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                    />
                                    <span className="text-sm text-gray-800">{area.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8 border-t pt-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Your Full Name</label>
                        <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700">Pronouns</label>
                        <input type="text" id="pronouns" value={pronouns} onChange={e => setPronouns(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                </div>

                {error && (
                     <div className="rounded-md bg-red-50 p-3">
                        <p className="text-sm text-red-700">{error}</p>
                     </div>
                )}

                <div className="flex flex-col gap-3">
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
                        {isLoading ? (teamType === 'custom' ? 'Generating...' : 'Creating Account...') : 'Create Account & Team'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onBack}
                        className="w-full text-center py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
    );
};
