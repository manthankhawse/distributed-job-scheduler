import { GetObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, s3Client } from "../common/s3/s3Client";
import fs from 'fs';
import path from "path";
import crypto from 'crypto';
import logger from "../common/logger";
import { RUNTIMES } from "../common/runtimes";

export const downloadAndVerify = async (jobId: string, s3Key: string, expectedChecksum: string, runtime: string) : Promise<{jobDir: string, fileName: string}> => {
    const jobDir = path.join('/tmp', 'scheduler-jobs', jobId);
    
    if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
    }

    const config = RUNTIMES[runtime] || RUNTIMES['python:3.9'];
    if(!config){
        throw new Error();
    }
    const ext = config.extension;
    const localPath = path.join(jobDir, `payload${ext}`);

    try {
        logger.info(`[Loader] Sending S3 Request...`);
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key
        });
        
        const response = await s3Client.send(command);
        logger.info(`[Loader] S3 Response Received (Status: ${response.$metadata.httpStatusCode})`);

        if (!response.Body) {
            throw new Error("S3 Object body is empty");
        }

        const fileWriterStream = fs.createWriteStream(localPath);
        const hash = crypto.createHash('sha256');
        
        // @ts-ignore
        for await (const chunk of response.Body) {
            fileWriterStream.write(chunk);
            hash.update(chunk);
        }
        fileWriterStream.end();

        const calculatedCheckSum = hash.digest('hex');

        if (calculatedCheckSum !== expectedChecksum) {
            logger.error(`🚨 SECURITY ALERT: Checksum mismatch!`);
            logger.error(`   Expected: ${expectedChecksum}`);
            logger.error(`   Actual:   ${calculatedCheckSum}`);
            fs.rmSync(jobDir, { recursive: true, force: true });
            throw new Error("Artifact Checksum Verification Failed.");
        }

        logger.info(`✅ [Loader] Verified & Downloaded: ${localPath}`);
        return {jobDir, fileName: `payload${ext}`};

    } catch (err) {
        logger.error(`❌ [Loader] Failed:`, err);
        if (fs.existsSync(jobDir)) {
            fs.rmSync(jobDir, { recursive: true });
        }
        throw err;
    }
}