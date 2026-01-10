import { Request, Response, RequestHandler } from "express";
import multer from 'multer';
import crypto from 'crypto';
import { BUCKET_NAME, s3Client } from "../../common/s3/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import Job from "../../common/db/models/jobSchema";
import logger from "../../common/logger";
import { RUNTIMES } from "../../common/runtimes";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware: RequestHandler = upload.single('script');

export const submitJob = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "no file provided" });
      return;
    }

    const { type, runAt, payload, dependencies, runtime } = req.body;

    const config = RUNTIMES[runtime] || RUNTIMES['python:3.9'];
    if(!config){
      throw new Error();
    }
    const ext = config.extension;

    const fileBuffer = req.file.buffer;

    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const checksum = hashSum.digest('hex');

    const s3Key = `scripts/${checksum}${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
    }));


    logger.info(`☁️ Uploaded artifact to MinIO: ${s3Key}`);

    const jobId = `job-${crypto.randomUUID()}`;

    let parsedDependencies: string[] = [];
        if (dependencies) {
            try {
                if (typeof dependencies === 'string') {
                    parsedDependencies = JSON.parse(dependencies);
                } else if (Array.isArray(dependencies)) {
                    parsedDependencies = dependencies;
                }
            } catch (e) {
                console.warn("Could not parse dependencies, defaulting to empty array");
                parsedDependencies = [];
            }
        }

    const job = await Job.create({
      jobId: jobId,
      type: type || 'GENERIC_SCRIPT',
      state: 'PENDING',
      runAt: runAt ? new Date(runAt) : new Date(),
      payload: payload ? JSON.parse(payload) : {},
      artifactUrl : s3Key,
      checksum: checksum,
      runtime,
      dependencies: parsedDependencies || [], 
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
    logger.error(error);
    res.status(500).json({ error: "internal error" });
  }
};


export const getJobById = async (req: Request, res: Response) : Promise<void> => {
  const {id} = req.params;
  if (!id) {
    res.status(400).json({ error: "missing id param" });
    return;
  }

  try {
    const job = await Job.find({jobId: id});
    if(!job){
      res.status(400).json({
        success: false,
        message: 'job not found'
      })
    }
    res.status(201).json({
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
    const jobs = await Job.find({});
    res.status(201).json({
      success: true,
      jobs
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "internal error" });
  }
};

