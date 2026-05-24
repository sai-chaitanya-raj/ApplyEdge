import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const user = params.get('user');

    if (token && user) {
      try {
        JSON.parse(user); // validate JSON
        localStorage.setItem('token', token);
        localStorage.setItem('user', user);
        navigate('/analyze', { replace: true });
      } catch (e) {
        console.error('Failed to parse user from OAuth redirect:', e);
        navigate('/login', { replace: true });
      }
    } else {
      console.error('OAuth redirect missing token or user params');
      navigate('/login', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Logging you in with Google...</p>
      </div>
    </div>
  );
}

export default AuthSuccess;