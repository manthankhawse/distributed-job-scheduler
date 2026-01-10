import Job, { IJob } from "../common/db/models/jobSchema"

export const pickNextJob = async (ownerId: string): Promise<IJob | null> => {
    const now = new Date();
    const leaseTime = 30 * 60 * 1000; 

    const job = await Job.findOneAndUpdate(
        {
            state: 'PENDING' ,
            runAt: { $lte: now },
            leaseOwner: null
        },
        {
            $set: {
                leaseOwner: ownerId,
                leaseExpireAt: new Date(now.getTime() + leaseTime),
            }
        },
        {
            sort: { runAt: 1 },
            new: true
        }
    );

    return job;
}