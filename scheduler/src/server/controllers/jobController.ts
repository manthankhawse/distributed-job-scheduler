import { Request, Response, RequestHandler } from "express";
import multer from 'multer';
import crypto from 'crypto';
import { BUCKET_NAME, s3Client } from "../../common/s3/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import Job from "../../common/db/models/jobSchema";
import logger from "../../common/logger";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware: RequestHandler = upload.single('script');

export const submitJob = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "no file provided" });
      return;
    }

    const { type, runAt, payload } = req.body;

    const fileBuffer = req.file.buffer;

    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const checksum = hashSum.digest('hex');

    const s3Key = `scripts/${checksum}.py`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'text/x-python'
    }));


    logger.info(`☁️ Uploaded artifact to MinIO: ${s3Key}`);

    const jobId = `job-${crypto.randomUUID()}`;

    const job = await Job.create({
      jobId: jobId,
      type: type || 'GENERIC_SCRIPT',
      state: 'PENDING',
      runAt: runAt ? new Date(runAt) : new Date(), // Default to now
      payload: payload ? JSON.parse(payload) : {},
      artifactUrl : s3Key,
      checksum: checksum,

      history: [{
        state: 'PENDING',
        reason: 'Job submitted via API',
        timestamp: new Date()
      }]
    });

    res.status(201).json({
      success: true,
      jobId: job.jobId,
      status: "Scheduled",
      checksum: checksum
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal error" });
  }
};
