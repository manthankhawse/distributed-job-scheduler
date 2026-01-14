import mongoose, { Model, Schema } from "mongoose";

export interface IJobEvent {
    status: STATE;
    timestamp: Date;
    message?: string;
}

export interface IAttempt {
    attemptNumber: number;
    startedAt?: Date;
    completedAt?: Date;
    logs?: string;
    exitCode?: number;
    finalStatus: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'QUEUED';
    history : IJobEvent[];
}

const AttemptSchema = new Schema<IAttempt>({
    attemptNumber: { type: Number, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    logs: { type: String },
    exitCode: { type: Number },
    history: [{
        status: { type: String, enum: ['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'] },
        timestamp: { type: Date, default: Date.now },
        message: String 
    }],
    
    finalStatus: { 
        type: String, 
        enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'QUEUED'],
        required: true 
    }
}, { _id: false }); 

export type STATE = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED';

export interface IJob extends mongoose.Document {
    jobId: string;
    name: string;      
    type: string;     
    payload: any;
    artifactUrl: string;
    checksum: string;
    runtime: string;
    dependencies: string[];
    maxRetries: number;   
    state: STATE;
    runAt: Date;
    attempt: number;       
    output?: any;
    leaseOwner?: string | undefined;
    leaseExpireAt?: Date | undefined;
    
    exitCode?: number | undefined;
    completedAt?: Date | undefined;
    logs?: string | undefined;
    
    attempts: IAttempt[];  
    
    createdAt: Date;
    updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
    {
        jobId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        name: { 
            type: String, 
            required: true, 
            index: true 
        },
        type: {
            type: String,
            required: true
        },
        payload: {
            type: Object,
            default: {},
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
        state: {
            type: String,
            enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED','QUEUED'],
            default: 'PENDING',
            required: true,
            index: true
        },
        runAt: {
            type: Date,
            required: true,
            index: true
        },
        attempt: {
            type: Number,
            default: 0
        },
        maxRetries: {
            type: Number,
            default: 3
        },
        leaseExpireAt: {
            type: Date,
            default: null
        },
        leaseOwner: {
            type: String,
            default: null
        },
        exitCode: { type: Number },
        logs: { type: String },
        completedAt: { type: Date },
        
        runtime: { 
            type: String, 
            required: true, 
            default: "node:18" 
        },
        dependencies: {
            type: [String],
            default: []
        },
        output: { type: Schema.Types.Mixed },
        attempts: {
            type: [AttemptSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

jobSchema.index({ state: 1, runAt: 1 });

const Job: Model<IJob> = mongoose.model<IJob>("Job", jobSchema);

export default Job;