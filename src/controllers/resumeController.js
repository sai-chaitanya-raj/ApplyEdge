const fs = require('fs');
const { PdfReader } = require('pdfreader');
const groq = require('../config/groq');
const Resume = require('../models/Resume');
const cloudinary = require('../config/cloudinary');

const extractText = (filePath) => {
  return new Promise((resolve, reject) => {
    let text = '';
    new PdfReader().parseFileItems(filePath, (err, item) => {
      if (err) reject(err);
      else if (!item) resolve(text);
      else if (item.text) text += item.text + ' ';
    });
  });
};

exports.getResults = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Results not found' });
    }

    res.status(200).json({
      message: 'Full results retrieved',
      analysis: resume.analysis,
      resumeText: resume.resumeText,
      jobDescription: resume.jobDescription,
      pdfUrl: resume.pdfUrl
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    console.log('--- Request received ---');

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.body.jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    const filePath = req.file.path;
    const jobDescription = req.body.jobDescription;

    console.log('Extracting text from PDF...');
    const resumeText = await extractText(filePath);
    console.log('Text extracted');

    console.log('Uploading PDF to Cloudinary...');
    const cloudinaryUpload = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      folder: 'applyedge/resumes',
      format: 'pdf'
    });
    const pdfUrl = cloudinaryUpload.secure_url;
    console.log('PDF uploaded to Cloudinary:', pdfUrl);

    fs.unlinkSync(filePath);
    console.log('Local PDF file deleted');

    console.log('Calling Groq AI...');
    const chatCompletion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an expert HR analyst and career coach. 
          Analyze the resume against the job description and return a JSON response with exactly these fields:
          {
            "matchScore": number between 0-100,
            "matchedSkills": array of skills found in both resume and job description,
            "missingSkills": array of skills in job description but not in resume,
            "suggestions": array of 3-5 improvement suggestions,
            "coverLetter": a professional cover letter string
          }
          Return only valid JSON, no extra text.`
        },
        {
          role: 'user',
          content: `Resume: ${resumeText}\n\nJob Description: ${jobDescription}`
        }
      ]
    });
    console.log('Groq response received');

    const rawResponse = chatCompletion.choices[0].message.content;
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleaned);
    console.log('Analysis parsed successfully');

    console.log('Saving to MongoDB...');
    const savedResume = await Resume.create({
      userId: req.userId,
      resumeText,
      jobDescription,
      pdfUrl,
      analysis
    });
    console.log('Saved! ID:', savedResume._id);

    res.status(200).json({
      message: 'Resume analyzed successfully',
      id: savedResume._id,
      pdfUrl,
      analysis
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// Get all resumes uploaded by the logged-in user
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Retrieved previous resumes',
      resumes
    });
  } catch (error) {
    console.error('ERROR:', error.message);
    res.status(500).json({ message: 'Could not fetch your resumes', error: error.message });
  }
};

// Analyze a previously uploaded resume text with a new job description
exports.analyzeExisting = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ message: 'Resume ID and job description are required' });
    }

    const existingResume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!existingResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    console.log('Re-analyzing existing resume with new job description...');
    console.log('Calling Groq AI...');
    const chatCompletion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an expert HR analyst and career coach. 
          Analyze the resume against the job description and return a JSON response with exactly these fields:
          {
            "matchScore": number between 0-100,
            "matchedSkills": array of skills found in both resume and job description,
            "missingSkills": array of skills in job description but not in resume,
            "suggestions": array of 3-5 improvement suggestions,
            "coverLetter": a professional cover letter string
          }
          Return only valid JSON, no extra text.`
        },
        {
          role: 'user',
          content: `Resume: ${existingResume.resumeText}\n\nJob Description: ${jobDescription}`
        }
      ]
    });
    console.log('Groq response received');

    const rawResponse = chatCompletion.choices[0].message.content;
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleaned);
    console.log('Analysis parsed successfully');

    console.log('Saving to MongoDB...');
    const savedResume = await Resume.create({
      userId: req.userId,
      resumeText: existingResume.resumeText,
      jobDescription,
      pdfUrl: existingResume.pdfUrl,
      analysis
    });
    console.log('Saved! ID:', savedResume._id);

    res.status(200).json({
      message: 'Resume re-analyzed successfully',
      id: savedResume._id,
      pdfUrl: savedResume.pdfUrl,
      analysis
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};