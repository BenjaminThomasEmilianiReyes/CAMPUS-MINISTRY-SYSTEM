import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">e</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
                eCMS
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user.role === 'student' ? (
              <>
                <Link
                  to="/student/dashboard"
                  className="px-4 py-2 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin/dashboard"
                  className="px-4 py-2 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/evaluation-builder"
                  className="px-4 py-2 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Create Evaluation
                </Link>
              </>
            )}
            
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-gray-100">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                {user.fullName}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 font-medium rounded-xl hover:bg-red-100 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;