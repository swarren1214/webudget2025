import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '../lib/supabaseClient';
import { useLocation } from 'wouter';

const OnboardingPage: React.FC = () => {
  const [plaidLinked, setPlaidLinked] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingLinkToken, setLoadingLinkToken] = useState(true);
  const [, navigate] = useLocation();

  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.auth.refreshSession(); // helps prevent expired session issues

    const token = session?.access_token ?? null;
    console.log("Supabase access token:", token);

    if (!token) {
      console.warn("User is not logged in. Redirecting to login...");
      navigate('/login');
    }

    return token;
  };

  const onSuccess = useCallback(async (public_token: string) => {
    const token = await getAccessToken();
    if (!token) return;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

      await fetch(`${API_BASE}/api/v1/plaid/exchange-public-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ public_token })
      });

      setPlaidLinked(true);
      navigate('/dashboard');
    } catch (err) {
      console.error("Failed to exchange public token:", err);
    }
  }, [navigate]);

  const config = linkToken
    ? {
        token: linkToken,
        onSuccess,
        onExit: (err, metadata) => {
          if (err) console.error('Plaid exited with error', err);
        },
      }
    : { token: '' };

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    const fetchLinkToken = async () => {
      const token = await getAccessToken();
      if (!token) return;

      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

        const response = await fetch(`${API_BASE}/api/v1/plaid/create-link-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log("Received Plaid link token response:", data);

        setLinkToken(data.linkToken);

        // Set onboarding flag
        await fetch(`${API_BASE}/api/v1/users/onboarding`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ has_onboarded: true }),
        });
      } catch (err) {
        console.error("Failed to create Plaid link token:", err);
      } finally {
        setLoadingLinkToken(false);
      }
    };

    fetchLinkToken();
  }, []);

  // Optional: auto-open Plaid when ready
  useEffect(() => {
    if (ready && linkToken && !plaidLinked) {
      open();
    }
  }, [ready, open, linkToken, plaidLinked]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-big-grinch">
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
          <div className="flex flex-col items-center mb-6">
            <img src="/appicon-rounded.png" alt="WeBudget Logo" className="w-16 h-16 mb-2" />
            <p className="text-gray-600 text-center">To get started, please link your bank account.</p>
          </div>

          <button
            onClick={() => ready && open()}
            disabled={!ready || loadingLinkToken}
            className="w-full py-2 px-4 bg-big-grinch text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loadingLinkToken
              ? 'Loading Plaid...'
              : !ready
              ? 'Initializing...'
              : 'Connect with Plaid'}
          </button>

          <button
            onClick={async () => {
              const token = await getAccessToken();
              if (!token) return;

              const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
              await fetch(`${API_BASE}/api/v1/users/onboarding`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ has_onboarded: true }),
              });

              navigate('/dashboard');
            }}
            className="mt-4 w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Skip for now
          </button>

          {plaidLinked && (
            <p className="mt-4 text-green-600 font-semibold text-center">✅ Bank account linked!</p>
          )}
        </div>
      </div>

      <div className="py-6 text-white text-xs text-center">
        &copy; {new Date().getFullYear()} WeBudget. All rights reserved.
        <button
          onClick={handleLogout}
          className="block mt-2 text-white underline hover:text-gray-200 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
