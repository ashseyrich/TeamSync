
import React, { useState, useRef } from 'react';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<string | boolean>;
  onForgotPasswordClick: () => void;
  onRequestAccessClick: () => void;
  onBackToSetupClick?: () => void;
  successMessage?: string;
  onImportData?: (json: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onForgotPasswordClick, onRequestAccessClick, onBackToSetupClick, successMessage, onImportData }) => {
  const [loginAs, setLoginAs] = useState<'admin' | 'member' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoginType, setDemoLoginType] = useState<'admin' | 'member' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await onLogin(username, password);
    if (typeof result === 'string') {
      setError(result);
    }
    setIsLoading(false);
  };
  
  const handleDemoMemberLogin = async () => {
    setError('');
    setIsLoading(true);
    setDemoLoginType('member');
    // Login with 'carlos' user from mock data
    const result = await onLogin('carlos', 'carlos'); 
    if (typeof result === 'string') {
      setError(result);
      // Only set loading to false on error, otherwise the component unmounts on success
      setIsLoading(false);
      setDemoLoginType(null);
    }
  };

  const handleDemoAdminLogin = async () => {
    setError('');
    setIsLoading(true);
    setDemoLoginType('admin');
    // Login with 'admin' user from mock data
    const result = await onLogin('admin', 'admin'); 
    if (typeof result === 'string') {
      setError(result);
      setIsLoading(false);
      setDemoLoginType(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImportData) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const json = event.target?.result as string;
              onImportData(json);
          };
          reader.readAsText(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetLoginAs = (role: 'admin' | 'member') => {
    setLoginAs(role);
    setUsername('');
    setPassword('');
    setError('');
  };
  
  const renderLoginForm = (title: string) => (
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 animate-fade-in">
        <div className="mb-6">
            <button onClick={() => setLoginAs(null)} className="text-sm font-medium text-brand-primary hover:text-brand-dark flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to selection
            </button>
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 mb-6">{title}</h3>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <div className="mt-1">
              <input id="username" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1">
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
            </div>
          </div>
          
          <div className="flex items-center justify-end">
              <div className="text-sm">
                  <button type="button" onClick={onForgotPasswordClick} className="font-medium text-brand-primary hover:text-brand-dark">
                      Forgot your password?
                  </button>
              </div>
          </div>
          
          {error && (
              <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                      <div className="flex-shrink-0">
                           <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                      </div>
                      <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                  </div>
              </div>
          )}

          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
  );

  const renderSelection = () => (
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 animate-fade-in">
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Explore the App</h3>
        <p className="text-center text-sm text-gray-600 mb-6">Choose a demo account to get started instantly.</p>
        <div className="space-y-4">
             <button 
                onClick={handleDemoAdminLogin} 
                disabled={isLoading}
                className="w-full flex items-center justify-center text-left p-4 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50">
                <div>
                    <p className="font-semibold text-gray-800">Login as Demo Admin</p>
                    <p className="text-sm text-gray-500">Explore the app from an administrator's perspective.</p>
                </div>
            </button>
            <button 
                onClick={handleDemoMemberLogin} 
                disabled={isLoading}
                className="w-full flex items-center justify-center text-left p-4 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-secondary disabled:opacity-50">
                <div>
                    <p className="font-semibold text-gray-800">Login as Demo Member</p>
                    <p className="text-sm text-gray-500">Explore the app from a team member's perspective.</p>
                </div>
            </button>
        </div>
        
        <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or
                </span>
              </div>
            </div>
        </div>

        <div className="mt-6 space-y-4">
            <button onClick={() => handleSetLoginAs('admin')} disabled={isLoading} className="w-full flex items-center justify-center text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50">
                <div>
                    <p className="font-semibold text-gray-800">Login with Credentials</p>
                    <p className="text-sm text-gray-500">For existing admins and team members.</p>
                </div>
            </button>
            <button onClick={onRequestAccessClick} disabled={isLoading} className="w-full flex items-center justify-center text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50">
                <div>
                    <p className="font-semibold text-gray-800">Join a Team</p>
                    <p className="text-sm text-gray-500">Use an invite code to sign up and join a team.</p>
                </div>
            </button>
        </div>

        {error && !loginAs && (
             <div className="mt-6 rounded-md bg-red-50 p-4">
                 <div className="flex">
                     <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                         </svg>
                     </div>
                     <div className="ml-3">
                         <p className="text-sm font-medium text-red-800">{error}</p>
                     </div>
                 </div>
             </div>
        )}
        
        <div className="mt-6">
            <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                Or
                </span>
            </div>
            </div>
            <div className="mt-6 text-center space-y-2">
                {onBackToSetupClick && (
                    <button 
                        type="button" 
                        onClick={onBackToSetupClick}
                        disabled={isLoading} 
                        className="block w-full font-medium text-brand-primary hover:text-brand-dark text-sm disabled:opacity-50"
                    >
                        Start a new team setup
                    </button>
                )}
                {onImportData && (
                    <>
                         <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading} 
                            className="block w-full font-medium text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
                        >
                            Have a backup file? Import Team Data
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".json" 
                            className="hidden" 
                        />
                    </>
                )}
            </div>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {isLoading && demoLoginType ? (
            <div className="text-center animate-fade-in">
                <h3 className="text-xl font-bold text-gray-900">Logging in as Demo {demoLoginType === 'admin' ? 'Admin' : 'Member'}...</h3>
            </div>
        ) : (
            <>
                <h1 className="mt-6 text-center text-3xl font-extrabold text-brand-primary">
                    TeamSync
                </h1>
                <h2 className="text-center text-xl font-bold text-gray-900">
                    Media Team Scheduler
                </h2>
            </>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
         {successMessage && !loginAs && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        {!demoLoginType && (
            loginAs === null ? renderSelection() :
            renderLoginForm('Login with Credentials')
        )}
      </div>
    </div>
  );
};
