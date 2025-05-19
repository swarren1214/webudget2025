import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  TransferType,
  TransferNetwork,
  ACHClass
} from 'plaid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Sanity check logs
console.log('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID);
console.log('PLAID_SECRET:', process.env.PLAID_SECRET);
console.log('PLAID_ENV:', process.env.PLAID_ENV);

// Fail fast if missing
if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  throw new Error("Missing PLAID_CLIENT_ID or PLAID_SECRET in environment.");
}

// Correct casing for Plaid headers (they are case-sensitive!)
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
      'Plaid-Version': '2020-09-14'
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// createLinkToken
export async function createLinkToken(userId: number) {
  try {
    const linkTokenConfig = {
      user: {
        client_user_id: userId.toString(),
      },
      client_name: 'WeBudget',
      products: process.env.PLAID_PRODUCTS
        ? process.env.PLAID_PRODUCTS.split(',') as Products[]
        : [Products.Transactions, Products.Auth, Products.Liabilities],
      country_codes: process.env.PLAID_COUNTRY_CODES
        ? process.env.PLAID_COUNTRY_CODES.split(',') as CountryCode[]
        : [CountryCode.Us],
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI,
    };

    console.log("Creating link token with config:", JSON.stringify(linkTokenConfig, null, 2));
    const response = await plaidClient.linkTokenCreate(linkTokenConfig);
    console.log("Link token created successfully");
    return response.data;
  } catch (error: any) {
    console.error('Error creating link token:', error);
    if (error.response?.data) {
      console.error('Plaid API error details:', error.response.data);
    }
    throw error;
  }
}

// exchangePublicToken
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    return response.data;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

// getPlaidAccounts
export async function getPlaidAccounts(accessToken: string) {
  try {
    const response = await plaidClient.accountsGet({ access_token: accessToken });
    return response.data;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
}

// getPlaidTransactions
export async function getPlaidTransactions(accessToken: string, startDate: string, endDate: string) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

// syncPlaidTransactions
export async function syncPlaidTransactions(accessToken: string, accountId: number, storage: any) {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let allTransactions: any[] = [];
    let hasMore = true;
    let cursor: string | null = null;

    while (hasMore) {
      const request: any = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { include_personal_finance_category: true }
      };
      if (cursor) request.options.cursor = cursor;

      const response = await plaidClient.transactionsGet(request);
      const data = response.data;
      allTransactions = allTransactions.concat(data.transactions);
      hasMore = data.has_more || false;
      cursor = data.next_cursor || null;
    }

    console.log(`Fetched ${allTransactions.length} transactions from Plaid`);
    const existingTransactions = await storage.getTransactions(accountId);
    console.log(`Found ${existingTransactions.length} existing transactions`);

    const existingMap = new Map(existingTransactions.map((t: any) => [t.plaidTransactionId, t]));
    let newCount = 0;

    for (const tx of allTransactions) {
      if (existingMap.has(tx.transaction_id)) continue;
      await storage.createTransaction({
        accountId,
        plaidTransactionId: tx.transaction_id,
        amount: Math.abs(tx.amount),
        isIncome: tx.amount > 0,
        description: tx.name,
        category: tx.category?.[0] || 'Uncategorized',
        date: tx.date,
        pending: tx.pending,
      });
      newCount++;
    }

    console.log(`Added ${newCount} new transactions`);
    return newCount;
  } catch (error: any) {
    console.error('Error syncing Plaid transactions:', error);
    if (error.response?.data) {
      console.error('Plaid API error details:', error.response.data);
    }
    throw error;
  }
}

// createPlaidTransfer
export async function createPlaidTransfer({
  accessToken,
  amount,
  user,
  fromAccountPlaidId,
  description = "Sandbox ACH transfer"
}: {
  accessToken: string,
  amount: number,
  user: { legalName: string, email: string },
  fromAccountPlaidId: string,
  description?: string
}) {
  try {
    const authorizationResp = await plaidClient.transferAuthorizationCreate({
      access_token: accessToken,
      account_id: fromAccountPlaidId,
      type: 'credit',
      network: 'ach',
      amount: amount.toFixed(2),
      ach_class: 'ppd',
      user: {
        legal_name: user.legalName,
        email_address: user.email,
      },
    });

    const authorizationId = authorizationResp.data.authorization.id;

    const transferResp = await plaidClient.transferCreate({
      access_token: accessToken,
      account_id: fromAccountPlaidId,
      authorization_id: authorizationId,
      type: 'credit',
      network: 'ach',
      amount: amount.toFixed(2),
      description,
      ach_class: 'ppd',
      user: {
        legal_name: user.legalName,
        email_address: user.email,
      },
    });

    return {
      plaidTransferId: transferResp.data.transfer.id,
      status: transferResp.data.transfer.status,
    };
  } catch (error: any) {
    console.error("Error creating Plaid transfer:", error);
    if (error.response?.data) {
      console.error("Plaid API error details:", error.response.data);
    }
    throw error;
  }
}
