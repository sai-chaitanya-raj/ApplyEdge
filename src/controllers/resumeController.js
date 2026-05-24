const fs = require('fs');
const { PdfReader } = require('pdfreader');
const groq = require('../config/groq');

// Extract text from PDF
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

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.body.jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    const filePath = req.file.path;
    const jobDescription = req.body.jobDescription;

    // Step 1 - Extract resume text
    const resumeText = await extractText(filePath);

    // Step 2 - Delete file after reading
    fs.unlinkSync(filePath);

    // Step 3 - Send to Groq for analysis
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

    // Step 4 - Parse Groq response
    const rawResponse = chatCompletion.choices[0].message.content;
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleaned);

    res.status(200).json({
      message: 'Resume analyzed successfully',
      analysis
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};