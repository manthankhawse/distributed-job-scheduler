import express, { Router } from 'express';
import { getWorkflowById, getWorkflows, submitWorkflow } from '../controllers/workflowController';
const router: Router = express.Router();


router.post('/submit',  submitWorkflow);
router.get('/', getWorkflows); 
router.get('/:id', getWorkflowById);

export default router;