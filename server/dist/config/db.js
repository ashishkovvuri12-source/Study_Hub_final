"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState >= 1) {
        return;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
        throw new Error('MONGODB_URI environment variable is missing in Vercel project settings.');
    }
    const mongoUri = uri || 'mongodb://127.0.0.1:27017/studyhub';
    try {
        const conn = await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    }
    catch (error) {
        console.error(`[MongoDB] Connection error: ${error.message}`);
        throw error;
    }
};
exports.connectDB = connectDB;
