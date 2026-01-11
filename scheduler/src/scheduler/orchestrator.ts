import Workflow, { IWorkflow } from '../common/db/models/workflowSchema';
import JobModel from '../common/db/models/jobSchema';
import { dispatch } from './dispatch'; 
import logger from '../common/logger';
import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../common/s3/s3Client'; // 👈 Import your client

const ORCHESTRATOR_INTERVAL = 2000;

export const startOrchestrator = () => {
    logger.info("🎼 Orchestrator Engine Started...");

    const runLoop = async () => {
        try {
            // 1. Activate PENDING workflows
            const pendingWorkflows = await Workflow.find({ status: 'PENDING' });
            for (const wf of pendingWorkflows) {
                logger.info(`⚡ Activating Workflow ${wf.workflowId}`);
                wf.status = 'RUNNING';
                await wf.save();
            }

            // 2. Process RUNNING workflows
            const activeWorkflows = await Workflow.find({ status: 'RUNNING' });
            for (const wf of activeWorkflows) {
                await processWorkflow(wf);
            }

        } catch (err: any) {
            logger.error(`Orchestrator Error: ${err.message}`);
        } finally {
            setTimeout(runLoop, ORCHESTRATOR_INTERVAL);
        }
    };

    runLoop();
};

const processWorkflow = async (wf: IWorkflow) => {
    let workflowModified = false;
    let allNodesComplete = true;
    let anyNodeFailed = false;

    for (const node of wf.nodes) {
        const nodeState = wf.state.get(node.id);
        if (!nodeState) continue;

        // --- PHASE 1: Check Running/Retrying Jobs ---
        if (nodeState.status === 'RUNNING' && nodeState.jobId) {
            const job = await JobModel.findOne({ jobId: nodeState.jobId });
            
            if (job) {
                if (job.state === 'COMPLETED') {
                    // Success!
                    nodeState.status = 'COMPLETED';
                    nodeState.completedAt = new Date();
                    workflowModified = true;
                    const startTime = nodeState.startedAt 
                        ? new Date(nodeState.startedAt).getTime() 
                        : Date.now();

                    wf.events.push({
                        type: 'NODE_COMPLETED',
                        nodeId: node.id,
                        details: `Finished in ${(Date.now() - startTime) / 1000}s`
                    });
                } else if (job.state === 'FAILED') {
                    // 🛑 The Job ran out of retries (e.g. 3/3 failed)
                    nodeState.status = 'FAILED';
                    nodeState.error = "Max Retries Exceeded";
                    workflowModified = true;
                } 
                // Note: If state is PENDING/QUEUED, it means it's retrying.
                // We do NOTHING and let it retry.
            }
        }

        // --- PHASE 2: Trigger New Nodes ---
        if (nodeState.status === 'PENDING') {
            allNodesComplete = false;

            const parents = node.dependencies || [];
            const canRun = parents.every(parentId => {
                const parentState = wf.state.get(parentId);
                return parentState?.status === 'COMPLETED';
            });

            // If a parent failed, this node is dead
            const parentFailed = parents.some(parentId => {
                const parentState = wf.state.get(parentId);
                return parentState?.status === 'FAILED' || parentState?.status === 'SKIPPED';
            });

            if (parentFailed) {
                nodeState.status = 'SKIPPED';
                workflowModified = true;
            } else if (canRun) {
                logger.info(`🚀 Orchestrator: Triggering Node ${node.id}`);

                
                
                try {
                    const jobId = await triggerJobWithS3(node, wf.workflowId);
                    
                    nodeState.status = 'RUNNING';
                    nodeState.jobId = jobId;

                    wf.events.push({
                        type: 'NODE_STARTED',
                        nodeId: node.id,
                        details: `Job ${jobId} dispatched`
                    });

                    nodeState.startedAt = new Date();
                    workflowModified = true;
                } catch (err: any) {
                    logger.error(`Failed to trigger node ${node.id}: ${err.message}`);
                }
            }
        } else if (['RUNNING', 'QUEUED'].includes(nodeState.status)) {
            allNodesComplete = false;
        } else if (nodeState.status === 'FAILED') {
            anyNodeFailed = true;
        }
    }

    if (workflowModified) {
        wf.markModified('state'); 
        if (allNodesComplete) {
            wf.status = anyNodeFailed ? 'FAILED' : 'COMPLETED';
            logger.info(`🏁 Workflow ${wf.workflowId} Finished: ${wf.status}`);
        }
        await wf.save();
    }
};

const triggerJobWithS3 = async (node: any, workflowId: string) => {
    const jobId = `job-${crypto.randomUUID()}`;
    
    const checksum = crypto.createHash('sha256').update(node.handler).digest('hex');
    const extension = node.runtime === 'python:3.9' ? '.py' : node.runtime === 'bash' ? '.sh' : '.js';
    const s3Key = `scripts/${checksum}${extension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: node.handler,
        ContentType: 'text/plain'
    });
    
    await s3Client.send(command);

    const job = new JobModel({
        jobId,
        name: `${workflowId}:${node.jobName}`, 
        type: 'WORKFLOW_JOB',
        runtime: node.runtime,
        state: 'QUEUED',
        payload: { 
            _workflowId: workflowId,
            _nodeId: node.id
        },
        attempt: 0,
        maxRetries: 3, 
        runAt: new Date(),
        checksum: checksum,
        artifactUrl: s3Key,
        dependencies: node.codeDependencies || []
    });

    await job.save();
    await dispatch(job); 

    return jobId;
};