"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobScheduler = exports.JobScheduler = void 0;
const logger_1 = require("../config/logger");
class JobScheduler {
    jobs = [];
    timers = [];
    register(job) {
        this.jobs.push(job);
        logger_1.logger.info(`Registered background job: [${job.name}] interval: ${job.intervalMs}ms`);
    }
    startAll() {
        for (const job of this.jobs) {
            const timer = setInterval(async () => {
                try {
                    await job.run();
                }
                catch (err) {
                    logger_1.logger.error(`Error executing job ${job.name}:`, err);
                }
            }, job.intervalMs);
            this.timers.push(timer);
        }
    }
    stopAll() {
        for (const timer of this.timers) {
            clearInterval(timer);
        }
        this.timers = [];
        logger_1.logger.info('All background jobs stopped.');
    }
}
exports.JobScheduler = JobScheduler;
exports.jobScheduler = new JobScheduler();
