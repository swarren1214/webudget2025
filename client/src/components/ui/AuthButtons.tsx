import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';

export const LoginButton: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading || user) return null;

  const handleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Log In
    </button>
  );
};

export const LogoutButton: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading || !user) return null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-2"
    >
      Log Out
    </button>
  );
};
