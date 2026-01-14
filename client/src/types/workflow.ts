export type Status = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED';

export interface WorkflowNode {
    id: string;
    jobName: string;
    runtime: 'node:18' | 'python:3.9' | 'bash';
    handler: string;
    dependencies: string[];
    codeDependencies: string[];
}

export interface NodeState {
    status: Status;
    jobId?: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    exitCode?: number;
}

export interface WorkflowEvent {
    type: string;
    nodeId?: string;
    details: string;
    timestamp: string;
}

export interface Workflow {
    workflowId: string;
    status: Status;
    trigger: 'MANUAL' | 'CRON';
    nodes: WorkflowNode[];
    state: Record<string, NodeState>;
    events: WorkflowEvent[];
    context: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}