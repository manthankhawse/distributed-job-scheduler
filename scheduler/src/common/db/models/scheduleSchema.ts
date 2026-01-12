import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowSchedule extends Document {
    name: string;
    cron: string;             // e.g. "0 9 * * *" (Daily at 9 AM)
    workflowPayload: {        // The exact JSON needed to create a Workflow
        nodes: any[];
    };
    enabled: boolean;
    lastRunAt?: Date;
    nextRunAt: Date;
}

const ScheduleSchema = new Schema({
    name: { type: String, required: true },
    cron: { type: String, required: true },
    workflowPayload: { type: Object, required: true },
    enabled: { type: Boolean, default: true },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date, required: true, index: true } // Index for fast polling
}, { timestamps: true });

const WorkflowSchedule = mongoose.model<IWorkflowSchedule>('WorkflowSchedule', ScheduleSchema);

export default WorkflowSchedule;