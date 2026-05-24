const fs = require('fs');
const pdfParse = require('pdf-parse');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text;

    // Delete file after reading
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: 'Resume uploaded successfully',
      text: resumeText
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};