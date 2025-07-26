// client/src/lib/backendApi.ts

import { InsertAccount } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

export async function createAccount(accountData: InsertAccount) {
  const res = await apiFetch("/accounts", {
    method: "POST",
    body: JSON.stringify(accountData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create account");
  }

  return res.json();
}


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
}

interface ExchangePlaidResponse {
  message: string;
}

/**
 * Helper to make a fetch request to the backend API with credentials and JSON headers
 */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;

  if (!token) {
    console.warn('Supabase session token is missing. Ensure the user is logged in.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('Authorization Header:', headers.Authorization);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Create a new Plaid Link Token
 */
export async function createPlaidLinkToken(): Promise<PlaidLinkTokenResponse> {
  return apiFetch<PlaidLinkTokenResponse>('/plaid/create-link-token', {
    method: 'POST'
  });
}

/**
 * Exchange Plaid Public Token with the backend
 */
export async function exchangePlaidPublicToken(publicToken: string, accountId: number): Promise<ExchangePlaidResponse> {
  return apiFetch<ExchangePlaidResponse>('/plaid/exchange-public-token', {
    method: 'POST',
    body: JSON.stringify({ publicToken, accountId })
  });
}


/**
 * Sync transactions for a specific account
 * @param accountId - The ID of the account to sync transactions for
 */
export async function syncTransactions(accountId: number) {
  const res = await apiFetch(`/transactions/sync`, {
    method: "POST",
    body: JSON.stringify({ accountId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to sync transactions");
  }

  return res.json();
}


// Fetch budget categories from the backend API
import { BudgetCategory } from "@shared/schema";

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
  const res = await apiFetch("/budget-categories");

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch budget categories");
  }

  return res.json();
}

// Add more backend API helpers here as needed