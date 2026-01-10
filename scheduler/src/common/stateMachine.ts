import { IAttempt, IJob, STATE } from "./db/models/jobSchema";

const transitionMap: Record<STATE, STATE[]> = {
    PENDING: ['QUEUED'], 
    QUEUED: ['RUNNING', 'PENDING'],    
    RUNNING: ['COMPLETED', 'FAILED', 'PENDING'],
    COMPLETED: ['PENDING'],             
    FAILED: ['PENDING'],            
};

const validateTransition = (currState: STATE, nextState: STATE) : boolean =>{
    if (!currState) return true;
    return transitionMap[currState]?.includes(nextState) || false;
}

const transitionState = (
    job: IJob, 
    nextState: STATE, 
    message: string = "", 
    output?: { logs: string, exitCode: number }
): IJob => {
    
    if (!validateTransition(job.state, nextState)) {
        throw new Error(`❌ Invalid Transition: Cannot move from ${job.state} to ${nextState}`);
    }

    let currentAttempt = job.attempts[job.attempts.length - 1];
    if (!currentAttempt) {
        currentAttempt = {
            attemptNumber: Math.max(job.attempt || 0, 1),
            finalStatus: 'PENDING',
            history: []
        };
        job.attempts.push(currentAttempt);
    }

    if (nextState === 'PENDING') {
        
        if (['RUNNING', 'QUEUED'].includes(currentAttempt.finalStatus)) {
            currentAttempt.finalStatus = 'FAILED';
            currentAttempt.completedAt = new Date();
            
            if (output) {
                currentAttempt.logs = output.logs;
                currentAttempt.exitCode = output.exitCode;
            } else {
                currentAttempt.logs = (currentAttempt.logs || '') + '\n[System]: Attempt failed (Interrupted/Timed out)';
                currentAttempt.exitCode = -1;
            }

            currentAttempt.history.push({
                status: 'FAILED',
                timestamp: new Date(),
                message: message || "Attempt failed before retry"
            });
        }

        job.attempt = (job.attempt || 0) + 1;
        
        const newAttempt: IAttempt = {
            attemptNumber: job.attempt,
            finalStatus: 'PENDING',
            history: [{
                status: 'PENDING',
                timestamp: new Date(),
                message: "Scheduled for Retry" 
            }]
        };
        
        job.attempts.push(newAttempt);
        
        job.state = 'PENDING';
        job.logs = undefined;
        job.exitCode = undefined;
        job.completedAt = undefined;
        
        return job; 
    }

    currentAttempt.history.push({
        status: nextState,
        timestamp: new Date(),
        message: message 
    });

    currentAttempt.finalStatus = nextState;

    if (nextState === 'RUNNING' && !currentAttempt.startedAt) {
        currentAttempt.startedAt = new Date();
    }
    
    if (['COMPLETED', 'FAILED'].includes(nextState)) {
        currentAttempt.completedAt = new Date();
        if (output) {
            currentAttempt.logs = output.logs;
            currentAttempt.exitCode = output.exitCode;
        }
    }

    job.state = nextState;

    if (output) {
        job.logs = output.logs;
        job.exitCode = output.exitCode;
        if(['COMPLETED', 'FAILED'].includes(nextState)) {
            job.completedAt = new Date();
        }
    }

    return job;
};

export default transitionState;