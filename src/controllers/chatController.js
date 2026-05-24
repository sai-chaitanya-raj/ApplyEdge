const groq = require('../config/groq');

exports.chat = async (req, res) => {
  try {
    const { message, resumeText, jobDescription, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert career coach helping a job seeker improve their resume and job application.

${resumeText ? `Their resume: ${resumeText}` : ''}
${jobDescription ? `Job they are applying for: ${jobDescription}` : ''}

RESPONSE FORMATTING RULES — always follow these:
- Use **bold** for important words or skill names
- Use bullet points (•) for lists
- Use numbered lists (1. 2. 3.) for steps or priorities
- Add a relevant emoji at the start of each main point
- Keep responses concise — max 5-6 points
- End every response with one short encouraging line
- Never write long paragraphs — break everything into scannable chunks
- Use headers like "## Skills to Learn" when covering multiple topics`
      },
      ...(chatHistory || []),
      {
        role: 'user',
        content: message
      }
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages
    });

    const reply = chatCompletion.choices[0].message.content;

    res.status(200).json({
      reply,
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