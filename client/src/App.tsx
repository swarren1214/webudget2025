import React, { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/AuthProvider";
import { Route, Switch, Redirect, useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/Login";
import SignUpPage from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Transfers from "@/pages/Transfers";
import Onboarding from "@/pages/Onboarding";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { supabase } from "@/lib/supabaseClient";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      setIsAuthenticated(!!session);

      if (session?.user?.id) {
        const { data: userData } = await supabase
          .from("users")
          .select("has_onboarded")
          .eq("supabase_user_id", session.user.id)
          .single();

        setHasOnboarded(userData?.has_onboarded ?? false);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // Signed out — immediately redirect to /login
        setIsAuthenticated(false);
        setHasOnboarded(null);
        navigate("/login");
      } else {
        checkSession();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (isAuthenticated === null || hasOnboarded === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!hasOnboarded) {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Switch>
          {/* Public Routes */}
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignUpPage} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/" component={() => <Redirect to="/login" />} />

          {/* Protected Routes */}
          <Route>
            <RequireAuth>
              <Layout>
                <Switch>
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/accounts" component={Accounts} />
                  <Route path="/transactions" component={Transactions} />
                  <Route path="/budgets" component={Budgets} />
                  <Route path="/transfers" component={Transfers} />
                  <Route>Page not found</Route>
                </Switch>
              </Layout>
            </RequireAuth>
          </Route>
        </Switch>
      </QueryClientProvider>
    </AuthProvider>
  );
}