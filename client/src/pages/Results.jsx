import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get(`/resume/results/${id}`);
        setResults(res.data.analysis);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Could not load results');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-gray-500 text-sm">Loading your results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => navigate('/analyze')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const matchScore = results?.matchScore || 0;
  const scoreColor = matchScore >= 70
    ? 'text-green-600'
    : matchScore >= 50
    ? 'text-amber-500'
    : 'text-red-500';

  const scoreBg = matchScore >= 70
    ? 'bg-green-50 border-green-200'
    : matchScore >= 50
    ? 'bg-amber-50 border-amber-200'
    : 'bg-red-50 border-red-200';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-8 py-12">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">Your results</h1>
          <p className="text-gray-500 text-sm">Here is how your resume matches the job description</p>
        </div>

        {/* Match Score */}
        <div className={`border rounded-2xl p-8 text-center mb-8 ${scoreBg}`}>
          <p className="text-sm text-gray-500 mb-2">Match score</p>
          <p className={`text-7xl font-medium mb-2 ${scoreColor}`}>
            {matchScore}%
          </p>
          <p className="text-sm text-gray-500">
            {matchScore >= 70
              ? '🎉 Great match! You are a strong candidate for this role'
              : matchScore >= 50
              ? '⚡ Good start! A few improvements can boost your chances'
              : '💪 Keep going! Focus on the missing skills below'}
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">

          {/* Matched Skills */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
            <h3 className="font-medium text-green-800 mb-4 flex items-center gap-2">
              ✅ Matched skills
              <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full">
                {results?.matchedSkills?.length || 0}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {results?.matchedSkills?.map((skill, i) => (
                <span
                  key={i}
                  className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h3 className="font-medium text-red-800 mb-4 flex items-center gap-2">
              ❌ Missing skills
              <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full">
                {results?.missingSkills?.length || 0}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {results?.missingSkills?.map((skill, i) => (
                <span
                  key={i}
                  className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 mb-8">
          <h3 className="font-medium text-purple-900 mb-4">💡 Suggestions to improve</h3>
          <div className="space-y-3">
            {results?.suggestions?.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full mt-0.5 shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-purple-800">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cover Letter */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">📝 Generated cover letter</h3>
            <button
              onClick={() => setShowCoverLetter(!showCoverLetter)}
              className="text-sm text-purple-600 hover:underline"
            >
              {showCoverLetter ? 'Hide' : 'Show cover letter'}
            </button>
          </div>
          {showCoverLetter && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {results?.coverLetter}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(results?.coverLetter)}
                className="mt-4 text-xs text-purple-600 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-50"
              >
                Copy to clipboard
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-purple-700"
          >
            💬 Chat with AI coach
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Analyze another resume
          </button>
        </div>

      </div>
    </div>
  );
}

export default Results;