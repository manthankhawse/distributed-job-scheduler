import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import logger from "../logger";

const endpoint = process.env.MINIO_ENDPOINT || 'localhost'; 
const fullEndpoint = endpoint.startsWith('http') 
    ? endpoint 
    : `http://${endpoint}:${process.env.MINIO_PORT || 9000}`;

export const s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: fullEndpoint,
    forcePathStyle: true,
    credentials:{
        accessKeyId: "admin",
        secretAccessKey: "password123"
    }
});


export const BUCKET_NAME = process.env.MINIO_BUCKET || 'flux-artifacts';

// 2. The Initialization Logic (With Retry)
export const ensureBucketExists = async (retries = 10, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
        try {
            logger.info(`🔍 Checking for bucket: ${BUCKET_NAME} at ${fullEndpoint}...`);
            
            // Check if bucket exists
            await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
            logger.info(`✅ Bucket '${BUCKET_NAME}' exists.`);
            return; // Exit if successful

        } catch (error: any) {
            // If error is 404 (Not Found), Create it
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                try {
                    logger.info(`🪣 Bucket not found. Creating '${BUCKET_NAME}'...`);
                    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                    logger.info(`✅ Successfully created bucket: ${BUCKET_NAME}`);
                    return;
                } catch (createErr) {
                    logger.error("❌ Failed to create bucket:", createErr);
                }
            } else {
                // If it's a connection error, wait and retry
                logger.warn(`⚠️ Could not connect to MinIO (Attempt ${i + 1}/${retries}). Retrying in 3s...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
    logger.error("❌ Could not connect to MinIO after multiple attempts. Exiting.");
    process.exit(1);
};

