import Docker from 'dockerode';
import fs from 'fs';
import fsPromises from 'fs/promises';
import logger from '../common/logger';
import path from 'path';
import { RUNTIMES } from '../common/runtimes';


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
    fileName: string,
    payload: any,
    dependencies: string[] = [],
    runtime: string = 'python:3.9'
): Promise<{ exitCode: number, logs: string }> => {

    const config = RUNTIMES[runtime] || RUNTIMES['python:3.9'];

    
    if(!config) throw new Error("Runtime not found error");

    const containerPath = `/app/${fileName}`;
    const cmd = config.getCommand(containerPath, dependencies)
    logger.info(`[Executor] Preparing to spawn container for ${jobId}`);
    logger.info(`[Executor] Dependency list -> ${JSON.stringify(dependencies)}`);
    logger.info(`[Executor] Mounting: ${hostMountPath} -> /app`);
    
    const logFile = path.join(hostMountPath, 'logs.txt');
    const logStream = fs.createWriteStream(logFile);

    try {
        logger.info(`[Executor] Docker Request: Creating container...`);

        await ensureImageExists(config.image);
        
        const result = await docker.run(
            config.image,
            cmd,
            logStream,
            {
                Env: [`PAYLOAD=${JSON.stringify(payload)}`],
                HostConfig: {
                    Binds: [`${hostMountPath}:/app:rw`],
                    AutoRemove: true,
                },
                Tty: true
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