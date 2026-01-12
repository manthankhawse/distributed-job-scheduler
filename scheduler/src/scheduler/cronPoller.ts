
import { CronExpressionParser } from 'cron-parser';
import Schedule from '../common/db/models/scheduleSchema';
import Workflow from '../common/db/models/workflowSchema';
import logger from '../common/logger';
import crypto from 'crypto';

export const startCronPoller = () => {
    logger.info("🕰️  Cron Scheduler Started...");

    setInterval(async () => {
        try {
            const now = new Date();

            // 1. Find schedules that are due (nextRunAt <= now)
            const dueSchedules = await Schedule.find({
                enabled: true,
                nextRunAt: { $lte: now }
            });

            for (const schedule of dueSchedules) {
                logger.info(`⏰ Triggering Scheduled Workflow: ${schedule.name}`);

                // 2. Spawn a NEW Workflow Instance
                const workflowId = `wf-cron-${crypto.randomUUID()}`;
                
                // We map the payload nodes to the Workflow structure
                const nodes = schedule.workflowPayload.nodes.map((n: any) => ({
                    ...n,
                    id: n.id, // Ensure IDs are preserved
                }));

                // Initialize empty state for the new workflow
                const initialState = new Map();
                nodes.forEach((n: any) => {
                    initialState.set(n.id, { status: 'PENDING' });
                });

                const newWorkflow = new Workflow({
                    workflowId,
                    status: 'PENDING', // The Orchestrator picks this up immediately
                    nodes: nodes,
                    state: initialState,
                    context: {}, // Fresh context for every run
                    events: [{ type: 'TRIGGERED', details: `Scheduled by ${schedule.name}` }]
                });

                await newWorkflow.save();

                // 3. Update the Schedule for the NEXT run
                try {
                    const interval = CronExpressionParser.parse(schedule.cron);
                    schedule.lastRunAt = now;
                    schedule.nextRunAt = interval.next().toDate();
                    await schedule.save();
                    
                    logger.info(`✅ Scheduled next run for ${schedule.name} at ${schedule.nextRunAt}`);
                } catch (err) {
                    logger.error(`❌ Failed to calculate next cron date for ${schedule.name}:`, err);
                    // Disable it to prevent infinite loops of errors
                    schedule.enabled = false;
                    await schedule.save();
                }
            }

        } catch (err: any) {
            logger.error(`Cron Poller Error: ${err.message}`);
        }
    }, 10000); // Check every 10 seconds
};