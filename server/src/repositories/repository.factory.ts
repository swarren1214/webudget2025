// server/src/repositories/repository.factory.ts

import { Pool } from 'pg';
import { PlaidItemRepository } from './interfaces/plaid-item.repository.interface';
import { BackgroundJobRepository } from './interfaces/background-job.repository.interface';
import { UnitOfWork } from './interfaces/unit-of-work.interface';
import { PostgresPlaidItemRepository } from './postgres-plaid-item.repository';
import { PostgresBackgroundJobRepository } from './postgres-background-job.repository';
import { PostgresUnitOfWork } from './postgres-unit-of-work';

export class RepositoryFactory {
    private plaidItemRepository: PlaidItemRepository;
    private backgroundJobRepository: BackgroundJobRepository;

    constructor(private pool: Pool) {
        // Instantiate repositories with the main pool for non-transactional, single queries.
        this.plaidItemRepository = new PostgresPlaidItemRepository(this.pool);
        this.backgroundJobRepository = new PostgresBackgroundJobRepository(this.pool);
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
