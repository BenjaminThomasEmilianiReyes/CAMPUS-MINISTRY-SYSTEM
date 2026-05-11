import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: 'Computer Studies',
    batch: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const departments = [
    'Nursing',
    'Computer Studies',
    'Engineering',
    'Agriculture',
    'Business Management',
    'Education',
    'Arts and Science'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        studentId: formData.studentId,
        password: formData.password,
        role: formData.role,
        department: ['student', 'staff'].includes(formData.role) ? formData.department : '',
        batch: formData.batch
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "mt-1 block h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-blue-900";
  const labelClass = "block text-sm font-medium text-blue-950";

  return (
    <div className="min-h-screen bg-blue-950 md:flex">
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 md:w-1/2">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/assets/Login_Background.jpg"
          alt=""
        />
        <div className="absolute inset-0 bg-blue-950/20" />

        <div className="relative z-10 w-full max-w-2xl rounded-lg border-2 border-blue-950 bg-white p-6 text-center shadow-2xl sm:p-8">
          <img className="mx-auto h-24 w-full object-contain pb-2" src="/assets/CMO_Seal.png" alt="CMO Seal" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-900">Campus Ministry</p>
          <h1 className="pb-5 pt-1 text-xl font-semibold text-blue-950">CREATE ACCOUNT</h1>

        <form className="space-y-5 text-left" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={`${labelClass} mb-2`}>Account Type</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`border-2 px-2 py-3 text-center text-sm font-semibold transition-all ${
                    formData.role === 'student'
                      ? 'border-blue-900 bg-sky-100 text-blue-950'
                      : 'border-blue-100 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`border-2 px-2 py-3 text-center text-sm font-semibold transition-all ${
                    formData.role === 'admin'
                      ? 'border-blue-900 bg-sky-100 text-blue-950'
                      : 'border-blue-100 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'staff' })}
                  className={`border-2 px-2 py-3 text-center text-sm font-semibold transition-all ${
                    formData.role === 'staff'
                      ? 'border-blue-900 bg-sky-100 text-blue-950'
                      : 'border-blue-100 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m8-5.13a3 3 0 11-6 0 3 3 0 016 0zM9 9a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Faculty
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className={labelClass}>Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className={fieldClass}
                placeholder="Enter your full name"
              />
            </div>

{formData.role === 'admin' && (
              <div>
                <label htmlFor="email" className={labelClass}>Admin Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="e.g., dfabela@xu.edu.ph"
                />
                <p className="text-xs text-gray-500 mt-1">Use @xu.edu.ph for admin accounts</p>
              </div>
            )}

{formData.role === 'staff' && (
              <>
                <div>
                  <label htmlFor="email" className={labelClass}>Faculty Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={fieldClass}
                    placeholder="e.g., faculty@xu.edu.ph"
                  />
                  <p className="text-xs text-gray-500 mt-1">Faculty accounts can view assigned students only</p>
                </div>

                <div>
                  <label htmlFor="department" className={labelClass}>Assigned Department</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                  >
                    {departments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="batch" className={labelClass}>Assigned Course & Year</label>
                  <select
                    id="batch"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className={fieldClass}
                  >
                    <option value="">All course/year groups in department</option>
                    <option value="BSIT-1">BSIT - 1st Year</option>
                    <option value="BSIT-2">BSIT - 2nd Year</option>
                    <option value="BSIT-3">BSIT - 3rd Year</option>
                    <option value="BSIT-4">BSIT - 4th Year</option>
                    <option value="BSCS-1">BSCS - 1st Year</option>
                    <option value="BSCS-2">BSCS - 2nd Year</option>
                    <option value="BSCS-3">BSCS - 3rd Year</option>
                    <option value="BSCS-4">BSCS - 4th Year</option>
                    <option value="BSIS-1">BSIS - 1st Year</option>
                    <option value="BSIS-2">BSIS - 2nd Year</option>
                    <option value="BSIS-3">BSIS - 3rd Year</option>
                    <option value="BSIS-4">BSIS - 4th Year</option>
                    <option value="ABCom-1">ABCom - 1st Year</option>
                    <option value="ABCom-2">ABCom - 2nd Year</option>
                    <option value="ABCom-3">ABCom - 3rd Year</option>
                    <option value="ABCom-4">ABCom - 4th Year</option>
                  </select>
                </div>
              </>
            )}

{formData.role === 'student' && (
              <>
                <div>
                  <label htmlFor="studentId" className={labelClass}>Student ID Number</label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => {
                      const studentId = e.target.value;
                      setFormData({ 
                        ...formData, 
                        studentId: studentId,
                        // Auto-generate email: 20230028369@my.xu.edu.ph
                        email: studentId ? `${studentId}@my.xu.edu.ph` : ''
                      });
                    }}
                    className={fieldClass}
placeholder="e.g., 20230028369 (11 digits)"
                  />
<p className="text-xs text-gray-500 mt-1">Enter your student ID number (11 digits)</p>
                </div>

                <div>
                  <label htmlFor="department" className={labelClass}>Department</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                  >
                    {departments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="batch" className={labelClass}>Course & Year</label>
                  <select
                    id="batch"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                  >
                    <option value="">Select Course & Year</option>
                    <optgroup label="BSIT - Bachelor of Science in IT">
                      <option value="BSIT-1">BSIT - 1st Year</option>
                      <option value="BSIT-2">BSIT - 2nd Year</option>
                      <option value="BSIT-3">BSIT - 3rd Year</option>
                      <option value="BSIT-4">BSIT - 4th Year</option>
                    </optgroup>
                    <optgroup label="BSCS - Bachelor of Science in Computer Science">
                      <option value="BSCS-1">BSCS - 1st Year</option>
                      <option value="BSCS-2">BSCS - 2nd Year</option>
                      <option value="BSCS-3">BSCS - 3rd Year</option>
                      <option value="BSCS-4">BSCS - 4th Year</option>
                    </optgroup>
                    <optgroup label="BSIS - Bachelor of Science in Information Systems">
                      <option value="BSIS-1">BSIS - 1st Year</option>
                      <option value="BSIS-2">BSIS - 2nd Year</option>
                      <option value="BSIS-3">BSIS - 3rd Year</option>
                      <option value="BSIS-4">BSIS - 4th Year</option>
                    </optgroup>
                    <optgroup label="ABCom - AB Communication">
                      <option value="ABCom-1">ABCom - 1st Year</option>
                      <option value="ABCom-2">ABCom - 2nd Year</option>
                      <option value="ABCom-3">ABCom - 3rd Year</option>
                      <option value="ABCom-4">ABCom - 4th Year</option>
                    </optgroup>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`${fieldClass} pr-11`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={fieldClass}
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mx-auto flex h-12 w-full items-center justify-center rounded-lg bg-blue-900 px-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

<div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          </form>
        </div>
      </div>

      <div className="hidden min-h-screen w-1/2 items-center justify-center bg-blue-950 px-10 md:flex">
        <img className="h-48 w-full object-contain" src="/assets/XU_Logotype.png" alt="Xavier University" />
      </div>
    </div>
  );
};

export default Register;
