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
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
        const result = await onLogin(email, password);
        if (typeof result === 'string') {
          setError(result);
          setIsLoading(false);
        }
    } catch (e) {
        setError("An unexpected authentication error occurred.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-5xl font-black text-brand-primary tracking-tighter">TeamSync</h1>
        <h2 className="text-center text-xl font-bold text-gray-900 mt-2">Media Team Scheduler</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 border border-green-200 animate-fade-in-up">
            <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {successMessage}
            </p>
          </div>
        )}
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700">Email Address</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-style mt-1" placeholder="you@church.com" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold text-gray-700">Password</label>
                <button 
                  type="button" 
                  onClick={onForgotPasswordClick} 
                  className="text-xs font-bold text-brand-primary hover:text-brand-primary-dark hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-style mt-1" />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 animate-fade-in">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-black uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 transition-all transform active:scale-[0.98]">
              {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Signing in...
                  </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm font-bold"><span className="px-2 bg-white text-gray-400 uppercase tracking-widest text-[10px]">Or</span></div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
               <button type="button" onClick={onRequestAccessClick} className="w-full py-2 px-4 border border-gray-400 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                 Join Team with Invite Code
               </button>
               <button type="button" onClick={onBackToSetupClick} className="text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors">
                 Setup a New Organization
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};