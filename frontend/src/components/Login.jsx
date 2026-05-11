import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const completeLogin = (data) => {
    if (!data || !data.token || !data.user) {
      toast.error('Invalid server response');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    login(data);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    const targetPath = data.user.role === 'admin'
      ? '/admin/dashboard'
      : data.user.role === 'staff'
        ? '/faculty/dashboard'
        : '/student/dashboard';
    toast.success('Welcome to eCMS!');
    navigate(targetPath);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Logging in with:', formData);
      console.log('Sending request to:', api.defaults.baseURL + '/auth/login');
      const response = await api.post('/auth/login', formData);
      console.log('Login response status:', response.status);
      console.log('Login response:', response.data);
      
      completeLogin(response.data);
} catch (error) {
      console.error('Login error full:', error);
      console.error('Login error response:', error.response);
      console.error('Login error message:', error.message);
      
      // Show specific error message
      if (error.code === 'ECONNREFUSED') {
        toast.error('Cannot connect to server. Is backend running?');
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed - check console for details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    setGoogleLoading(true);

    try {
      const response = await api.post('/auth/google', { credential });
      completeLogin(response.data);
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Google login failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-950 md:flex">
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 md:w-1/2">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/assets/Login_Background.jpg"
          alt=""
        />
        <div className="absolute inset-0 bg-blue-950/20" />

        <div className="relative z-10 w-full max-w-lg rounded-lg border-2 border-blue-950 bg-white p-7 text-center shadow-2xl sm:p-9">
          <img className="mx-auto h-24 w-full object-contain pb-2" src="/assets/CMO_Seal.png" alt="CMO Seal" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-900">Campus Ministry</p>
          <h1 className="pb-5 pt-1 text-xl font-semibold text-blue-950">SIGN IN</h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="mx-auto w-full text-left sm:w-3/4">
              <label className="mb-1 block text-sm font-medium text-blue-950">
                School Email
              </label>
              <input
                type="email"
                required
                className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                placeholder="20230028369@my.xu.edu.ph"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="mx-auto w-full text-left sm:w-3/4">
              <label className="mb-1 block text-sm font-medium text-blue-950">
                Password
              </label>
              <input
                type="password"
                required
                className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mx-auto flex h-12 w-full items-center justify-center rounded-lg bg-blue-900 px-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-blue-100" />
            <span className="text-xs font-semibold uppercase text-blue-900">or</span>
            <div className="h-px flex-1 bg-blue-100" />
          </div>

          <div className="mx-auto w-full sm:w-3/4">
            {googleConfigured ? (
              <div className={googleLoading ? 'pointer-events-none opacity-70' : ''}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google login failed')}
                  text="signin_with"
                  shape="rectangular"
                  size="large"
                  width="100%"
                />
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-lg border border-blue-100 bg-sky-50 p-3 text-sm font-medium text-blue-900/45"
              >
                Google login needs a client ID
              </button>
            )}
          </div>

          <div className="mx-auto mt-5 w-full border-t border-blue-100 pt-4 text-center sm:w-3/4">
            <p className="text-sm font-semibold text-blue-950">Test Accounts</p>
            <p className="mt-1 text-xs text-gray-500">Student: 20230028369@my.xu.edu.ph / password123</p>
            <p className="text-xs text-gray-500">Faculty: faculty@xu.edu.ph / password123</p>
            <p className="text-xs text-gray-500">Admin: dfabela@xu.edu.ph / admin123</p>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-900 hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden min-h-screen w-1/2 items-center justify-center bg-blue-950 px-10 md:flex">
        <img className="h-48 w-full object-contain" src="/assets/XU_Logotype.png" alt="Xavier University" />
      </div>
    </div>
  );
};

export default Login;
