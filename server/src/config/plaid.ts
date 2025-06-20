import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import config from './env';

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
    basePath: PlaidEnvironments[config.PLAID_ENV],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': config.PLAID_CLIENT_ID,
            'PLAID-SECRET': config.PLAID_SECRET,
        },
    },
});

const plaidClient = new PlaidApi(configuration);

export default plaidClient;
