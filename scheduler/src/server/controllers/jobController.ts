import { Request, Response, RequestHandler } from "express";
import multer from 'multer';
import crypto from 'crypto';
import { BUCKET_NAME, s3Client } from "../../common/s3/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import Job from "../../common/db/models/jobSchema";
import logger from "../../common/logger";
import { RUNTIMES } from "../../common/runtimes";
import { wrapCode } from "../../common/codeWrapper";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware: RequestHandler = upload.single('script');

export const submitJob = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "no file provided" });
      return;
    }

    const { 
      name,         
      type, 
      runAt, 
      payload, 
      dependencies, 
      runtime,
      maxRetries 
    } = req.body;

    const config = RUNTIMES[runtime] || RUNTIMES['python:3.9'];
    if (!config) {
      res.status(400).json({ error: `Invalid runtime: ${runtime}` });
      return;
    }

    const rawCode = req.file.buffer.toString('utf-8');
    const finalScript = wrapCode(runtime, rawCode);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(finalScript);
    const checksum = hashSum.digest('hex');
    const ext = config.extension;
    const s3Key = `scripts/${checksum}${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: finalScript,
    }));

    logger.info(`☁️ Uploaded artifact to MinIO: ${s3Key}`);

    let parsedPayload: any = {};
    try {
      if (payload) {
        parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
      }
    } catch (e) {
      logger.warn("Failed to parse payload JSON, defaulting to {}");
      parsedPayload = {}; 
    }

    let parsedDependencies: string[] = [];
    try {
      if (dependencies) {
        parsedDependencies = typeof dependencies === 'string' ? JSON.parse(dependencies) : dependencies;
      }
    } catch (e) {
      logger.warn("Failed to parse dependencies, defaulting to []");
    }

    const jobId = `job-${crypto.randomUUID()}`;
    const initialRunAt = runAt ? new Date(runAt) : new Date();

    const job = await Job.create({
      jobId,
      name: name || 'dataset-worker', 
      type: type || 'GENERIC_SCRIPT',
      
      state: 'PENDING',
      runAt: initialRunAt,
      attempt: 1,
      maxRetries: Number(maxRetries) || 3,
      payload: parsedPayload,
      artifactUrl: s3Key,
      checksum: checksum,
      runtime: runtime || 'python:3.9',
      dependencies: parsedDependencies,
      attempts: [{
        attemptNumber: 1,
        finalStatus: 'PENDING',
        history: [{
          status: 'PENDING',
          timestamp: new Date(),
          message: 'Job submitted via API'
        }]
      }]
    });

    res.status(201).json({
      success: true,
      jobId: job.jobId,
      status: "Scheduled",
      checksum: checksum
    });

  } catch (error: any) {
    logger.error("Error submitting job:", error);
    res.status(500).json({ error: "internal error", details: error.message });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "missing id param" });
    return;
  }

  try {
    const job = await Job.findOne({ jobId: id });
    
    if (!job) {
      res.status(404).json({ success: false, message: 'job not found' });
      return;
    }

    res.status(200).json({
      success: true,
      job
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "internal error" });
  }
}

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .select('-logs -payload -attempts.history -attempts.logs');
      
    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "internal error" });
  }
};