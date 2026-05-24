const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Both routes now protected
router.post('/upload', authMiddleware, upload.single('resume'), resumeController.uploadResume);
router.get('/results/:id', authMiddleware, resumeController.getResults);

module.exports = router;