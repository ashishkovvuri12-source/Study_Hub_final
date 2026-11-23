"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("./config/db");
const User_1 = require("./models/User");
const Material_1 = require("./models/Material");
const materialsData_1 = require("./data/materialsData");
const defaultUsers = [
    { username: 'student', password: 'study123', name: 'Student', email: 'student@studyhub.edu', role: 'student' },
    { username: 'john', password: 'john123', name: 'John Doe', email: 'john@studyhub.edu', role: 'student' },
    { username: 'priya', password: 'priya123', name: 'Priya Sharma', email: 'priya@studyhub.edu', role: 'student' },
    { username: 'admin', password: 'admin@123', name: 'Administrator', email: 'admin@studyhub.edu', role: 'admin' },
    { username: 'faculty', password: 'faculty123', name: 'Faculty Member', email: 'faculty@studyhub.edu', role: 'admin' }
];
const seedDatabase = async (exitOnComplete = false) => {
    try {
        await (0, db_1.connectDB)();
        console.log('[Seed] Checking existing data...');
        // 1. Seed Users
        for (const u of defaultUsers) {
            const exists = await User_1.User.findOne({ username: u.username });
            if (!exists) {
                await User_1.User.create(u);
                console.log(`[Seed] Created default user: ${u.username} (${u.role})`);
            }
        }
        // 2. Seed Materials
        const materialCount = await Material_1.Material.countDocuments();
        if (materialCount === 0) {
            console.log(`[Seed] No materials found. Seeding ${materialsData_1.initialMaterials.length} subjects...`);
            for (const mat of materialsData_1.initialMaterials) {
                await Material_1.Material.create(mat);
                console.log(`[Seed] Seeded subject: ${mat.name} (${mat.chapters.length} chapters)`);
            }
            console.log('[Seed] All subjects and questions successfully seeded!');
        }
        else {
            console.log(`[Seed] Found ${materialCount} subjects already in database. Skipping material seed.`);
        }
        console.log('[Seed] Seeding process complete!');
    }
    catch (error) {
        console.error('[Seed] Error during seeding:', error);
    }
    finally {
        if (exitOnComplete) {
            await mongoose_1.default.disconnect();
            process.exit(0);
        }
    }
};
exports.seedDatabase = seedDatabase;
if (require.main === module) {
    (0, exports.seedDatabase)(true);
}
