const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/auth');

// Memory storage — file lives in req.file.buffer (no filesystem needed)
// Works identically on local, Docker, and Render
const upload = multer({ storage: multer.memoryStorage() });

// Both routes now protected
router.post('/upload', authMiddleware, upload.single('resume'), resumeController.uploadResume);
router.get('/results/:id', authMiddleware, resumeController.getResults);
router.get('/my-resumes', authMiddleware, resumeController.getMyResumes);
router.get('/history', authMiddleware, resumeController.getMyResumes);
router.post('/analyze-existing', authMiddleware, resumeController.analyzeExisting);


module.exports = router;