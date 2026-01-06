import express, { Router } from 'express';
import { submitJob, uploadMiddleware } from '../controllers/jobController';

const router: Router = express.Router();

router.post('/submit', uploadMiddleware,  submitJob);

export default router;