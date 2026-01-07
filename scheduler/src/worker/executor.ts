import Docker from 'dockerode';
import fs from 'fs';
import fsPromises from 'fs/promises';
import logger from '../common/logger';
import path from 'path';
import connectDB from '../common/db/connectDB';


const docker = new Docker();

const ensureImageExists = async (imageName: string) => {
    try {
        const image = docker.getImage(imageName);
        const inspect = await image.inspect();
    } catch (e) {
        logger.info(`⬇️ Image ${imageName} missing. Pulling...`);
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        await execPromise(`docker pull ${imageName}`);
        logger.info(`✅ Pulled ${imageName}`);
    }
};

export const executeContainer = async (
    jobId: string, 
    hostMountPath: string, 
    payload: any
): Promise<{ exitCode: number, logs: string }> => {
    
    logger.info(`[Executor] Preparing to spawn container for ${jobId}`);
    logger.info(`[Executor] Mounting: ${hostMountPath} -> /app`);
    
    const logFile = path.join(hostMountPath, 'logs.txt');
    const logStream = fs.createWriteStream(logFile);

    try {
        await connectDB();
        logger.info(`[Executor] Docker Request: Creating container...`);

        await ensureImageExists('python:3.9-slim');
        
        const result = await docker.run(
            'python:3.9-slim',
            ['python', '-u', '/app/payload.py'],
            logStream,
            {
                Env: [`PAYLOAD=${JSON.stringify(payload)}`],
                HostConfig: {
                    Binds: [`${hostMountPath}:/app:rw`],
                    AutoRemove: true,
                }
            }
        );

        const data = result[0];
        const exitCode = data.StatusCode;

        logStream.end();
        
        logger.info(`[Executor] Container finished. Exit Code: ${exitCode}`);

        let logs = "No logs captured.";
        try {
            logs = await fsPromises.readFile(logFile, 'utf-8');
            logger.info(`[Executor] Logs captured (${logs.length} chars)`);
        } catch (e) {
            logger.warn(`[Executor] Could not read logs file.`);
        }

        return { exitCode, logs };

    } catch (err) {
        logger.error(`❌ [Executor] Docker Error:`, err);
        throw err;
    }
}