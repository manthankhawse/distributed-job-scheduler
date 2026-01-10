import Job from "../common/db/models/jobSchema";
import transitionState from "../common/stateMachine";
import logger from "../common/logger";

export const recoverCrashedJobs = async (): Promise<void> => {
    const now = new Date();

    const job = await Job.findOne({
        state: { $in: ['RUNNING', 'QUEUED'] }, 
        leaseExpireAt: { $lte: now }
    });

    if (!job) return; 

    logger.warn(`🚑 Recovering stale job: ${job.jobId} (State: ${job.state})`);

    try {
        let nextState: 'PENDING' | 'FAILED' = 'PENDING';
        let reason = `Lease Expired: Recovered from ${job.state}`;

        if (job.attempt >= job.maxRetries) {
            nextState = 'FAILED';
            reason = `Lease Expired: Max retries (${job.maxRetries}) exhausted.`;
        }

        transitionState(job, nextState, reason);

        job.leaseOwner = undefined;
        job.leaseExpireAt = undefined;

        await job.save();
        
        logger.info(`✅ Recovered job ${job.jobId} -> ${nextState}`);

    } catch (error) {
        logger.error(`❌ Failed to recover job ${job.jobId}`, error);
    }
}