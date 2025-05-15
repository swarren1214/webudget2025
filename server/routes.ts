import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertAccountSchema,
  insertTransactionSchema,
  insertBudgetCategorySchema,
  insertTransferSchema,
  plaidExchangeSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const emailExists = await storage.getUserByEmail(userData.email);
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      return res.status(201).json({ id: user.id, username: user.username, email: user.email, fullName: user.fullName });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would use JWT or sessions
      // For this example, we'll just return the user info
      return res.status(200).json({ 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        fullName: user.fullName 
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users/me", async (req: Request, res: Response) => {
    try {
      // In a real app, you would get the user ID from session/JWT
      // For this example, we'll use a demo user
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({ 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        fullName: user.fullName 
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Account routes
  app.get("/api/accounts", async (req: Request, res: Response) => {
    try {
      // In a real app, you would get the user ID from session/JWT
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const accounts = await storage.getAccounts(user.id);
      return res.status(200).json(accounts);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      return res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      return res.status(200).json(account);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(accountId, accountData);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      return res.status(200).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      const deleted = await storage.deleteAccount(accountId);
      if (!deleted) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      // In a real app, you would get the user ID from session/JWT
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const transactions = await storage.getTransactionsByUser(user.id);
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/transactions/recent", async (req: Request, res: Response) => {
    try {
      // In a real app, you would get the user ID from session/JWT
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getRecentTransactions(user.id, limit);
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/accounts/:accountId/transactions", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.accountId);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const transactions = await storage.getTransactions(accountId);
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // Check if account exists
      const account = await storage.getAccount(transactionData.accountId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const transaction = await storage.createTransaction(transactionData);
      
      // Update account balance
      if (transactionData.isIncome) {
        await storage.updateAccount(account.id, {
          balance: account.balance + transactionData.amount
        });
      } else {
        await storage.updateAccount(account.id, {
          balance: account.balance - transactionData.amount
        });
      }
      
      return res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      return res.status(200).json(transaction);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(transactionId, transactionData);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      return res.status(200).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const deleted = await storage.deleteTransaction(transactionId);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Budget Category routes
  app.get("/api/budget-categories", async (req: Request, res: Response) => {
    try {
      // In a real app, you would get the user ID from session/JWT
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const categories = await storage.getBudgetCategories(user.id);
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/budget-categories", async (req: Request, res: Response) => {
    try {
      const categoryData = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(categoryData);
      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/budget-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getBudgetCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(200).json(category);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/budget-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const categoryData = insertBudgetCategorySchema.partial().parse(req.body);
      const category = await storage.updateBudgetCategory(categoryId, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(200).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/budget-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const deleted = await storage.deleteBudgetCategory(categoryId);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Transfer routes
  app.get("/api/transfers", async (req: Request, res: Response) => {
    try {
      // In a real app, you would get the user ID from session/JWT
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const transfers = await storage.getTransfers(user.id);
      return res.status(200).json(transfers);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/transfers", async (req: Request, res: Response) => {
    try {
      const transferData = insertTransferSchema.parse(req.body);
      
      // Check if accounts exist
      const fromAccount = await storage.getAccount(transferData.fromAccountId);
      if (!fromAccount) {
        return res.status(404).json({ message: "Source account not found" });
      }
      
      const toAccount = await storage.getAccount(transferData.toAccountId);
      if (!toAccount) {
        return res.status(404).json({ message: "Destination account not found" });
      }
      
      // Check sufficient funds
      if (fromAccount.balance < transferData.amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      const transfer = await storage.createTransfer(transferData);
      return res.status(201).json(transfer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/transfers/:id", async (req: Request, res: Response) => {
    try {
      const transferId = parseInt(req.params.id);
      if (isNaN(transferId)) {
        return res.status(400).json({ message: "Invalid transfer ID" });
      }
      
      const transfer = await storage.getTransfer(transferId);
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      return res.status(200).json(transfer);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Plaid API routes
  app.post("/api/plaid/create-link-token", async (req: Request, res: Response) => {
    try {
      // Get the user ID (in a real app, this would come from the session)
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Import the Plaid functions
      const { createLinkToken } = await import('./plaid');
      
      // Create a link token
      const linkTokenResponse = await createLinkToken(user.id);
      return res.status(200).json({ link_token: linkTokenResponse.link_token });
    } catch (error) {
      console.error('Error creating link token:', error);
      return res.status(500).json({ message: "Error creating link token" });
    }
  });

  app.post("/api/plaid/exchange-public-token", async (req: Request, res: Response) => {
    try {
      const { publicToken } = plaidExchangeSchema.parse(req.body);
      
      // Import the Plaid functions
      const { exchangePublicToken, getPlaidAccounts } = await import('./plaid');
      
      // Exchange the public token for an access token
      const exchangeResponse = await exchangePublicToken(publicToken);
      const accessToken = exchangeResponse.access_token;
      const itemId = exchangeResponse.item_id;
      
      // Get the user (in a real app, this would come from the session)
      const user = await storage.getUserByUsername('demo');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get account information from Plaid
      const accountsResponse = await getPlaidAccounts(accessToken);
      
      // Create accounts in our database
      for (const account of accountsResponse.accounts) {
        await storage.createAccount({
          userId: user.id,
          name: account.name,
          type: account.type,
          balance: account.balances.current || 0,
          accountNumber: account.mask ? `****${account.mask}` : "****1234",
          institutionName: accountsResponse.item.institution_id || "Unknown Bank",
          institutionLogo: "",
          plaidAccessToken: accessToken,
          plaidItemId: itemId,
          isConnected: true
        });
      }
      
      // Return the tokens
      return res.status(200).json({ 
        access_token: accessToken,
        item_id: itemId 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
