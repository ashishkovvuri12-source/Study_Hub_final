"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config(); // fallback
const db_1 = require("./config/db");
const seed_1 = require("./seed");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB & optionally auto-seed in local development
if (!process.env.VERCEL) {
    (0, db_1.connectDB)().then(() => {
        (0, seed_1.seedDatabase)(false).catch((err) => {
            console.warn('[Seed] Auto-seed warning:', err?.message || err);
        });
    }).catch((err) => {
        console.warn('[MongoDB] Local connection notice:', err.message);
    });
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Track whether auto-seed has run in this serverless instance
let isSeeded = false;
// Ensure database connection for API routes
app.use(async (req, res, next) => {
    const isApiRoute = req.path.startsWith('/api') ||
        req.path.startsWith('/auth') ||
        req.path.startsWith('/materials') ||
        req.path.startsWith('/admin');
    const isHealth = req.path.includes('health');
    if (isApiRoute && !isHealth) {
        try {
            await (0, db_1.connectDB)();
            if (!isSeeded) {
                isSeeded = true;
                (0, seed_1.seedDatabase)(false).catch((err) => {
                    console.warn('[Seed] Background auto-seed warning:', err?.message || err);
                });
            }
        }
        catch (err) {
            res.status(500).json({
                success: false,
                message: `Database connection error: ${err.message}. Please verify MONGODB_URI in Vercel project settings and ensure MongoDB Atlas allows 0.0.0.0/0 in Network Access.`
            });
            return;
        }
    }
    next();
});
// API Status (supports both /api/health and /health)
const healthHandler = (_req, res) => {
    res.json({
        status: 'ok',
        message: 'StudyHub Backend API is running smoothly',
        database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
// Mount Routes with /api prefix
app.use('/api/auth', authRoutes_1.default);
app.use('/api/materials', materialRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Mount Routes without /api prefix as fallback in case Vercel rewrites strip it
app.use('/auth', authRoutes_1.default);
app.use('/materials', materialRoutes_1.default);
app.use('/admin', adminRoutes_1.default);
// Static file serving:
// 1. Serve built React client if available
const clientDistPath = path_1.default.resolve(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDistPath));
// 2. Also serve legacy static HTML/CSS files from root if requested
const rootStaticPath = path_1.default.resolve(__dirname, '../../');
app.use(express_1.default.static(rootStaticPath));
// SPA catch-all for React Router:
// If a request is not an API call and not a static file, serve index.html
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        next();
        return;
    }
    const clientIndex = path_1.default.join(clientDistPath, 'index.html');
    if (fs_1.default.existsSync(clientIndex)) {
        res.sendFile(clientIndex);
        return;
    }
    // Otherwise serve root index.html if it exists
    const rootIndex = path_1.default.join(rootStaticPath, 'index.html');
    if (fs_1.default.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
        return;
    }
    res.status(404).send('Not Found');
});
// Error handling middleware
app.use(errorMiddleware_1.errorHandler);
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
// Export for both CommonJS (Vercel serverless runner) and ES modules
module.exports = app;
module.exports.default = app;
exports.default = app;
