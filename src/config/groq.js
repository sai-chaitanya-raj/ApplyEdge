const Groq = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Llama 4 Scout was removed from many Groq accounts; override via GROQ_MODEL in .env
// List models: https://console.groq.com/docs/models
const model =
  process.env.GROQ_MODEL ||
  'llama-3.3-70b-versatile';

module.exports = groq;
module.exports.model = model;
