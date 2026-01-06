import { S3Client } from "@aws-sdk/client-s3";

export const BUCKET_NAME = "job-artifacts";

export const s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:9000',
    forcePathStyle: true,
    credentials:{
        accessKeyId: "admin",
        secretAccessKey: "password123"
    }
});

