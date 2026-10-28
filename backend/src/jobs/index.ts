import { logger } from '../config/logger';

export interface BackgroundJob {
  name: string;
  intervalMs: number;
  run(): Promise<void>;
}

export class JobScheduler {
  private jobs: BackgroundJob[] = [];
  private timers: NodeJS.Timeout[] = [];

  register(job: BackgroundJob): void {
    this.jobs.push(job);
    logger.info(`Registered background job: [${job.name}] interval: ${job.intervalMs}ms`);
  }

  startAll(): void {
    for (const job of this.jobs) {
      const timer = setInterval(async () => {
        try {
          await job.run();
        } catch (err) {
          logger.error(`Error executing job ${job.name}:`, err);
        }
      }, job.intervalMs);
      this.timers.push(timer);
    }
  }

  stopAll(): void {
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers = [];
    logger.info('All background jobs stopped.');
  }
}

export const jobScheduler = new JobScheduler();
