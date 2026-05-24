const groq = require('../config/groq');

exports.chat = async (req, res) => {
  try {
    const { message, resumeText, jobDescription, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Build messages array with full chat history
    const messages = [
      {
        role: 'system',
        content: `You are an expert career coach helping a job seeker improve their application.
        ${resumeText ? `Here is their resume: ${resumeText}` : ''}
        ${jobDescription ? `Here is the job description: ${jobDescription}` : ''}
        Give clear, specific, and actionable advice.`
      },
      // Include previous chat history so AI remembers context
      ...(chatHistory || []),
      {
        role: 'user',
        content: message
      }
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: messages
    });

    const reply = chatCompletion.choices[0].message.content;

    res.status(200).json({
      reply,
      // Send back updated history so frontend can track it
      updatedHistory: [
        ...(chatHistory || []),
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      ]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};