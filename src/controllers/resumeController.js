const fs = require('fs');
const { PdfReader } = require('pdfreader');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;

    const extractText = () => {
      return new Promise((resolve, reject) => {
        let text = '';
        new PdfReader().parseFileItems(filePath, (err, item) => {
          if (err) {
            reject(err);
          } else if (!item) {
            resolve(text);
          } else if (item.text) {
            text += item.text + ' ';
          }
        });
      });
    };

    const resumeText = await extractText();

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'Resume uploaded successfully',
      text: resumeText
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};