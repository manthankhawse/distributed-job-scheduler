import express, { Router } from 'express';
import { submitWorkflow } from '../controllers/workflowController';
const router: Router = express.Router();


router.post('/submit',  submitWorkflow);

export default router;