import express, {Express} from 'express';
import logger from '../common/logger';
import { registerShutdownHook } from '../common/shutdown';
import { Server } from 'http';
import connectDB from '../common/db/connectDB';
import startPolling from '../scheduler/poller';

const app: Express = express();

connectDB();

const server: Server = app.listen(3000, ()=>{
    logger.info("server started");
    startPolling();
})

registerShutdownHook(server);

