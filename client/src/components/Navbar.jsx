import { Link } from 'react-router-dom';

function Navbar() {
  const token = localStorage.getItem('token');

  return (
    <nav className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-gray-100">
      <Link to="/" className="flex items-center gap-2 text-lg font-medium text-gray-900">
        ⚡ ApplyEdge
      </Link>
      <div className="flex items-center gap-4">
        {token ? (
          <>
            <Link to="/analyze" className="text-sm text-gray-500 hover:text-gray-900">Analyze</Link>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/'; }}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900">Login</Link>
            <Link to="/register" className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;