import express, {Express} from 'express';
import logger from '../common/logger';
import { registerShutdownHook } from '../common/shutdown';
import { Server } from 'http';
import connectDB from '../common/db/connectDB';
import startPolling from '../scheduler/poller';
import jobRoutes from './routes/jobRoutes';
import workflowRoutes from './routes/workflowRoutes';
import cors from 'cors';
import { startOrchestrator } from '../scheduler/orchestrator';
import { startCronPoller } from '../scheduler/cronPoller';
import path from 'path';
import { ensureBucketExists } from '../common/s3/s3Client';

const app: Express = express();



app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '../../public'); 
app.use(express.static(frontendPath));

app.use('/jobs', jobRoutes);
app.use('/workflows', workflowRoutes);

app.get("/health", (req,res)=>{
    res.json({message: "hello"});
})


app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});
const start = async () => {
    try { 
        await connectDB();
        await ensureBucketExists();

        const server: Server = app.listen(3000, () => {
            logger.info("🚀 Flux Platform Monolith Started on Port 3000");
             
            startPolling();
            startOrchestrator();
            startCronPoller();
        });

        registerShutdownHook(server);

    } catch (error) {
        logger.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

start(); 

