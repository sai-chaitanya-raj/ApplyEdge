import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-block bg-purple-50 text-purple-700 text-sm font-medium px-4 py-1 rounded-full mb-6">
          AI Powered Resume Analyzer
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mb-6 max-w-2xl leading-tight">
          Land your dream job faster with AI
        </h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-xl mb-10 leading-relaxed">
          Upload your resume, paste a job description and get an instant match score,
          skill gap analysis and a tailored cover letter — all in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/analyze"
            className="bg-purple-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-purple-700 text-center"
          >
            Analyze my resume
          </Link>
          <Link
            to="/register"
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 text-center"
          >
            Create free account
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4 sm:px-8 pb-24">
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="font-medium text-gray-900 mb-2">Match score</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            See exactly how well your resume fits the job description instantly
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="text-2xl mb-3">🎯</div>
          <h3 className="font-medium text-gray-900 mb-2">Skill gap analysis</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Know exactly which skills to add before you hit apply
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="text-2xl mb-3">💬</div>
          <h3 className="font-medium text-gray-900 mb-2">AI career coach</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Chat with AI about your resume and get personalized advice
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 py-20 px-8">
        <h2 className="text-3xl font-medium text-center text-gray-900 mb-12">
          How it works
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-3">1</div>
            <h4 className="font-medium text-gray-900 mb-1">Upload resume</h4>
            <p className="text-sm text-gray-500">Upload your PDF resume</p>
          </div>
          <div className="hidden md:block text-gray-300 text-2xl">→</div>
          <div className="block md:hidden text-gray-300 text-xl">↓</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-3">2</div>
            <h4 className="font-medium text-gray-900 mb-1">Paste job description</h4>
            <p className="text-sm text-gray-500">Add the job you want</p>
          </div>
          <div className="hidden md:block text-gray-300 text-2xl">→</div>
          <div className="block md:hidden text-gray-300 text-xl">↓</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-3">3</div>
            <h4 className="font-medium text-gray-900 mb-1">Get analysis</h4>
            <p className="text-sm text-gray-500">AI analyzes instantly</p>
          </div>
          <div className="hidden md:block text-gray-300 text-2xl">→</div>
          <div className="block md:hidden text-gray-300 text-xl">↓</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-3">4</div>
            <h4 className="font-medium text-gray-900 mb-1">Get hired</h4>
            <p className="text-sm text-gray-500">Apply with confidence</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-20 px-8">
        <h2 className="text-3xl font-medium text-gray-900 mb-4">
          Ready to get the edge?
        </h2>
        <p className="text-gray-500 mb-8">
          Join thousands of job seekers using ApplyEdge to land more interviews
        </p>
        <Link
          to="/analyze"
          className="bg-purple-600 text-white px-10 py-3 rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          Start for free
        </Link>
      </div>
    </div>
  );
}

export default Landing;