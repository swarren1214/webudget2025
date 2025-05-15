import { apiRequest } from "./queryClient";
import { 
  type User, 
  type Account, 
  type Transaction, 
  type BudgetCategory, 
  type Transfer,
  type InsertAccount,
  type InsertTransaction,
  type InsertBudgetCategory,
  type InsertTransfer
} from "@shared/schema";

// User API functions
export const getCurrentUser = async (): Promise<User> => {
  const res = await apiRequest("GET", "/api/users/me");
  return res.json();
};

export const login = async (username: string, password: string): Promise<User> => {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  return res.json();
};

export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  fullName: string;
}): Promise<User> => {
  const res = await apiRequest("POST", "/api/auth/register", userData);
  return res.json();
};

// Account API functions
export const getAccounts = async (): Promise<Account[]> => {
  const res = await apiRequest("GET", "/api/accounts");
  return res.json();
};

export const getAccount = async (id: number): Promise<Account> => {
  const res = await apiRequest("GET", `/api/accounts/${id}`);
  return res.json();
};

export const createAccount = async (accountData: InsertAccount): Promise<Account> => {
  const res = await apiRequest("POST", "/api/accounts", accountData);
  return res.json();
};

export const updateAccount = async (id: number, accountData: Partial<InsertAccount>): Promise<Account> => {
  const res = await apiRequest("PUT", `/api/accounts/${id}`, accountData);
  return res.json();
};

export const deleteAccount = async (id: number): Promise<void> => {
  await apiRequest("DELETE", `/api/accounts/${id}`);
};

// Transaction API functions
export const getTransactions = async (): Promise<Transaction[]> => {
  const res = await apiRequest("GET", "/api/transactions");
  return res.json();
};

export const getRecentTransactions = async (limit?: number): Promise<Transaction[]> => {
  const url = limit ? `/api/transactions/recent?limit=${limit}` : "/api/transactions/recent";
  const res = await apiRequest("GET", url);
  return res.json();
};

export const getAccountTransactions = async (accountId: number): Promise<Transaction[]> => {
  const res = await apiRequest("GET", `/api/accounts/${accountId}/transactions`);
  return res.json();
};

export const createTransaction = async (transactionData: InsertTransaction): Promise<Transaction> => {
  const res = await apiRequest("POST", "/api/transactions", transactionData);
  return res.json();
};

export const updateTransaction = async (id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction> => {
  const res = await apiRequest("PUT", `/api/transactions/${id}`, transactionData);
  return res.json();
};

export const deleteTransaction = async (id: number): Promise<void> => {
  await apiRequest("DELETE", `/api/transactions/${id}`);
};

// Budget Category API functions
export const getBudgetCategories = async (): Promise<BudgetCategory[]> => {
  const res = await apiRequest("GET", "/api/budget-categories");
  return res.json();
};

export const createBudgetCategory = async (categoryData: InsertBudgetCategory): Promise<BudgetCategory> => {
  const res = await apiRequest("POST", "/api/budget-categories", categoryData);
  return res.json();
};

export const updateBudgetCategory = async (id: number, categoryData: Partial<InsertBudgetCategory>): Promise<BudgetCategory> => {
  const res = await apiRequest("PUT", `/api/budget-categories/${id}`, categoryData);
  return res.json();
};

export const deleteBudgetCategory = async (id: number): Promise<void> => {
  await apiRequest("DELETE", `/api/budget-categories/${id}`);
};

// Transfer API functions
export const getTransfers = async (): Promise<Transfer[]> => {
  const res = await apiRequest("GET", "/api/transfers");
  return res.json();
};

export const createTransfer = async (transferData: InsertTransfer): Promise<Transfer> => {
  const res = await apiRequest("POST", "/api/transfers", transferData);
  return res.json();
};

export const getTransfer = async (id: number): Promise<Transfer> => {
  const res = await apiRequest("GET", `/api/transfers/${id}`);
  return res.json();
};

// Plaid API functions
export const createPlaidLinkToken = async (): Promise<{ link_token: string }> => {
  const res = await apiRequest("POST", "/api/plaid/create-link-token");
  return res.json();
};

export const exchangePlaidPublicToken = async (publicToken: string): Promise<{ access_token: string; item_id: string }> => {
  const res = await apiRequest("POST", "/api/plaid/exchange-public-token", { publicToken });
  return res.json();
};
