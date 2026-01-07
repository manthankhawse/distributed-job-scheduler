import { Redis } from 'ioredis';
import logger from '../common/logger';
import JobModel from '../common/db/models/jobSchema';
import { downloadAndVerify } from './loader';
import fs from 'fs';
import { executeContainer } from './executor';
import connectDB from '../common/db/connectDB';

const client = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
});

const processJobs = async () => {
    logger.info("👷 Worker started. Polling Redis...");
    try {
        await connectDB();
        logger.info("✅ Worker Connected to MongoDB");
    } catch (error) {
        //@ts-ignore
        logger.error(`❌ Worker Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000));   
    }

    while (true) {
        try {
            let jobInfo = await client.brpop('jobs', 0);
            if (!jobInfo) continue;

            let job = JSON.parse(jobInfo[1]);
            
            logger.info(`⚙️ Processing ${job.jobId}`);
            logger.info(`job: ${job.artifactUrl}`);
            logger.info(`deps: ${JSON.stringify(job.dependencies)}`);

            const {jobDir, fileName} = await downloadAndVerify(job.jobId, job.artifactUrl, job.checksum, job.runtime);
            
            const { exitCode, logs } = await executeContainer(job.jobId, jobDir, fileName, job.payload, job.dependencies, job.runtime);

            fs.rmSync(jobDir, { recursive: true, force: true });

            const finalState = exitCode === 0 ? 'COMPLETED' : 'FAILED';

            await JobModel.findOneAndUpdate(
                { jobId: job.jobId },
                { 
                    $set: {
                        state: finalState,
                        exitCode: exitCode,
                        logs: logs,
                        completedAt: new Date(),
                        leaseOwner: null, 
                        leaseExpiresAt: null
                    }
                }
            );

            if (exitCode === 0) {
                logger.info(`✅ Job ${job.jobId} COMPLETED`);
            } else {
                logger.error(`❌ Job ${job.jobId} FAILED (Exit: ${exitCode})`);
            }

        } catch (error: any) {
            logger.error(`❌ Worker Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

processJobs();