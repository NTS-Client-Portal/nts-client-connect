import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/database'; // Adjust the import path as needed
import Link from 'next/link';

const RecoverPassword: React.FC = () => {
  const router = useRouter();
  const { userType } = router.query;
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {
    if (!userType) {
      router.push('/'); // Redirect to home if userType is missing
    }
  }, [userType, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setButtonDisabled(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/reset-password?userType=${userType}`
    });

    if (error) {
      setError('Error sending recovery email: ' + error.message);
      setButtonDisabled(false);
    } else {
      setMessage('Recovery email sent successfully. Please check your inbox.');
    }
  };

  const handleResend = () => {
    setButtonDisabled(false);
    setMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Password Recovery</h1>
        {message && <div className="text-green-500 mb-4">{message}</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Email"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            disabled={buttonDisabled}
          >
            {buttonDisabled ? 'Email Sent' : 'Send Recovery Email'}
          </button>
        </form>
        {buttonDisabled && (
          <div className="mt-4 text-center">
            <p>Didn&apos;t receive the email?</p>
            <button
              onClick={handleResend}
              className="text-blue-500 hover:underline"
            >
              Resend Email
            </button>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href={userType === 'nts_users' ? '/nts/login' : '/'} className="text-blue-500 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecoverPassword;