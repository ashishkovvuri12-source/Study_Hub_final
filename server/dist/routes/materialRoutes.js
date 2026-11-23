"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const materialController_1 = require("../controllers/materialController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', materialController_1.getAllMaterials);
router.get('/all/chapters', materialController_1.getAllChapters);
router.get('/:subjectId', materialController_1.getMaterialBySubjectId);
router.get('/:subjectId/chapters/:chapterNumber', materialController_1.getChapterNotes);
// Admin modifications
router.post('/:subjectId/chapters', authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, materialController_1.addChapter);
router.post('/:subjectId/chapters/:chapterNumber/questions', authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, materialController_1.addQuestion);
router.put('/:subjectId/chapters/:chapterNumber/video', authMiddleware_1.authenticate, authMiddleware_1.requireAdmin, materialController_1.updateChapterVideo);
router.post('/:subjectId/chapters/:chapterNumber/video', materialController_1.updateChapterVideo); // flexible fallback
exports.default = router;
