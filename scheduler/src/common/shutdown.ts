import { Server } from "http"
import logger from "./logger"


export const registerShutdownHook = (server: Server)=>{
    const handleShutdown = async (signal: string)=>{
        try {
            if(server){
                await new Promise<void>((resolve, reject)=>{
                    server.close((err)=>{
                        if(err){
                            reject(err);
                        }
                        logger.info("HTTP server closed successfully.");
                        resolve();
                    })    
                })
            }

            process.exit(0);
        } catch (err: any) {
            logger.error(`Error gracefully closing server..., exiting by force ${err.message}`);
            process.exit(1);
        }
    }

    process.on("SIGTERM", ()=> handleShutdown("SIGTERM"));
    process.on("SIGINT", ()=> handleShutdown("SIGINT"));
}