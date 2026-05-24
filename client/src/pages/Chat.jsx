import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import Navbar from '../components/Navbar';

function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I have reviewed your resume analysis. Ask me anything — how to improve your match score, what skills to learn first, or I can rewrite parts of your resume for you! 🚀`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await api.get(`/resume/results/${id}`);
        setResumeData(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };
    fetchResume();
  }, [id, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    const updatedMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const chatHistory = updatedMessages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/chat/message', {
        message: userMessage,
        resumeText: resumeData?.resumeText || '',
        jobDescription: resumeData?.jobDescription || '',
        chatHistory: chatHistory.slice(0, -1)
      });

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.data.reply }
      ]);

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'How can I improve my match score?',
    'What skills should I learn first?',
    'Rewrite my resume summary for this job',
    'Write a better cover letter'
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 flex flex-col flex-1 py-8">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-medium text-gray-900 mb-1">AI Career Coach</h1>
          <p className="text-gray-500 text-sm">Ask me anything about your resume</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-gray-50 rounded-2xl p-4 sm:p-6 mb-4 overflow-y-auto max-h-96 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs mr-2 shrink-0 mt-1">
                  AI
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-purple-700">{children}</strong>,
                      ul: ({ children }) => <ul className="list-none space-y-1 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      h2: ({ children }) => <h2 className="font-semibold text-gray-900 mt-3 mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="font-medium text-gray-900 mt-2 mb-1">{children}</h3>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs mr-2 shrink-0">
                AI
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="text-xs border border-purple-200 text-purple-600 px-3 py-2 rounded-full hover:bg-purple-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your resume... (Enter to send)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 resize-none"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-purple-600 text-white px-6 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate(`/results/${id}`)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back to results
          </button>
        </div>

      </div>
    </div>
  );
}

export default Chat;