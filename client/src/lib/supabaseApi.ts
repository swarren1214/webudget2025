import { supabase } from "@/lib/supabaseClient";
import {
  type Account,
  type Transaction,
  type BudgetCategory,
  type Transfer,
  type InsertAccount,
  type InsertTransaction,
  type InsertBudgetCategory,
  type InsertTransfer,
} from "@shared/schema";

// ------------------------
// Auth & User
// ------------------------
export type User = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export const getCurrentUser = async (): Promise<User> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error || new Error("No user found");

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: data.user.user_metadata?.fullName ?? "",
    createdAt: data.user.created_at,
  };
};

export const login = async (
  email: string,
  password: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw error || new Error("Login failed");

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: data.user.user_metadata?.fullName ?? "",
    createdAt: data.user.created_at,
  };
};

export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  fullName: string;
}): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        username: userData.username,
        fullName: userData.fullName,
      },
    },
  });
  if (error || !data.user) throw error || new Error("User registration failed");

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: data.user.user_metadata?.fullName ?? "",
    createdAt: data.user.created_at,
  };
};

// ------------------------
// Accounts
// ------------------------
export const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*");
  if (error) throw error;
  return data;
};

export const getAccount = async (id: number): Promise<Account> => {
  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};

export const createAccount = async (accountData: InsertAccount): Promise<Account> => {
  const { data, error } = await supabase.from("accounts").insert(accountData).single();
  if (error) throw error;
  return data;
};

export const updateAccount = async (
  id: number,
  accountData: Partial<InsertAccount>
): Promise<Account> => {
  const { data, error } = await supabase.from("accounts").update(accountData).eq("id", id).single();
  if (error) throw error;
  return data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
};

// ------------------------
// Transactions
// ------------------------
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from("transactions").select("*");
  if (error) throw error;
  return data;
};

export const getRecentTransactions = async (
  limit: number = 10
): Promise<Transaction[]> => {
  const { data, error } = await supabase.from("transactions").select("*").limit(limit);
  if (error) throw error;
  return data;
};

export const getAccountTransactions = async (
  accountId: number
): Promise<Transaction[]> => {
  const { data, error } = await supabase.from("transactions").select("*").eq("account_id", accountId);
  if (error) throw error;
  return data;
};

export const createTransaction = async (
  transactionData: InsertTransaction
): Promise<Transaction> => {
  const { data, error } = await supabase.from("transactions").insert(transactionData).single();
  if (error) throw error;
  return data;
};

export const updateTransaction = async (
  id: number,
  transactionData: Partial<InsertTransaction>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from("transactions")
    .update(transactionData)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const deleteTransaction = async (id: number): Promise<void> => {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
};

// ------------------------
// Budget Categories
// ------------------------
export const getBudgetCategories = async (): Promise<BudgetCategory[]> => {
  const { data, error } = await supabase.from("budget_categories").select("*");
  if (error) throw error;
  return data;
};

export const createBudgetCategory = async (
  categoryData: InsertBudgetCategory
): Promise<BudgetCategory> => {
  const { data, error } = await supabase.from("budget_categories").insert(categoryData).single();
  if (error) throw error;
  return data;
};

export const updateBudgetCategory = async (
  id: number,
  categoryData: Partial<InsertBudgetCategory>
): Promise<BudgetCategory> => {
  const { data, error } = await supabase
    .from("budget_categories")
    .update(categoryData)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const deleteBudgetCategory = async (id: number): Promise<void> => {
  const { error } = await supabase.from("budget_categories").delete().eq("id", id);
  if (error) throw error;
};

// ------------------------
// Transfers
// ------------------------
export const getTransfers = async (): Promise<Transfer[]> => {
  const { data, error } = await supabase.from("transfers").select("*");
  if (error) throw error;
  return data;
};

export const getTransfer = async (id: number): Promise<Transfer> => {
  const { data, error } = await supabase.from("transfers").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};

export const createTransfer = async (transferData: InsertTransfer): Promise<Transfer> => {
  const { data, error } = await supabase.from("transfers").insert(transferData).single();
  if (error) throw error;
  return data;
};

// ------------------------
// RPC (Plaid sync)
// ------------------------
export const exchangePlaidPublicToken = async (
  publicToken: string,
  accountId: number
): Promise<{ message: string }> => {
  const { data, error } = await supabase.rpc("exchange_public_token", {
    public_token: publicToken,
    account_id: accountId,
  });
  if (error) throw error;
  return data;
};

export const syncTransactions = async (
  accountId: number
): Promise<{ message: string }> => {
  const { data, error } = await supabase.rpc("sync_transactions", { account_id: accountId });
  if (error) throw error;
  return data;
};