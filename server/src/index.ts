import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback

import { connectDB } from './config/db';
import { seedDatabase } from './seed';
import authRoutes from './routes/authRoutes';
import materialRoutes from './routes/materialRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB & optionally auto-seed in local development
if (!process.env.VERCEL) {
  connectDB().then(() => {
    seedDatabase(false).catch((err: any) => {
      console.warn('[Seed] Auto-seed warning:', err?.message || err);
    });
  }).catch((err: any) => {
    console.warn('[MongoDB] Local connection notice:', err.message);
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database connection for API routes
app.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      await connectDB();
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: `Database connection error: ${err.message}. Please verify MONGODB_URI in Vercel project settings and ensure MongoDB Atlas allows 0.0.0.0/0 in Network Access.`
      });
      return;
    }
  }
  next();
});

// API Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'StudyHub Backend API is running smoothly',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/admin', adminRoutes);

// Static file serving:
// 1. Serve built React client if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// 2. Also serve legacy static HTML/CSS files from root if requested
const rootStaticPath = path.resolve(__dirname, '../../');
app.use(express.static(rootStaticPath));

// SPA catch-all for React Router:
// If a request is not an API call and not a static file, serve index.html
app.use((req: Request, res: Response, next: NextFunction): void => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  const clientIndex = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(clientIndex)) {
    res.sendFile(clientIndex);
    return;
  }
  // Otherwise serve root index.html if it exists
  const rootIndex = path.join(rootStaticPath, 'index.html');
  if (fs.existsSync(rootIndex)) {
    res.sendFile(rootIndex);
    return;
  }
  res.status(404).send('Not Found');
});

// Error handling middleware
app.use(errorHandler);

// Start standalone HTTP listener only when not running in Vercel / serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 StudyHub Backend running on port ${PORT}`);
    console.log(`👉 API Base URL: http://localhost:${PORT}/api`);
    console.log(`👉 Web Interface: http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

export default app;

