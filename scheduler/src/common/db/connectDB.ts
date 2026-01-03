import mongoose from "mongoose";
import dotenv from 'dotenv';
import logger from "../logger";

dotenv.config();

const connectDB = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        logger.info('✅ Connected to MongoDB');
    } catch (error) {
        logger.error("❌ Could not connect to MongoDB ", error);
        process.exit(1);
    }  
}

export default connectDB;