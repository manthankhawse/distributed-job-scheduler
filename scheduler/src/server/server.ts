import express, {Express} from 'express';
import logger from '../common/logger';
import { registerShutdownHook } from '../common/shutdown';
import { Server } from 'http';
import connectDB from '../common/db/connectDB';
import startPolling from '../scheduler/poller';
import jobRoutes from './routes/jobRoutes';
import cors from 'cors';

const app: Express = express();

app.use(cors());

connectDB();

app.use('/jobs', jobRoutes);

const server: Server = app.listen(3000, ()=>{
    logger.info("server started");
    startPolling();
})

registerShutdownHook(server);

