import { IJob } from "../common/db/models/jobSchema";
import logger from "../common/logger";
import { pickNextJob } from "./jobService";
import dotenv from 'dotenv';
import { recoverCrashedJobs } from "./recovery";
import { dispatch, isQueueFull } from "./dispatch";
import transitionState from "../common/stateMachine";
import crypto from 'crypto';

dotenv.config();

const startPolling = ()=>{
    const SCHEDULER_ID = `scheduler-${crypto.randomUUID().slice(0, 8)}`;
    const POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL as string);

    const poll = async ()=>{
        const startTime = process.hrtime.bigint();
        try {

            if (await isQueueFull()) {
                setTimeout(poll, POLLING_INTERVAL);
                return;
            }
            const job: IJob | null = await pickNextJob(SCHEDULER_ID);

            if(job){
                logger.info(`🔥 Claimed Job: ${job.jobId} (Type: ${job.type})`);
                transitionState(job, 'QUEUED', `Dispatched by ${SCHEDULER_ID}`);
                await job.save();
                await dispatch(job);
                setImmediate(poll);
            }else{
                const endTime = process.hrtime.bigint();
                const executionTimeNs = endTime - startTime;
                const executionTimeMs = Number(executionTimeNs) / 1_000_000;

                const timeToSleep = Math.max(0, POLLING_INTERVAL - executionTimeMs);

                setTimeout(poll, timeToSleep);
            }
        } catch (err: any) {
            logger.error(`❌ Polling error: ${err.message}`);
            setTimeout(poll, POLLING_INTERVAL);
        }
    }   

    const startRecoveryLoop = async () => {
        try {
            await recoverCrashedJobs();
        } catch (err) {
            logger.error("❌ Recovery loop error: ", err);
        } finally { 
            setTimeout(startRecoveryLoop, 60 * 1000);
        }
    };

    poll();
    startRecoveryLoop();
}

export default startPolling;