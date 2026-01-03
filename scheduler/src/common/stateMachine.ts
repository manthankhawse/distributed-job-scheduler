import { IJob, STATE } from "./db/models/jobSchema";

const transitionMap : Record<STATE, STATE[]> = {
    PENDING: ['RUNNING', 'DEAD'],
    RUNNING: ['COMPLETED', 'FAILED', 'RETRYING'],
    RETRYING: ['PENDING', 'DEAD', 'RUNNING'],
    COMPLETED: [], 
    FAILED: ['RETRYING', 'DEAD'], 
    DEAD: ['PENDING'] 
}

const validateTransition = (currState: STATE, nextState: STATE) : boolean =>{
    if(!transitionMap[currState].includes(nextState)){
        return false;
    }

    return true;
}

const transitionState = (job: IJob, nextState: STATE, reason?:string): IJob =>{
    if(!validateTransition(job.state, nextState)){
        throw new Error(`Cannot transition from ${job.state} to ${nextState}`);
    }

    job.history.push({
        state: job.state,
        reason: reason || `transitioning from ${job.state} to ${nextState}`,
        timestamp: new Date()
    })


    job.state = nextState;

    return job;
}


export default transitionState;