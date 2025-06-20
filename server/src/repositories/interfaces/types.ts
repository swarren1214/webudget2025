// server/src/repositories/interfaces/types.ts

/**
 * Common query options for repository methods
 */
export interface QueryOptions {
    /**
     * Include soft-deleted (archived) records
     */
    includeArchived?: boolean;

    /**
     * Limit the number of results
     */
    limit?: number;

    /**
     * Offset for pagination
     */
    offset?: number;

    /**
     * Order by configuration
     */
    orderBy?: {
        field: string;
        direction: 'ASC' | 'DESC';
    };
}

/**
 * Result type for paginated queries
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    limit: number;
    offset: number;
}

/**
 * Generic repository interface that all repositories can extend
 */
export interface BaseRepository<T, CreateData, UpdateData> {
    create(data: CreateData): Promise<T>;
    findById(id: number | string): Promise<T | null>;
    update(id: number | string, data: UpdateData): Promise<T>;
    delete(id: number | string): Promise<void>;
}
