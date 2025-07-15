// server/src/repositories/postgres-background-job.repository.ts

import {
    BackgroundJobRepository,
    BackgroundJob,
    CreateBackgroundJobData
} from './interfaces/background-job.repository.interface';
import { DbConnection } from './interfaces';
import logger from '../logger';

export class PostgresBackgroundJobRepository implements BackgroundJobRepository {
    constructor(private db: DbConnection) { }

    async create(jobData: CreateBackgroundJobData): Promise<BackgroundJob> {
        const query = `
            INSERT INTO background_jobs (job_type, payload, status)
            VALUES ($1, $2, 'queued')
            RETURNING *
        `;

        const values = [
            jobData.jobType,
            JSON.stringify(jobData.payload)
        ];

        const result = await this.db.query(query, values);
        const job = this.mapToBackgroundJob(result.rows[0]);

        logger.info('Created background job', {
            jobType: jobData.jobType,
            jobId: job.id
        });

        return job;
    }

    async findNextAvailable(jobTypes?: string[]): Promise<BackgroundJob | null> {
        let query = `
            SELECT * FROM background_jobs
            WHERE status = 'queued'
        `;

        const values: any[] = [];

        if (jobTypes && jobTypes.length > 0) {
            query += ` AND job_type = ANY($1)`;
            values.push(jobTypes);
        }

        query += ` ORDER BY created_at ASC
                   LIMIT 1
                   FOR UPDATE SKIP LOCKED`;

        const result = await this.db.query(query, values);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToBackgroundJob(result.rows[0]);
    }

    async markAsRunning(id: number): Promise<BackgroundJob> {
        const query = `
            UPDATE background_jobs
            SET status = 'running', 
                last_attempt_at = NOW(),
                attempts = attempts + 1
            WHERE id = $1
            RETURNING *
        `;

        const result = await this.db.query(query, [id]);

        if (result.rows.length === 0) {
            throw new Error(`Background job with ID ${id} not found`);
        }

        return this.mapToBackgroundJob(result.rows[0]);
    }

    async markAsCompleted(id: number): Promise<BackgroundJob> {
        const query = `
            UPDATE background_jobs
            SET status = 'completed'
            WHERE id = $1
            RETURNING *
        `;

        const result = await this.db.query(query, [id]);

        if (result.rows.length === 0) {
            throw new Error(`Background job with ID ${id} not found`);
        }

        logger.info('Background job completed', { jobId: id });
        return this.mapToBackgroundJob(result.rows[0]);
    }

    async markAsFailed(id: number, error: string): Promise<BackgroundJob> {
        const query = `
            UPDATE background_jobs
            SET status = 'failed',
                last_error = $2
            WHERE id = $1
            RETURNING *
        `;

        const result = await this.db.query(query, [id, error]);

        if (result.rows.length === 0) {
            throw new Error(`Background job with ID ${id} not found`);
        }

        logger.error('Background job failed', { jobId: id, error });
        return this.mapToBackgroundJob(result.rows[0]);
    }

    private mapToBackgroundJob(row: any): BackgroundJob {
        return {
            id: row.id,
            jobType: row.job_type,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
            status: row.status,
            attempts: row.attempts || 0,
            lastAttemptAt: row.last_attempt_at ? new Date(row.last_attempt_at) : undefined,
            lastError: row.last_error,
            createdAt: new Date(row.created_at)
        };
    }
}
