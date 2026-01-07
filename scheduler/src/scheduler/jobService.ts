import Job, { IJob } from "../common/db/models/jobSchema"

export const pickNextJob = async (ownerId: string): Promise<IJob | null> => {
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
            new: true
        }
    );

    return job;
}