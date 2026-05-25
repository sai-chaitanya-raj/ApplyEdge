const { PDFParse } = require('pdf-parse');
const groq = require('../config/groq');
const Resume = require('../models/Resume');
const cloudinary = require('../config/cloudinary');

// Parse PDF text from a Buffer (memory storage — no disk needed)
const extractText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = (result.text || '').trim();
  if (!text) {
    throw new Error('No text could be extracted from this PDF. Try exporting it as a text-based PDF.');
  }
  return text;
};

// ─── getResults ──────────────────────────────────────────────────────────────
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
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// ─── uploadResume ─────────────────────────────────────────────────────────────
exports.uploadResume = async (req, res) => {
  console.log('--- Upload request received ---');

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  if (!req.body.jobDescription) {
    return res.status(400).json({ message: 'Job description is required' });
  }

  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname || 'resume.pdf';
  const jobDescription = req.body.jobDescription;

  // STEP 1 — Extract text from PDF buffer
  let resumeText;
  try {
    console.log('STEP 1: Parsing PDF buffer...');
    resumeText = await extractText(fileBuffer);
    console.log('STEP 1 OK — chars:', resumeText.length);
  } catch (e) {
    const errMsg = e?.message || String(e);
    console.error('STEP 1 FAILED:', errMsg);
    return res.status(500).json({ message: 'Failed to read PDF', error: errMsg });
  }

  // STEP 2 — Upload to Cloudinary
  let pdfUrl;
  try {
    console.log('STEP 2: Uploading to Cloudinary...');
    const base64 = fileBuffer.toString('base64');
    const dataUri = `data:application/pdf;base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'raw',
      folder: 'applyedge/resumes',
      public_id: `${Date.now()}_${originalName}`,
      format: 'pdf'
    });
    pdfUrl = result.secure_url;
    console.log('STEP 2 OK — url:', pdfUrl);
  } catch (e) {
    console.error('STEP 2 FAILED (Cloudinary):', e.message);
    return res.status(500).json({ message: 'Failed to upload PDF to Cloudinary', error: e.message });
  }

  // STEP 3 — Call Groq AI
  let analysis;
  try {
    console.log('STEP 3: Calling Groq AI...');
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
    const rawResponse = chatCompletion.choices[0].message.content;
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    analysis = JSON.parse(cleaned);
    console.log('STEP 3 OK — matchScore:', analysis.matchScore);
  } catch (e) {
    console.error('STEP 3 FAILED (Groq):', e.message);
    return res.status(500).json({ message: 'Failed to analyze with AI', error: e.message });
  }

  // STEP 4 — Save to MongoDB
  let savedResume;
  try {
    console.log('STEP 4: Saving to MongoDB...');
    savedResume = await Resume.create({ userId: req.userId, resumeText, jobDescription, pdfUrl, analysis });
    console.log('STEP 4 OK — id:', savedResume._id);
  } catch (e) {
    console.error('STEP 4 FAILED (MongoDB):', e.message);
    return res.status(500).json({ message: 'Failed to save results', error: e.message });
  }

  res.status(200).json({
    message: 'Resume analyzed successfully',
    id: savedResume._id,
    pdfUrl,
    analysis
  });
};

// ─── getMyResumes ─────────────────────────────────────────────────────────────
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Retrieved previous resumes', resumes });
  } catch (error) {
    console.error('ERROR:', error.message);
    res.status(500).json({ message: 'Could not fetch your resumes', error: error.message });
  }
};

// ─── analyzeExisting ──────────────────────────────────────────────────────────
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

    console.log('Re-analyzing existing resume...');
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

    const rawResponse = chatCompletion.choices[0].message.content;
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleaned);

    const savedResume = await Resume.create({
      userId: req.userId,
      resumeText: existingResume.resumeText,
      jobDescription,
      pdfUrl: existingResume.pdfUrl,
      analysis
    });

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