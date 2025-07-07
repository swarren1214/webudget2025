import React from "react";
import { AuthProvider } from "@/lib/AuthProvider";
import { Route, Switch, Redirect } from "wouter";
import Layout from "@/components//layout/Layout";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Transfers from "@/pages/Transfers";
 import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from "./lib/queryClient";


// Auth guard (optional, if you have one)
function RequireAuth({ children }: { children: React.ReactNode }) {
  // Use your existing auth logic here
  // Example:
  // const { user, loading } = useAuth();
  // if (loading) return <div>Loading...</div>;
  // if (!user) return <Redirect to="/login" />;
  // return <>{children}</>;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <RequireAuth>
            <Layout>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/accounts" component={Accounts} />
                <Route path="/transactions" component={Transactions} />
                <Route path="/budgets" component={Budgets} />
                <Route path="/transfers" component={Transfers} />
                {/* Redirect root to dashboard */}
                <Route path="/" component={() => <Redirect to="/dashboard" />} />
                {/* 404 fallback */}
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
