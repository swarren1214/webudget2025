import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, TransferType, TransferNetwork, ACHClass } from 'plaid';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Function to create a link token
export async function createLinkToken(userId: number) {
  try {
    // Define the configuration for the link token
    const linkTokenConfig = {
      user: {
        client_user_id: userId.toString(),
      },
      client_name: 'WeBudget',
      products: [Products.Transactions, Products.Auth, Products.Liabilities],
      country_codes: [CountryCode.Us],
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI,
    };

    // Create the link token with the configuration
    console.log("Creating link token with config:", JSON.stringify(linkTokenConfig, null, 2));
    const response = await plaidClient.linkTokenCreate(linkTokenConfig);
    console.log("Link token created successfully");
    return response.data;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

// Function to exchange public token for access token
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

// Function to get accounts from Plaid
export async function getPlaidAccounts(accessToken: string) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
}

// Function to get transactions from Plaid
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

// Function to sync Plaid transactions to local storage
export async function syncPlaidTransactions(accessToken: string, accountId: number, storage: any) {
  try {
    // Get transactions for the last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let allTransactions: any[] = [];
    let hasMore = true;
    let cursor: string | null = null;
    
    // Fetch all pages of transactions
    while (hasMore) {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          include_personal_finance_category: true
        }
      } as any;
      
      if (cursor) {
        request.options.cursor = cursor;
      }
      
      const response = await plaidClient.transactionsGet(request);
      const responseData = response.data as any;
      
      allTransactions = allTransactions.concat(responseData.transactions);
      hasMore = responseData.has_more || false;
      cursor = responseData.next_cursor || null;
    }
    
    console.log(`Fetched ${allTransactions.length} transactions from Plaid`);
    
    // Get existing transactions for this account
    const existingTransactions = await storage.getTransactions(accountId);
    console.log(`Found ${existingTransactions.length} existing transactions`);
    
    // Create a map of existing transactions by Plaid transaction ID
    const existingTransactionMap = new Map(
      existingTransactions.map((t: any) => [t.plaidTransactionId, t])
    );
    
    let newTransactionsCount = 0;
    
    // Process each Plaid transaction
    for (const plaidTx of allTransactions) {
      // Skip if we already have this transaction
      if (existingTransactionMap.has(plaidTx.transaction_id)) {
        continue;
      }
      
      // Create a new transaction in our storage
      await storage.createTransaction({
        accountId,
        plaidTransactionId: plaidTx.transaction_id,
        amount: Math.abs(plaidTx.amount),
        isIncome: plaidTx.amount > 0,
        description: plaidTx.name,
        category: plaidTx.category?.[0] || 'Uncategorized',
        date: plaidTx.date,
        pending: plaidTx.pending,
      });
      
      newTransactionsCount++;
    }
    
    console.log(`Added ${newTransactionsCount} new transactions`);
    return newTransactionsCount;
  } catch (error: any) {
    console.error('Error syncing Plaid transactions:', error);
    if (error.response?.data) {
      console.error('Plaid API error details:', error.response.data);
    }
    throw error;
  }
}

// Function to create a Plaid ACH transfer
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
    // 1. Create a recipient (in sandbox, you can use a fixed recipient)
    // 2. Create a transfer authorization
    // 3. Create the transfer
    //
    // For sandbox, Plaid allows you to use test values. We'll use the same account as both sender and receiver for demo.

    // Step 1: Get account info (to get account_id)
    // (Assume fromAccountPlaidId is the Plaid account_id for the source account)

    // Step 2: Create transfer authorization
    const authorizationResp = await plaidClient.transferAuthorizationCreate({
      access_token: accessToken,
      account_id: fromAccountPlaidId,
      type: 'credit' as TransferType,
      network: 'ach' as TransferNetwork,
      amount: amount.toFixed(2),
      ach_class: 'ppd' as ACHClass,
      user: {
        legal_name: user.legalName,
        email_address: user.email,
      },
    });
    const authorizationId = authorizationResp.data.authorization.id;

    // Step 3: Create the transfer
    const transferResp = await plaidClient.transferCreate({
      access_token: accessToken,
      account_id: fromAccountPlaidId,
      authorization_id: authorizationId,
      type: 'credit' as TransferType,
      network: 'ach' as TransferNetwork,
      amount: amount.toFixed(2),
      description,
      ach_class: 'ppd' as ACHClass,
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