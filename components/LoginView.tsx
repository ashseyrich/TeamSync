
import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<string | boolean>;
  onForgotPasswordClick: () => void;
  onRequestAccessClick: () => void;
  onBackToSetupClick?: () => void;
  successMessage?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onForgotPasswordClick, onRequestAccessClick, onBackToSetupClick, successMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await onLogin(email, password);
    if (typeof result === 'string') {
      setError(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-brand-primary">TeamSync</h1>
        <h2 className="text-center text-xl font-bold text-gray-900">Media Team Scheduler</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <button 
                  type="button" 
                  onClick={onForgotPasswordClick} 
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm mt-1" />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
             <button type="button" onClick={onRequestAccessClick} className="text-sm font-medium text-brand-primary hover:underline">
               Join a Team with Invite Code
             </button>
             <button type="button" onClick={onBackToSetupClick} className="text-xs text-gray-500 hover:underline">
               Setup a New Team
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
