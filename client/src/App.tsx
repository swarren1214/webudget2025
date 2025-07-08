import React, { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/AuthProvider";
import { Route, Switch, Redirect } from "wouter";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/Login";
import SignUpPage from "@/pages/SignUp"; // ✅ Added import
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Transfers from "@/pages/Transfers";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { supabase } from "@/lib/supabaseClient";

// ✅ Real auth guard using Supabase session
function RequireAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data?.session);
    };

    checkSession();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // or your loading skeleton
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignUpPage} /> {/* ✅ New public route */}
          <Route>
            <RequireAuth>
              <Layout>
                <Switch>
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/accounts" component={Accounts} />
                  <Route path="/transactions" component={Transactions} />
                  <Route path="/budgets" component={Budgets} />
                  <Route path="/transfers" component={Transfers} />
                  <Route path="/" component={() => <Redirect to="/dashboard" />} />
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
