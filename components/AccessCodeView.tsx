import React, { useState } from 'react';

interface AccessCodeViewProps {
  onAccessGranted: (code: string) => boolean;
  onNoCodeClick: () => void;
  onDemoClick?: () => void;
}

export const AccessCodeView: React.FC<AccessCodeViewProps> = ({ onAccessGranted, onNoCodeClick, onDemoClick }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setError('');
    setIsLoading(true);

    setTimeout(() => { // Simulate validation
      const success = onAccessGranted(code);
      if (!success) {
        setError('Invalid setup code. Please try again.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-brand-primary">
          TeamSync
        </h1>
        <h2 className="mt-2 text-center text-xl font-bold text-gray-900">
          Welcome! Let's set up your team.
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the setup code to create or join a team as an administrator.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="access-code" className="block text-sm font-medium text-gray-700">
                Setup Code
              </label>
              <div className="mt-1">
                <input
                  id="access-code"
                  name="access-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  placeholder="Enter one-time setup code"
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
                disabled={isLoading || !code}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400"
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Quick Start
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={onDemoClick || onNoCodeClick}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-secondary hover:bg-brand-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
              >
                Explore Demo Mode (Instant)
              </button>
              <button
                type="button"
                onClick={onNoCodeClick}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
              >
                Login to Existing Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};