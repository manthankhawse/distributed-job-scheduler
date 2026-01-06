import mongoose , { Model, Schema } from "mongoose"

type JOB_TYPE = "SEND_EMAIL" | "PROCESS_IMAGE";
export type STATE = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'DEAD';

export interface IJobHistory{
    state: STATE;
    reason: string;
    timestamp: Date;
}

export interface IJob extends mongoose.Document {
    jobId: string;
    type: JOB_TYPE;
    payload: any;
    state: STATE;
    runAt: Date;
    artifactUrl : string;
    checksum: string;
    leaseOwner? : string;
    leaseExpireAt? : Date;
    attempt: number;
    history: IJobHistory[]
    createdAt: Date;
    updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
    {
        jobId:{
            type: String,
            required: true,
            unique: true,
            index: true
        },
        type:{
            type: String,
            required: true
        },
        payload:{
            type: Object,
            required: true
        },
        artifactUrl: {
            type: String, 
            required: true
        },
        checksum: {
            type: String, 
            required: true
        },
        state:{
            type: String,
            enum: ['PENDING' , 'RUNNING' , 'COMPLETED' , 'FAILED', 'RETRYING', 'DEAD'],
            default: 'PENDING',
            required: true
        },
        runAt: {
            type: Date,
            required: true,
        },
        leaseExpireAt:{
            type: Date,
            default: null
        },
        leaseOwner:{
            type: String,
            default: null
        },
        attempt: {
            type: Number,
            default: 0
        },
        history: {
            type: [{
                state: { type: String, required: true },
                reason: { type: String },
                timestamp: { type: Date, default: Date.now }
            }],
            default: []
        }
    },
    {
        timestamps: true
    }
)

jobSchema.index({ state: 1, runAt: 1 });

const Job: Model<IJob> = mongoose.model<IJob>("Job", jobSchema);

export default Job;