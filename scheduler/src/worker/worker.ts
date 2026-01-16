import { Redis } from 'ioredis';
import logger from '../common/logger';
import JobModel, { STATE } from '../common/db/models/jobSchema';
import { downloadAndVerify } from './loader';
import fs from 'fs';
import { executeContainer } from './executor';
import connectDB from '../common/db/connectDB';
import transitionState from '../common/stateMachine';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const client = new Redis({
    host: redisHost, 
    port: redisPort,
    maxRetriesPerRequest: null
});

const WORKER_ID = `worker-${process.pid}`;
const EXECUTION_TIMEOUT = 5 * 60 * 1000;

const processJobs = async () => {
    logger.info(`👷 Worker ${WORKER_ID} started. Polling Redis...`);
    try {
        await connectDB();
        logger.info("✅ Worker Connected to MongoDB");
    } catch (error: any) {
        logger.error(`❌ Worker Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    while (true) {
        try {
            let jobInfo = await client.brpop('jobs', 0);
            if (!jobInfo) continue;

            const redisPayload = JSON.parse(jobInfo[1]);
            const jobId = redisPayload.jobId;

            const job = await JobModel.findOne({ jobId });

            if (!job) {
                logger.error(`❌ Job ${jobId} not found in DB. Skipping.`);
                continue;
            }

            try {
                logger.info(`⚙️ Starting Execution for ${jobId}`);

                transitionState(job, 'RUNNING', `Picked up by ${WORKER_ID}`);

                job.leaseOwner = WORKER_ID;
                job.leaseExpireAt = new Date(Date.now() + EXECUTION_TIMEOUT);

                await job.save();

            } catch (err: any) {
                logger.warn(`⚠️ Could not claim job ${jobId}: ${err.message}`);
                continue;
            }

            let exitCode = 1;
            let logs = "";
            let output = null;
            let jobDir = "";

            try {
                const downloadResult = await downloadAndVerify(
                    job.jobId,
                    job.artifactUrl,
                    job.checksum,
                    job.runtime
                );
                jobDir = downloadResult.jobDir;

                const executionResult = await executeContainer(
                    job.jobId,
                    jobDir,
                    downloadResult.fileName,
                    job.payload,
                    job.dependencies,
                    job.runtime
                );

                exitCode = executionResult.exitCode;
                logs = executionResult.logs;
                output = executionResult.output;

            } catch (execError: any) {
                logger.error(`❌ Execution Crash for ${jobId}: ${execError.message}`);
                logs = `Worker Error: ${execError.message}`;
                exitCode = 1;
            } finally {
                if (jobDir && fs.existsSync(jobDir)) {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                }
            }

            let finalState = exitCode === 0 ? 'COMPLETED' : 'FAILED';

            try {

                job.leaseOwner = undefined;
                job.leaseExpireAt = undefined;

                if (finalState === 'COMPLETED') {
                    logger.info(`✅ Job ${job.jobId} COMPLETED`);
                    if (output) {
                        job.output = output; // Make sure your JobSchema has this field!
                    }
                    transitionState(job, 'COMPLETED', "Job finished successfully", { 
                        logs, 
                        exitCode 
                    });
                } else {
                    logger.error(`❌ Job ${job.jobId} FAILED`);

                    if (job.attempt >= job.maxRetries) {
                        transitionState(job, 'FAILED', "Crashed and ran out of retries", {
                            logs,
                            exitCode
                        });
                    } else {
                        transitionState(job, 'PENDING', "Crashed, retrying...", {
                            logs,
                            exitCode
                        });
                    }
                }

                await job.save();

            } catch (saveError: any) {
                logger.error(`❌ Failed to save final state for ${jobId}: ${saveError.message}`);
            }

        } catch (error: any) {
            logger.error(`❌ Fatal Worker Loop Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

processJobs();