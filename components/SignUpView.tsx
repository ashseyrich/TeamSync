
import React, { useState, useEffect } from 'react';
import type { TeamMember, Team } from '../types.ts';

interface SignUpViewProps {
  teamToJoin: Team;
  onSignUp: (details: Omit<TeamMember, 'id' | 'status' | 'permissions' | 'skills' | 'checkIns' | 'availability'>, password: string) => string | boolean | TeamMember;
  onBackToLogin: () => void;
  isAdminSignUp?: boolean;
}

export const SignUpView: React.FC<SignUpViewProps> = ({ teamToJoin, onSignUp, onBackToLogin, isAdminSignUp = false }) => {
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
                onBackToLogin();
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [isSuccess, onBackToLogin]);


    const handleSubmit = (e: React.FormEvent) => {
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

        setIsLoading(true);
        setTimeout(() => {
            const result = onSignUp({ name: fullName.trim(), pronouns, email, phoneNumber, username: username.trim() }, password);

            if (typeof result === 'object' || result === true) {
                setIsSuccess(true);
            } else {
                setError(result as string);
            }
            setIsLoading(false);
        }, 1000);
    };

    const title = isAdminSignUp ? "Create Admin Account" : "Join Team";
    const subTitle = isAdminSignUp 
        ? `You're joining "${teamToJoin.name}" as an administrator.`
        : `You're joining "${teamToJoin.name}". Create an account to continue.`;
    
    // Success message handled by App.tsx now mostly, but local fallback just in case
    const successMessage = isAdminSignUp
        ? `Admin account created for "${teamToJoin.name}"! Redirecting you to the login page...`
        : `Account created successfully! Redirecting you...`;

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                        <p className="mt-2 text-sm text-gray-600">{successMessage}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
         <h2 className="text-center text-3xl font-extrabold text-gray-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">{subTitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
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

                {error && ( <div className="rounded-md bg-red-50 p-3"><p className="text-sm text-red-700">{error}</p></div> )}

                <div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
                        {isLoading ? 'Submitting...' : 'Create Account'}
                    </button>
                </div>
                 <div className="text-center">
                    <button type="button" onClick={onBackToLogin} className="text-sm font-medium text-brand-primary hover:text-brand-dark">Cancel</button>
                </div>
            </form>
        </div>
      </div>
    </div>
    );
};
