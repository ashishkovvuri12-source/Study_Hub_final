"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllChapters = exports.updateChapterVideo = exports.addQuestion = exports.addChapter = exports.getChapterNotes = exports.getMaterialBySubjectId = exports.getAllMaterials = void 0;
const Material_1 = require("../models/Material");
// @desc    Get all subjects and material summaries
// @route   GET /api/materials
const getAllMaterials = async (_req, res) => {
    try {
        const materials = await Material_1.Material.find().sort({ order: 1 });
        const summary = materials.map((m) => {
            let totalQuestions = 0;
            let totalImportant = 0;
            m.chapters.forEach((ch) => {
                totalQuestions += ch.questions?.length || 0;
                totalImportant += ch.questions?.filter((q) => q.isImportant).length || 0;
            });
            return {
                _id: m._id,
                subjectId: m.subjectId,
                name: m.name,
                icon: m.icon,
                order: m.order,
                tagline: m.tagline,
                description: m.description,
                tags: m.tags,
                chapterCount: m.chapters.length,
                questionCount: totalQuestions,
                importantCount: totalImportant
            };
        });
        res.status(200).json({
            success: true,
            count: summary.length,
            data: summary
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching materials.' });
    }
};
exports.getAllMaterials = getAllMaterials;
// @desc    Get single subject with all chapters and questions
// @route   GET /api/materials/:subjectId
const getMaterialBySubjectId = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const material = await Material_1.Material.findOne({ subjectId: subjectId.toLowerCase() });
        if (!material) {
            res.status(404).json({ success: false, message: `Subject '${subjectId}' not found.` });
            return;
        }
        let totalQuestions = 0;
        let totalImportant = 0;
        material.chapters.forEach((ch) => {
            totalQuestions += ch.questions?.length || 0;
            totalImportant += ch.questions?.filter((q) => q.isImportant).length || 0;
        });
        res.status(200).json({
            success: true,
            data: material,
            stats: {
                totalChapters: material.chapters.length,
                totalQuestions,
                totalImportant
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching subject material.' });
    }
};
exports.getMaterialBySubjectId = getMaterialBySubjectId;
// @desc    Get notes and details for a specific chapter
// @route   GET /api/materials/:subjectId/chapters/:chapterNumber
const getChapterNotes = async (req, res) => {
    try {
        const { subjectId, chapterNumber } = req.params;
        const chNum = parseInt(chapterNumber, 10);
        const material = await Material_1.Material.findOne({ subjectId: subjectId.toLowerCase() });
        if (!material) {
            res.status(404).json({ success: false, message: `Subject '${subjectId}' not found.` });
            return;
        }
        const chapterIndex = material.chapters.findIndex((c) => c.chapterNumber === chNum);
        if (chapterIndex === -1) {
            res.status(404).json({
                success: false,
                message: `Chapter ${chapterNumber} not found in ${material.name}.`
            });
            return;
        }
        const chapter = material.chapters[chapterIndex];
        const prevChapter = chapterIndex > 0
            ? {
                chapterNumber: material.chapters[chapterIndex - 1].chapterNumber,
                title: material.chapters[chapterIndex - 1].title
            }
            : null;
        const nextChapter = chapterIndex < material.chapters.length - 1
            ? {
                chapterNumber: material.chapters[chapterIndex + 1].chapterNumber,
                title: material.chapters[chapterIndex + 1].title
            }
            : null;
        res.status(200).json({
            success: true,
            subject: {
                subjectId: material.subjectId,
                name: material.name,
                icon: material.icon
            },
            chapter,
            pagination: {
                prev: prevChapter,
                next: nextChapter,
                totalChapters: material.chapters.length
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching chapter notes.' });
    }
};
exports.getChapterNotes = getChapterNotes;
// @desc    Add a new chapter to a subject (Admin only)
// @route   POST /api/materials/:subjectId/chapters
const addChapter = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { title, video, content, questions } = req.body;
        if (!title) {
            res.status(400).json({ success: false, message: 'Chapter title is required.' });
            return;
        }
        const material = await Material_1.Material.findOne({ subjectId: subjectId.toLowerCase() });
        if (!material) {
            res.status(404).json({ success: false, message: `Subject '${subjectId}' not found.` });
            return;
        }
        const newChapterNum = material.chapters.length > 0
            ? Math.max(...material.chapters.map((c) => c.chapterNumber)) + 1
            : 1;
        const newChapter = {
            chapterNumber: newChapterNum,
            title,
            video: video || '',
            content: content || '',
            questions: questions || []
        };
        material.chapters.push(newChapter);
        await material.save();
        res.status(201).json({
            success: true,
            message: 'Chapter added successfully.',
            chapter: newChapter
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error adding chapter.' });
    }
};
exports.addChapter = addChapter;
// @desc    Add a question to a chapter (Admin only)
// @route   POST /api/materials/:subjectId/chapters/:chapterNumber/questions
const addQuestion = async (req, res) => {
    try {
        const { subjectId, chapterNumber } = req.params;
        const { text, isImportant } = req.body;
        const chNum = parseInt(chapterNumber, 10);
        if (!text) {
            res.status(400).json({ success: false, message: 'Question text is required.' });
            return;
        }
        const material = await Material_1.Material.findOne({ subjectId: subjectId.toLowerCase() });
        if (!material) {
            res.status(404).json({ success: false, message: `Subject '${subjectId}' not found.` });
            return;
        }
        const chapter = material.chapters.find((c) => c.chapterNumber === chNum);
        if (!chapter) {
            res.status(404).json({ success: false, message: `Chapter ${chapterNumber} not found.` });
            return;
        }
        const nextQNum = chapter.questions && chapter.questions.length > 0
            ? Math.max(...chapter.questions.map((q) => q.questionNumber)) + 1
            : 1;
        const newQuestion = {
            questionNumber: nextQNum,
            text,
            isImportant: !!isImportant
        };
        chapter.questions.push(newQuestion);
        await material.save();
        res.status(201).json({
            success: true,
            message: 'Question added successfully.',
            question: newQuestion
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error adding question.' });
    }
};
exports.addQuestion = addQuestion;
// @desc    Update YouTube video link for a chapter (Admin only)
// @route   PUT /api/materials/:subjectId/chapters/:chapterNumber/video
const updateChapterVideo = async (req, res) => {
    try {
        const { subjectId, chapterNumber } = req.params;
        const { video } = req.body;
        const chNum = parseInt(chapterNumber, 10);
        const material = await Material_1.Material.findOne({ subjectId: subjectId.toLowerCase() });
        if (!material) {
            res.status(404).json({ success: false, message: `Subject '${subjectId}' not found.` });
            return;
        }
        const chapter = material.chapters.find((c) => c.chapterNumber === chNum);
        if (!chapter) {
            res.status(404).json({ success: false, message: `Chapter ${chapterNumber} not found.` });
            return;
        }
        chapter.video = (video || '').trim();
        await material.save();
        res.status(200).json({
            success: true,
            message: `YouTube tutorial link updated successfully for Chapter ${chapterNumber}.`,
            video: chapter.video
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating video link.' });
    }
};
exports.updateChapterVideo = updateChapterVideo;
// @desc    Get all chapters across all subjects with their YouTube links
// @route   GET /api/materials/all/chapters
const getAllChapters = async (_req, res) => {
    try {
        const materials = await Material_1.Material.find().sort({ order: 1 });
        const allChapters = [];
        materials.forEach((m) => {
            m.chapters.forEach((c) => {
                allChapters.push({
                    subjectId: m.subjectId,
                    subjectName: m.name,
                    subjectIcon: m.icon,
                    chapterNumber: c.chapterNumber,
                    title: c.title,
                    video: c.video || ''
                });
            });
        });
        res.status(200).json({
            success: true,
            count: allChapters.length,
            chapters: allChapters
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching chapters.' });
    }
};
exports.getAllChapters = getAllChapters;
