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

const app: Express = express();



app.use(cors());
app.use(express.json());

connectDB();

app.use('/jobs', jobRoutes);
app.use('/workflows', workflowRoutes);

app.get("/health", (req,res)=>{
    res.json({message: "hello"});
})

const server: Server = app.listen(3000, ()=>{
    logger.info("server started");
    startPolling();
    startOrchestrator();
    startCronPoller();
})

registerShutdownHook(server);

