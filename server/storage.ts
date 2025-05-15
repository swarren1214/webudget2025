import {
  users, type User, type InsertUser,
  accounts, type Account, type InsertAccount,
  transactions, type Transaction, type InsertTransaction,
  budgetCategories, type BudgetCategory, type InsertBudgetCategory,
  transfers, type Transfer, type InsertTransfer
} from "@shared/schema";

// Storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Account operations
  getAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Transaction operations
  getTransactions(accountId: number): Promise<Transaction[]>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  getRecentTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  // Budget Category operations
  getBudgetCategories(userId: number): Promise<BudgetCategory[]>;
  getBudgetCategory(id: number): Promise<BudgetCategory | undefined>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: number, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: number): Promise<boolean>;
  
  // Transfer operations
  getTransfers(userId: number): Promise<Transfer[]>;
  getTransfer(id: number): Promise<Transfer | undefined>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  updateTransfer(id: number, transfer: Partial<InsertTransfer>): Promise<Transfer | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private budgetCategories: Map<number, BudgetCategory>;
  private transfers: Map<number, Transfer>;
  
  private currentUserId: number;
  private currentAccountId: number;
  private currentTransactionId: number;
  private currentBudgetCategoryId: number;
  private currentTransferId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.budgetCategories = new Map();
    this.transfers = new Map();
    
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentTransactionId = 1;
    this.currentBudgetCategoryId = 1;
    this.currentTransferId = 1;
    
    // Add some initial data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Account methods
  async getAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId,
    );
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = { ...insertAccount, id };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, accountUpdate: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...accountUpdate };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Transaction methods
  async getTransactions(accountId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.accountId === accountId,
    );
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    const userAccounts = await this.getAccounts(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    return Array.from(this.transactions.values()).filter(
      (transaction) => accountIds.includes(transaction.accountId),
    );
  }

  async getRecentTransactions(userId: number, limit: number = 10): Promise<Transaction[]> {
    const transactions = await this.getTransactionsByUser(userId);
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { ...insertTransaction, id };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionUpdate };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Budget Category methods
  async getBudgetCategories(userId: number): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values()).filter(
      (category) => category.userId === userId,
    );
  }

  async getBudgetCategory(id: number): Promise<BudgetCategory | undefined> {
    return this.budgetCategories.get(id);
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const id = this.currentBudgetCategoryId++;
    const category: BudgetCategory = { ...insertCategory, id };
    this.budgetCategories.set(id, category);
    return category;
  }

  async updateBudgetCategory(id: number, categoryUpdate: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const category = this.budgetCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryUpdate };
    this.budgetCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteBudgetCategory(id: number): Promise<boolean> {
    return this.budgetCategories.delete(id);
  }

  // Transfer methods
  async getTransfers(userId: number): Promise<Transfer[]> {
    const userAccounts = await this.getAccounts(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    return Array.from(this.transfers.values()).filter(
      (transfer) => accountIds.includes(transfer.fromAccountId) || accountIds.includes(transfer.toAccountId),
    );
  }

  async getTransfer(id: number): Promise<Transfer | undefined> {
    return this.transfers.get(id);
  }

  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const id = this.currentTransferId++;
    const transfer: Transfer = { ...insertTransfer, id };
    this.transfers.set(id, transfer);
    
    // Update account balances
    const fromAccount = await this.getAccount(insertTransfer.fromAccountId);
    const toAccount = await this.getAccount(insertTransfer.toAccountId);
    
    if (fromAccount && toAccount) {
      await this.updateAccount(fromAccount.id, { 
        balance: fromAccount.balance - insertTransfer.amount 
      });
      
      await this.updateAccount(toAccount.id, { 
        balance: toAccount.balance + insertTransfer.amount 
      });
    }
    
    return transfer;
  }

  async updateTransfer(id: number, transferUpdate: Partial<InsertTransfer>): Promise<Transfer | undefined> {
    const transfer = this.transfers.get(id);
    if (!transfer) return undefined;
    
    const updatedTransfer = { ...transfer, ...transferUpdate };
    this.transfers.set(id, updatedTransfer);
    return updatedTransfer;
  }

  // Seed initial data
  private seedData() {
    // Create a demo user
    const user: User = {
      id: this.currentUserId++,
      username: 'demo',
      password: 'password',
      email: 'jane@example.com',
      fullName: 'Jane Patel'
    };
    this.users.set(user.id, user);

    // Create some accounts
    const chaseAccount: Account = {
      id: this.currentAccountId++,
      userId: user.id,
      name: 'Chase Bank',
      type: 'checking',
      balance: 8942.55,
      accountNumber: '****4582',
      institutionName: 'Chase',
      plaidAccessToken: '',
      plaidItemId: '',
      institutionLogo: '',
      isConnected: true
    };
    
    const wellsFargoAccount: Account = {
      id: this.currentAccountId++,
      userId: user.id,
      name: 'Wells Fargo',
      type: 'savings',
      balance: 11280.00,
      accountNumber: '****7701',
      institutionName: 'Wells Fargo',
      plaidAccessToken: '',
      plaidItemId: '',
      institutionLogo: '',
      isConnected: true
    };
    
    const amexAccount: Account = {
      id: this.currentAccountId++,
      userId: user.id,
      name: 'Amex',
      type: 'credit',
      balance: -840.00,
      accountNumber: '****3223',
      institutionName: 'American Express',
      plaidAccessToken: '',
      plaidItemId: '',
      institutionLogo: '',
      isConnected: true
    };
    
    this.accounts.set(chaseAccount.id, chaseAccount);
    this.accounts.set(wellsFargoAccount.id, wellsFargoAccount);
    this.accounts.set(amexAccount.id, amexAccount);

    // Create budget categories
    const groceriesCategory: BudgetCategory = {
      id: this.currentBudgetCategoryId++,
      userId: user.id,
      name: 'Groceries',
      limit: 500,
      color: 'blue-500',
      icon: 'shopping_cart'
    };
    
    const diningCategory: BudgetCategory = {
      id: this.currentBudgetCategoryId++,
      userId: user.id,
      name: 'Dining Out',
      limit: 400,
      color: 'green-500',
      icon: 'restaurant'
    };
    
    const entertainmentCategory: BudgetCategory = {
      id: this.currentBudgetCategoryId++,
      userId: user.id,
      name: 'Entertainment',
      limit: 200,
      color: 'red-500',
      icon: 'movie'
    };
    
    const transportationCategory: BudgetCategory = {
      id: this.currentBudgetCategoryId++,
      userId: user.id,
      name: 'Transportation',
      limit: 250,
      color: 'purple-500',
      icon: 'local_taxi'
    };
    
    this.budgetCategories.set(groceriesCategory.id, groceriesCategory);
    this.budgetCategories.set(diningCategory.id, diningCategory);
    this.budgetCategories.set(entertainmentCategory.id, entertainmentCategory);
    this.budgetCategories.set(transportationCategory.id, transportationCategory);

    // Create some transactions
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const transaction1: Transaction = {
      id: this.currentTransactionId++,
      accountId: chaseAccount.id,
      amount: 85.40,
      description: 'Whole Foods Market',
      date: today,
      category: 'Groceries',
      isIncome: false,
      plaidTransactionId: ''
    };
    
    const transaction2: Transaction = {
      id: this.currentTransactionId++,
      accountId: chaseAccount.id,
      amount: 2450.00,
      description: 'Payroll Deposit',
      date: today,
      category: 'Income',
      isIncome: true,
      plaidTransactionId: ''
    };
    
    const transaction3: Transaction = {
      id: this.currentTransactionId++,
      accountId: chaseAccount.id,
      amount: 24.50,
      description: 'Shake Shack',
      date: yesterday,
      category: 'Dining Out',
      isIncome: false,
      plaidTransactionId: ''
    };
    
    const transaction4: Transaction = {
      id: this.currentTransactionId++,
      accountId: chaseAccount.id,
      amount: 18.75,
      description: 'Uber',
      date: yesterday,
      category: 'Transportation',
      isIncome: false,
      plaidTransactionId: ''
    };
    
    const transaction5: Transaction = {
      id: this.currentTransactionId++,
      accountId: chaseAccount.id,
      amount: 32.00,
      description: 'AMC Theaters',
      date: yesterday,
      category: 'Entertainment',
      isIncome: false,
      plaidTransactionId: ''
    };
    
    this.transactions.set(transaction1.id, transaction1);
    this.transactions.set(transaction2.id, transaction2);
    this.transactions.set(transaction3.id, transaction3);
    this.transactions.set(transaction4.id, transaction4);
    this.transactions.set(transaction5.id, transaction5);
  }
}

export const storage = new MemStorage();
