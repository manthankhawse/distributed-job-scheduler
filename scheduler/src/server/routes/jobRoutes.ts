import express, { Router } from 'express';
import { getJobById, getJobs, submitJob, uploadMiddleware } from '../controllers/jobController';

const router: Router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/submit', uploadMiddleware,  submitJob);

export default router;