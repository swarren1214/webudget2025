import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

const { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV } = process.env;

// A critical check to ensure the server doesn't start without
// the necessary Plaid credentials.
if (!PLAID_CLIENT_ID || !PLAID_SECRET || !PLAID_ENV) {
    throw new Error('PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV must be set.');
}

// Validate the Plaid environment.
const plaidEnv = PLAID_ENV as keyof typeof PlaidEnvironments;
if (!PlaidEnvironments[plaidEnv]) {
    throw new Error(`Invalid PLAID_ENV: ${PLAID_ENV}. Must be one of ${Object.keys(PlaidEnvironments).join(', ')}`);
}

const configuration = new Configuration({
    basePath: PlaidEnvironments[plaidEnv],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
            'PLAID-SECRET': PLAID_SECRET,
        },
    },
});

const plaidClient = new PlaidApi(configuration);

export default plaidClient;
