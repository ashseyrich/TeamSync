
import React, { useState } from 'react';

interface ForgotPasswordViewProps {
  onSendResetEmail: (email: string) => Promise<string | boolean>;
  onCancel: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onSendResetEmail, onCancel }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setIsLoading(true);

    try {
        const result = await onSendResetEmail(email);
        if (result === true) {
            setIsSubmitted(true);
        } else {
            setError(result as string);
        }
    } catch (err) {
        setError('Failed to send reset email. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
         <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Forgot Your Password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isSubmitted ? (
             <div className="text-center animate-fade-in">
                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">Email Sent</h3>
                 <p className="mt-2 text-sm text-gray-600">
                    If an account exists for {email}, you will receive a reset link shortly. Please check your inbox (and spam folder).
                 </p>
                 <div className="mt-6">
                    <button type="button" onClick={onCancel} className="text-sm font-bold text-brand-primary hover:text-brand-dark">
                        Return to Login
                    </button>
                 </div>
             </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-reset" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email-reset"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {error && (
                 <div className="rounded-md bg-red-50 p-3 border border-red-100">
                    <p className="text-sm text-red-700">{error}</p>
                 </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
              <div className="text-center">
                <button type="button" onClick={onCancel} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Cancel and Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
