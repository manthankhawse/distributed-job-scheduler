import { Request, Response } from 'express';
import crypto from 'crypto';
import Workflow from '../../common/db/models/workflowSchema';
import CronExpressionParser from 'cron-parser';
import WorkflowSchedule from '../../common/db/models/scheduleSchema';

export const submitWorkflow = async (req: Request, res: Response) => {
    try {
        const { nodes, cron } = req.body;

        if (!nodes || !Array.isArray(nodes)) {
            return res.status(400).json({ error: "Invalid nodes array" });
        }

        if (cron) {
            try {
                // Validate Cron
                const interval = CronExpressionParser.parse(cron);
                const nextRun = interval.next().toDate();

                const schedule = new WorkflowSchedule({
                    name: `schedule-${crypto.randomUUID()}`,
                    cron: cron,
                    workflowPayload: { nodes }, // Save the blueprint
                    nextRunAt: nextRun,
                    enabled: true
                });

                await schedule.save();

                return res.status(201).json({
                    success: true,
                    scheduleId: schedule._id,
                    message: "Workflow Scheduled",
                    nextRunAt: nextRun
                });
            } catch (e: any) {
                return res.status(400).json({ error: "Invalid Cron Expression" });
            }
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


export const getWorkflows = async (req: Request, res: Response) => {
    try {
        const workflows = await Workflow.find({})
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, workflows });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getWorkflowById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Missing workflowId" });
        }   

        const workflow = await Workflow.findOne({ workflowId: id });
        
        if (!workflow) {
            return res.status(404).json({ error: "Workflow not found" });
        }
        res.json({ success: true, workflow });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};