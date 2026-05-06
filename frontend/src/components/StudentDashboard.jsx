import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import EvaluationCard from './EvaluationCard';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    announcements: [],
    pendingEvaluations: [],
    availableEvaluations: [],
    recollectionSchedules: [],
    certificates: []
  });
  const [loading, setLoading] = useState(true);
  const yearLevelLabels = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year'
  };

  useEffect(() => {
    fetchDashboardData();
    // Prevent back button
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/student/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (evaluationId) => {
    try {
      await api.post(`/student/evaluations/${evaluationId}/enroll`);
      toast.success('Successfully enrolled!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleParticipate = async (recollectionId) => {
    try {
      await api.post(`/student/recollections/${recollectionId}/participate`);
      toast.success('Successfully registered for recollection!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register for recollection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const profile = dashboardData.profile || {};
  const profileComplete = Boolean(profile.profileComplete);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Welcome back, {user.fullName}!
        </h1>
        <p className="text-xl text-gray-600">
          Student ID: <span className="font-semibold">{user.studentId}</span>
        </p>
      </div>

      {!profileComplete && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 text-center border border-yellow-300">
          <svg className="mx-auto h-14 w-14 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m0 3.75h.008v.008H12V16.5zm8.485 3.985H3.515a1.5 1.5 0 01-1.299-2.25l8.485-14.7a1.5 1.5 0 012.598 0l8.485 14.7a1.5 1.5 0 01-1.299 2.25z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete your profile first</h2>
          <p className="text-gray-600 mb-6">
            Google sign-in confirms your school email, but your dashboard needs your department, course, and year level.
          </p>
          <Link
            to="/student/profile"
            className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Edit Student Profile
          </Link>
        </div>
      )}

      {/* Recollection Schedules */}
      {profileComplete && <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Recollection Schedules
            <span className="ml-2 bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
              {dashboardData.recollectionSchedules?.length || 0}
            </span>
          </h2>
          <p className="text-sm text-gray-500">Choose an available date and venue to participate.</p>
        </div>

        {!dashboardData.recollectionSchedules || dashboardData.recollectionSchedules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <svg className="mx-auto h-14 w-14 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No recollection schedules available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {dashboardData.recollectionSchedules.map((schedule) => {
              const date = new Date(schedule.date);
              const participantCount = schedule.participantCount || schedule.participants?.length || 0;
              const slots = schedule.slots || 0;
              const isFull = slots > 0 && participantCount >= slots;

              return (
                <div key={schedule._id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-b from-white to-purple-50">
                  <div className="mb-5">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{schedule.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{schedule.description}</p>
                  </div>

                  <div className="space-y-3 text-sm text-gray-700 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {date.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{schedule.venue}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" />
                      </svg>
                      <span>{schedule.department}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0118 14.5c0 2.5-2.686 4.5-6 4.5s-6-2-6-4.5c0-1.338-.048-2.672-.16-3.922L12 14z" />
                      </svg>
                      <span>{yearLevelLabels[schedule.yearLevel] || 'Assigned year level'}</span>
                    </div>
                    {schedule.facilitator && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A8.966 8.966 0 0112 15c2.21 0 4.234.8 5.879 2.129M15 11a3 3 0 10-6 0 3 3 0 006 0z" />
                        </svg>
                        <span>{schedule.facilitator}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-5 border-t border-purple-100">
                    <span className="text-sm font-medium text-gray-600">
                      {slots > 0 ? `${Math.max(slots - participantCount, 0)} slots left` : 'Open slots'}
                    </span>
                    <button
                      type="button"
                      disabled={schedule.isRegistered || isFull}
                      onClick={() => handleParticipate(schedule._id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        schedule.isRegistered
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : isFull
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {schedule.isRegistered ? 'Registered' : isFull ? 'Full' : 'Participate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>}

      {/* Announcements & Pending Evaluations */}
      {profileComplete && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Announcements */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            📢 Announcements
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dashboardData.announcements.map((announcement, index) => (
              <div key={index} className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
                <p className="text-gray-800 leading-relaxed">{announcement}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Evaluations */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📝 Pending Evaluations 
            <span className="ml-2 bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
              {dashboardData.pendingEvaluations.length}
            </span>
          </h2>
          {dashboardData.pendingEvaluations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No pending evaluations 🎉</p>
              <p className="text-sm text-gray-400 mt-1">Great job staying on top of your tasks!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dashboardData.pendingEvaluations.map((evaluation) => (
                <EvaluationCard key={evaluation._id} evaluation={evaluation} />
              ))}
            </div>
          )}
        </div>
      </div>}

      {/* Available Evaluations for Enrollment */}
      {profileComplete && dashboardData.availableEvaluations && dashboardData.availableEvaluations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 Available Evaluations
            <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
              {dashboardData.availableEvaluations.length}
            </span>
          </h2>
          <div className="space-y-4">
            {dashboardData.availableEvaluations.map((evaluation) => (
              <div key={evaluation._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{evaluation.title}</h3>
                    <p className="text-gray-600 mt-1">{evaluation.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      📅 Due: {new Date(evaluation.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEnroll(evaluation._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enroll
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {profileComplete && <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          🏆 Your Certificates
          <span className="ml-3 bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
            {dashboardData.certificates.length}
          </span>
        </h2>
        
        {dashboardData.certificates.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2v-12m6 0l-4-4m4 4l4 4" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-500 mb-6">Complete evaluations to earn certificates!</p>
            <div className="bg-gradient-to-r from-blue-500 to-blue-500 text-white px-6 py-3 rounded-xl inline-block hover:shadow-lg transition-shadow">
              Check Pending Evaluations ↑
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.certificates.map((cert) => (
              <div key={cert._id} className="group border border-gray-200 rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-gradient-to-b from-white to-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                    {cert.eventName}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    cert.status === 'verified' 
                      ? 'bg-green-100 text-green-800 shadow-md' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cert.status?.toUpperCase() || 'ISSUED'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  {new Date(cert.eventDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

                {/* ✅ NO LIBRARY NEEDED - Online QR API */}
                <div className="flex justify-center mb-6 p-4 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cert.qrCode || `CERT:${cert._id}:Xavier-eCMS`)}&color=333333&bgcolor=ffffff`} 
                    alt="Certificate QR Code"
                    className="max-w-full h-auto shadow-lg rounded-lg hover:shadow-xl transition-shadow"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200/6b7280/ffffff?text=QR+Ready';
                      e.target.alt = 'QR Code Ready';
                    }}
                  />
                </div>

                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Scan to verify</p>
                  <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all">
                    Download Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}
    </div>
  );
};

export default StudentDashboard;
