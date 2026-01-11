import mongoose, { Schema, Document } from 'mongoose';

export type WorkflowStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type NodeStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
 
interface IWorkflowNode {
    id: string;              
    jobName: string;         
    runtime: string;        
    handler: string;          
    dependencies: string[];
    codeDependencies: string[];   
}
 
interface INodeState {
    status: NodeStatus;
    jobId?: string;          
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}

export interface IWorkflow extends Document {
    events: any;
    workflowId: string;
    trigger: 'MANUAL' | 'CRON' | 'WEBHOOK';
    status: WorkflowStatus;
    nodes: IWorkflowNode[];       
    state: Map<string, INodeState>;  
    context: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const WorkflowEventSchema = new Schema({
    type: { type: String, required: true }, // 'NODE_STARTED', 'NODE_COMPLETED', 'WORKFLOW_FAILED'
    nodeId: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
});

const WorkflowSchema = new Schema({
    workflowId: { type: String, required: true, unique: true },
    trigger: { type: String, default: 'MANUAL' },
    status: { 
        type: String, 
        enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
        default: 'PENDING' 
    },
    context: { type: Schema.Types.Mixed, default: {} },
    events: [WorkflowEventSchema],
     
    nodes: [{
        id: { type: String, required: true },
        jobName: { type: String, required: true },
        runtime: { type: String, required: true },
        handler: { type: String, required: true },
        dependencies: [{ type: String }] ,
        codeDependencies: [{ type: String }]
    }],
 
    state: {
        type: Map,
        of: new Schema({
            status: { 
                type: String, 
                enum: ['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'],
                default: 'PENDING' 
            },
            jobId: { type: String },  
            startedAt: Date,
            completedAt: Date,
            error: String
        }, { _id: false })
    }
}, { timestamps: true });

const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);

export default Workflow;