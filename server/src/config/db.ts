import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
    throw new Error('MONGODB_URI environment variable is missing in Vercel project settings.');
  }

  const mongoUri = uri || 'mongodb://127.0.0.1:27017/studyhub';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

