import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, navigate] = useLocation();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { fullName, username: email },
      },
    });

    if (authError) {
      setError(authError.message || 'Failed to create account.');
      setLoading(false);
      return;
    }

    // Step 2: Get user ID from session (more reliable)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (sessionError || !userId) {
      setError('Could not retrieve session. Please try again.');
      setLoading(false);
      return;
    }

    // Step 3: Insert user into "users" table
    const { error: insertError } = await supabase.from('users').insert([
      {
        username: email,
        email,
        full_name: fullName,
        supabase_user_id: userId,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    navigate('/onboarding');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-big-grinch">
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
          <div className="flex flex-col items-center mb-6">
            <img src="/appicon-rounded.png" alt="WeBudget Logo" className="w-16 h-16 mb-2" />
            <p className="text-gray-600">Create your WeBudget account.</p>
          </div>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">Account created!</div>}

            <button
              type="submit"
              className="w-full py-2 px-4 bg-big-grinch text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-medium">
              Sign In
            </button>
          </div>
        </div>
      </div>
      <div className="py-6 text-white text-xs text-center">
        &copy; {new Date().getFullYear()} WeBudget. All rights reserved.
      </div>
    </div>
  );
};

export default SignUpPage;