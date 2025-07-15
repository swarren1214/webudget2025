// server/src/repositories/interfaces/plaid-types.ts

export type ItemStatus = 'good' | 'syncing' | 'relink_required' | 'error';

export interface PlaidItemToCreate {
    userId: string;
    encryptedAccessToken: string;
    plaidItemId: string;
    plaidInstitutionId: string;
    institutionName: string;
}

export interface PlaidItem {
    id: number;
    user_id: string;
    plaid_item_id: string;
    plaid_access_token: string;
    plaid_institution_id: string;
    institution_name: string;
    sync_status: ItemStatus;
    last_successful_sync: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
}
