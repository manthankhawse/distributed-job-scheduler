import express, {Express} from 'express';
import logger from '../common/logger';
import { registerShutdownHook } from '../common/shutdown';
import { Server } from 'http';
import connectDB from '../common/db/connectDB';

const app: Express = express();

connectDB();

const server: Server = app.listen(3000, ()=>{
    logger.info("server started");
    console.log("Server started");
})

registerShutdownHook(server);

