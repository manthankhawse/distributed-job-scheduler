import {Redis} from 'ioredis';
import logger from "../common/logger";
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const client = new Redis({
    host: redisHost, 
    port: redisPort,
    maxRetriesPerRequest: null
});

export const isQueueFull = async (): Promise<boolean>=>{
    try {
        const len = await client.llen('jobs');
        return len >= Number(process.env.MAX_QUEUE_SIZE);
    } catch (error) {
        return true;
    }
}

export const dispatch = async (job: any) : Promise<void>=>{
    try {
        await client.lpush('jobs', JSON.stringify(job));
        logger.info("Pushed job");
    } catch (error) {
        logger.error("Error pushing some job");
    }
    
}