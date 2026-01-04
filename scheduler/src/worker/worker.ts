import { Redis } from 'ioredis';
import logger from '../common/logger';

const client = new Redis();
const processJobs = async () => {
    while (true) {
        try {
            let jobInfo: [string, string] | null = await client.brpop('jobs');
            if (!jobInfo) {
                return;
            }
            let job = await JSON.parse(jobInfo[1]);

            console.log("Executing ", job);
        } catch (error) {
            logger.error("Error occurred");
        }
    }
}

processJobs();