// server/src/repositories/repository.factory.ts

import { Pool } from 'pg';
import { TransactionManager } from './transaction.manager';
import { PostgresTransactionManager } from './postgres-transaction.manager';
import { PlaidItemRepository } from './interfaces/plaid-item.repository.interface';
import { BackgroundJobRepository } from './interfaces/background-job.repository.interface';
import { UnitOfWork } from './interfaces/unit-of-work.interface';
import { PostgresPlaidItemRepository } from './postgres-plaid-item.repository';
import { PostgresBackgroundJobRepository } from './postgres-background-job.repository';
import { PostgresUnitOfWork } from './postgres-unit-of-work';

export class RepositoryFactory {
    private transactionManager: TransactionManager;
    private plaidItemRepository: PlaidItemRepository;
    private backgroundJobRepository: BackgroundJobRepository;

    constructor(private pool: Pool) {
        this.transactionManager = new PostgresTransactionManager(pool);
        this.plaidItemRepository = new PostgresPlaidItemRepository(this.transactionManager);
        this.backgroundJobRepository = new PostgresBackgroundJobRepository(this.transactionManager);
    }

    getTransactionManager(): TransactionManager {
        return this.transactionManager;
    }

    getPlaidItemRepository(): PlaidItemRepository {
        return this.plaidItemRepository;
    }

    getBackgroundJobRepository(): BackgroundJobRepository {
        return this.backgroundJobRepository;
    }

    createUnitOfWork(): UnitOfWork {
        return new PostgresUnitOfWork(this.pool);
    }
}

// Create a singleton instance
let repositoryFactory: RepositoryFactory | null = null;

export function getRepositoryFactory(pool: Pool): RepositoryFactory {
    if (!repositoryFactory) {
        repositoryFactory = new RepositoryFactory(pool);
    }
    return repositoryFactory;
}
