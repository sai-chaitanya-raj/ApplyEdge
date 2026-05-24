import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/analyze');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500 text-sm">Start analyzing your resume for free</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@gmail.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;