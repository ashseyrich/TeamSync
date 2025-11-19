import React, { useState, useEffect } from 'react';

interface JoinTeamViewProps {
  onJoin: (code: string) => Promise<boolean>;
  onBackToLogin: () => void;
  initialCode: string | null;
}

export const JoinTeamView: React.FC<JoinTeamViewProps> = ({ onJoin, onBackToLogin, initialCode }) => {
  const [code, setCode] = useState(initialCode || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const success = await onJoin(code);
    if (!success) {
      setError('Invalid or expired invite code. Please check the code and try again.');
      setIsLoading(false);
    }
    // On success, the App component will handle navigation, so we don't need to setIsLoading(false)
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Join a Team
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the invite code you received to sign up.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700">
                Invite Code
              </label>
              <div className="mt-1">
                <input
                  id="invite-code"
                  name="invite-code"
                  type="text"
                  autoComplete="off"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
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
                {isLoading ? 'Verifying Code...' : 'Continue'}
              </button>
            </div>
            <div className="text-center">
              <button type="button" onClick={onBackToLogin} className="text-sm font-medium text-brand-primary hover:text-brand-dark">
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};