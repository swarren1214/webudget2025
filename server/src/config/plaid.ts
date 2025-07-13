import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import config from './env';
import { validateRequiredEnvVars } from '../utils/validation';
import { ApiError } from '../utils/errors';

const { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV } = process.env;

// A critical check to ensure the server doesn't start without
// the necessary Plaid credentials.
validateRequiredEnvVars({
    PLAID_CLIENT_ID,
    PLAID_SECRET,
    PLAID_ENV
});

// Validate the Plaid environment.
const plaidEnv = PLAID_ENV as keyof typeof PlaidEnvironments;
if (!PlaidEnvironments[plaidEnv]) {
    throw new ApiError(`Invalid PLAID_ENV: ${PLAID_ENV}. Must be one of ${Object.keys(PlaidEnvironments).join(', ')}`, 500);
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
