"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.getAdminStats = void 0;
const Material_1 = require("../models/Material");
const User_1 = require("../models/User");
// @desc    Get dashboard statistics for admin
// @route   GET /api/admin/stats
const getAdminStats = async (_req, res) => {
    try {
        const materials = await Material_1.Material.find().sort({ order: 1 });
        const totalUsers = await User_1.User.countDocuments();
        const studentCount = await User_1.User.countDocuments({ role: 'student' });
        const adminCount = await User_1.User.countDocuments({ role: 'admin' });
        let totalChapters = 0;
        let totalQuestions = 0;
        let totalImportant = 0;
        const subjectBreakdown = materials.map((m) => {
            let subjQuestions = 0;
            let subjImportant = 0;
            m.chapters.forEach((ch) => {
                subjQuestions += ch.questions?.length || 0;
                subjImportant += ch.questions?.filter((q) => q.isImportant).length || 0;
            });
            totalChapters += m.chapters.length;
            totalQuestions += subjQuestions;
            totalImportant += subjImportant;
            return {
                subjectId: m.subjectId,
                name: m.name,
                icon: m.icon,
                chaptersCount: m.chapters.length,
                questionsCount: subjQuestions,
                importantCount: subjImportant,
                status: 'Active'
            };
        });
        res.status(200).json({
            success: true,
            stats: {
                totalSubjects: materials.length,
                totalChapters,
                totalQuestions,
                totalImportant,
                totalNotesPages: totalChapters,
                totalUsers,
                studentCount,
                adminCount
            },
            subjects: subjectBreakdown
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching admin stats.' });
    }
};
exports.getAdminStats = getAdminStats;
// @desc    Get all registered users (Admin only)
// @route   GET /api/admin/users
const getAllUsers = async (_req, res) => {
    try {
        const users = await User_1.User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching users.' });
    }
};
exports.getAllUsers = getAllUsers;
