"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All admin routes require valid admin authentication
router.get('/stats', authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, adminController_1.getAdminStats);
router.get('/users', authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, adminController_1.getAllUsers);
exports.default = router;
