import React, { useState } from 'react';
import type { TeamMember } from '../types.ts';

interface ForgotPasswordViewProps {
  users: TeamMember[];
  onUserFound: (user: TeamMember) => void;
  onCancel: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ users, onUserFound, onCancel }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => { // Simulate network request
        const user = users.find(member => member.name.toLowerCase() === username.toLowerCase());

        if (user) {
            setIsSubmitted(true);
            setTimeout(() => { // Simulate redirect after message
                onUserFound(user);
            }, 3000);
        } else {
            setError('No user found with that name.');
        }
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
         <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Forgot Your Password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          No problem. Enter your full name and we'll help you reset it.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isSubmitted ? (
             <div className="text-center">
                 <h3 className="text-lg font-medium text-gray-900">Check Your Messages</h3>
                 <p className="mt-2 text-sm text-gray-600">
                    We've sent a (simulated) password reset link to the email or phone number associated with your account. You will be redirected shortly.
                 </p>
             </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  />
                </div>
              </div>

              {error && (
                 <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-700">{error}</p>
                 </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400"
                >
                  {isLoading ? 'Searching...' : 'Send Reset Link'}
                </button>
              </div>
              <div className="text-center">
                <button type="button" onClick={onCancel} className="text-sm font-medium text-brand-primary hover:text-brand-dark">
                    Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};