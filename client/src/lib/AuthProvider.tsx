import React, { useEffect, useState, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

// ✅ Use relative path instead
import { supabase } from './supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 [AuthProvider] Setting up auth state listener...');

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 [AuthProvider] Auth state change detected:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        hasAccessToken: !!session?.access_token,
        accessTokenLength: session?.access_token?.length,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString()
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    console.log('🔍 [AuthProvider] Getting initial session...');
    supabase.auth.getSession().then(({ data }) => {
      console.log('🔍 [AuthProvider] Initial session retrieved:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        hasAccessToken: !!data.session?.access_token,
        accessTokenLength: data.session?.access_token?.length,
        userEmail: data.session?.user?.email,
        timestamp: new Date().toISOString()
      });
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('🔍 [AuthProvider] Cleaning up auth listener...');
      listener?.subscription.unsubscribe();
    };
  }, []);

  console.log('🔍 [AuthProvider] Current context state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    timestamp: new Date().toISOString()
  });

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
