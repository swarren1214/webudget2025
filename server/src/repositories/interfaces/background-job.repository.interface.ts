// server/src/repositories/interfaces/background-job.repository.interface.ts

/**
 * Represents a background job to be processed
 */
export interface BackgroundJob {
    id: number;
    jobType: string;
    payload: any;
    status: 'queued' | 'running' | 'completed' | 'failed';
    attempts: number;
    lastAttemptAt?: Date;
    lastError?: string;
    createdAt: Date;
}

/**
 * Data needed to create a new background job
 */
export interface CreateBackgroundJobData {
    jobType: string;
    payload: any;
}

/**
 * Repository interface for background job management
 */
export interface BackgroundJobRepository {
    /**
     * Creates a new background job
     * @param jobData - The job type and payload
     * @returns The created job
     */
    create(jobData: CreateBackgroundJobData): Promise<BackgroundJob>;

    /**
     * Finds the next available job to process
     * @param jobTypes - Optional array of job types to filter by
     * @returns The next job or null if none available
     */
    findNextAvailable(jobTypes?: string[]): Promise<BackgroundJob | null>;

    /**
     * Marks a job as running
     * @param id - The job ID
     * @returns The updated job
     */
    markAsRunning(id: number): Promise<BackgroundJob>;

    /**
     * Marks a job as completed
     * @param id - The job ID
     * @returns The updated job
     */
    markAsCompleted(id: number): Promise<BackgroundJob>;

    /**
     * Marks a job as failed
     * @param id - The job ID
     * @param error - The error message
     * @returns The updated job
     */
    markAsFailed(id: number, error: string): Promise<BackgroundJob>;
}
