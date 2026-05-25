import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

function Analyze() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [previousResumes, setPreviousResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setHistoryLoading(true);
      const fetchHistory = async () => {
        try {
          const res = await api.get('/resume/history');

          setPreviousResumes(res.data.resumes || []);
        } catch (err) {
          console.error('Failed to fetch resume history', err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setSelectedResume(null);
      setError('');
    } else {
      setError('Please upload a PDF file only');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setSelectedResume(null);
      setError('');
    } else {
      setError('Please upload a PDF file only');
    }
  };

  const handleSubmit = async () => {
    if (!file && !selectedResume) {
      setError('Please upload your resume or select a previous one');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste the job description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let res;
      if (selectedResume) {
        res = await api.post('/resume/analyze-existing', {
          resumeId: selectedResume._id,
          jobDescription
        });
      } else {
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        res = await api.post('/resume/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate(`/results/${res.data.id}`);

    } catch (err) {
      if (err.response?.status === 401) {
        setError('Please login to analyze your resume');
      } else {
        const data = err.response?.data;
        const msg = data?.message || data?.error || err.message || 'Something went wrong';
        const detail = data?.error && data?.message ? data.error : '';
        setError(detail ? `${data.message}: ${detail}` : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">Analyze your resume</h1>
          <p className="text-gray-500 text-sm">Upload your resume and paste the job description to get started</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">

          {/* Left - PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload resume (PDF)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-purple-400 bg-purple-50'
                  : selectedResume
                  ? 'border-purple-400 bg-purple-50'
                  : file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
              onClick={() => {
                if (selectedResume) {
                  setSelectedResume(null);
                } else {
                  document.getElementById('fileInput').click();
                }
              }}
            >
              {selectedResume ? (
                <>
                  <div className="text-3xl mb-2">♻️</div>
                  <p className="text-sm font-medium text-purple-700">Reusing: Previous Resume</p>
                  <p className="text-xs text-purple-500 mt-1">Click to upload a new PDF instead</p>
                </>
              ) : file ? (
                <>
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-green-500 mt-1">Click to change file</p>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-sm font-medium text-gray-700">Drag and drop your PDF here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse files</p>
                </>
              )}
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Right - Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste job description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full h-48 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {jobDescription.length} characters
            </p>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 text-white px-12 py-4 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Analyzing your resume...
              </span>
            ) : (
              '✨ Analyze my resume'
            )}
          </button>
          {loading && (
            <p className="text-xs text-gray-400 mt-3">
              This takes about 10-15 seconds. Groq AI is working hard! ⚡
            </p>
          )}
        </div>

        {/* Previous Resumes History */}
        {localStorage.getItem('token') && (
          <div className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Your Previous Resumes</h2>
            {historyLoading ? (
              <div className="flex justify-center py-6">
                <svg className="animate-spin h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : previousResumes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No previous resumes analyzed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previousResumes.map((resume) => {
                  const date = new Date(resume.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  return (
                    <div key={resume._id} className="border border-gray-100 rounded-xl p-5 hover:border-purple-200 transition-colors text-left">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-gray-400">{date}</p>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {resume.jobDescription.substring(0, 40)}...
                          </p>
                        </div>
                        <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                          Score: {resume.analysis?.matchScore || 0}%
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setSelectedResume(resume);
                            setFile(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex-1 text-center bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          Reuse
                        </button>
                        <button
                          onClick={() => navigate(`/results/${resume._id}`)}
                          className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          Results
                        </button>
                        <button
                          onClick={() => navigate(`/chat/${resume._id}`)}
                          className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Analyze;