import { Request, Response } from 'express';
import crypto from 'crypto';
import Workflow from '../../common/db/models/workflowSchema';

export const submitWorkflow = async (req: Request, res: Response) => {
    try {
        const { nodes } = req.body;

        if (!nodes || !Array.isArray(nodes)) {
            return res.status(400).json({ error: "Invalid nodes array" });
        }

        const workflowId = `wf-${crypto.randomUUID()}`;

        const initialState = new Map();
        nodes.forEach((node: any) => {
            initialState.set(node.id, {
                status: 'PENDING',
                error: null
            });
        });

        const workflow = new Workflow({
            workflowId,
            status: 'RUNNING',  
            nodes,
            state: initialState
        });

        await workflow.save();

        console.log(`🕸️ Workflow Created: ${workflowId}`);
        res.json({ success: true, workflowId });

    } catch (error: any) {
        console.error("Workflow Submission Error:", error);
        res.status(500).json({ error: error.message });
    }
};