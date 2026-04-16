import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', formData);
      login(response.data);
      
      const { role } = response.data.user;
      toast.success('Welcome to eCMS!');
      
      if (role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4">
      <div className="max-w-md w-full space-y-8 card-gradient p-10 rounded-3xl shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">eCMS Portal</h2>
          <p className="text-blue-100">Electronic Certificate Management System</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                School Email
              </label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder-gray-400"
                placeholder="student@xavier.edu.ph"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder-gray-400"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-blue text-white font-bold py-4 px-6 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center space-y-2 pt-6 border-t border-white/20">
          <div className="text-blue-100 text-sm">Test Accounts:</div>
          <div className="text-xs text-blue-200 space-y-1">
            <div>👨‍🎓 Student: student1@xavier.edu.ph / password123</div>
            <div>👨‍💼 Admin: admin@xavier.edu.ph / admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;