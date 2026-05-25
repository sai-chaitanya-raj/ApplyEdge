const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeText: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  analysis: {
    matchScore: Number,
    matchedSkills: [String],
    missingSkills: [String],
    suggestions: [String],
    coverLetter: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema);