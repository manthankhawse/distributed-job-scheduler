import Job, { IJob } from "../common/db/models/jobSchema"

type jobArg = Pick<IJob, "jobId" | "payload" | "attempt" | "type">

export const pickNextJob = async (ownerId: string): Promise<jobArg | null> => {
    const now = new Date();
    const leaseTime = 5 * 60 * 1000; 

    const job = await Job.findOneAndUpdate(
        {
            state: { $in: ['PENDING', 'RETRYING'] },
            runAt: { $lte: now }
        },
        {
            $set: {
                state: 'RUNNING',
                leaseOwner: ownerId,
                leaseExpireAt: new Date(now.getTime() + leaseTime),
            },
            $inc: { attempt: 1 },
            $push: {
                history: {
                    state: 'RUNNING', 
                    reason: `Claimed by ${ownerId}`,
                    timestamp: now
                }
            }
        },
        {
            sort: { runAt: 1 },
            new: true,
            projection:{
                jobId: 1,
                payload: 1,
                attempt: 1
            }
        }
    );

    return job;
}