import Job, { IJob } from "../common/db/models/jobSchema"

export const recoverCrashedJobs = async (): Promise<void> => {
    const now = new Date();

    const job = await Job.findOneAndUpdate(
        {
            state: "RUNNING",
            leaseExpireAt: { $lte: now }
        },
        {
            $set: {
                state: 'PENDING',
            },
            $inc: {
                attempt: 1
            },
            $unset:{
                leaseOwner:"",
                leaseExpireAt:""
            },
            $push: {
                history: {
                    state: 'PENDING', 
                    reason: `Job Crashed Previously`,
                    timestamp: now
                }
            }
        },
        {
            sort: { runAt: 1 },
            new: true
        }
    );

    return;
}