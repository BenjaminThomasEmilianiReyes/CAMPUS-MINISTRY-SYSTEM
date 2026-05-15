import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    announcements: [],
    availableEvaluations: [],
    recollectionSchedules: [],
    newScheduleNotifications: [],
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

  const statCards = [
    ['Recollections', dashboardData.recollectionSchedules?.length || 0],
    ['Certificates', dashboardData.certificates?.length || 0]
  ];

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-3 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        STUDENT DASHBOARD
      </h1>
      <p className="mx-6 mb-6 text-center text-sm font-semibold uppercase tracking-wide text-gray-500 lg:mx-9">
        {user.fullName} / {user.studentId || 'Student ID'}
      </p>

      <div className="mx-6 space-y-8 lg:mx-9">
        {!profileComplete && (
          <section className="rounded-2xl border-l-4 border-yellow-500 bg-white p-6 text-center shadow-lg">
            <svg className="mx-auto mb-4 h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m0 3.75h.008v.008H12V16.5zm8.485 3.985H3.515a1.5 1.5 0 01-1.299-2.25l8.485-14.7a1.5 1.5 0 012.598 0l8.485 14.7a1.5 1.5 0 01-1.299 2.25z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Complete your profile first</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
              Google sign-in confirms your school email, but your dashboard needs your department, course, and year level.
            </p>
            <Link
              to="/student/profile"
              className="mt-5 inline-flex bg-[#3a53a5] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3a85]"
            >
              Edit Student Profile
            </Link>
          </section>
        )}

        {profileComplete && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg">
                  <div>
                    <div className="text-sm font-semibold uppercase text-gray-500">{label}</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
                  </div>
                  <svg className="h-9 w-9 text-[#3a53a5]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ))}
            </div>

            <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="flex flex-col justify-between gap-3 border-b px-6 py-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recollection Schedules</h2>
                  <p className="text-sm text-gray-500">Choose an available date and venue to participate.</p>
                </div>
              </div>

              {!dashboardData.recollectionSchedules || dashboardData.recollectionSchedules.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No recollection schedules available right now.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
                  {dashboardData.recollectionSchedules.map((schedule) => {
                    const date = new Date(schedule.date);
                    const participantCount = schedule.participantCount || schedule.participants?.length || 0;
                    const slots = schedule.slots || 0;
                    const isFull = slots > 0 && participantCount >= slots;

                    return (
                      <div key={schedule._id} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-5">
                        <h3 className="text-lg font-semibold text-gray-900">{schedule.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{schedule.description}</p>
                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                          <p>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                          <p>{schedule.venue}</p>
                          <p>{schedule.department} / {yearLevelLabels[schedule.yearLevel] || 'Assigned year level'}</p>
                          {schedule.facilitator && <p>{schedule.facilitator}</p>}
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white pt-4">
                          <span className="text-sm font-semibold text-gray-600">
                            {slots > 0 ? `${Math.max(slots - participantCount, 0)} slots left` : 'Open slots'}
                          </span>
                          <button
                            type="button"
                            disabled={schedule.isRegistered || isFull}
                            onClick={() => handleParticipate(schedule._id)}
                            className={`px-4 py-2 text-sm font-semibold transition ${
                              schedule.isRegistered
                                ? 'bg-green-100 text-green-700'
                                : isFull
                                  ? 'bg-gray-200 text-gray-500'
                                  : 'bg-[#3a53a5] text-white hover:bg-[#2a3a85]'
                            } disabled:cursor-not-allowed`}
                          >
                            {schedule.isRegistered ? 'Registered' : isFull ? 'Full' : 'Participate'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Announcements</h2>
              <div className="space-y-4">
                {dashboardData.announcements.map((announcement, index) => (
                  <div key={index} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                    <p className="text-sm text-gray-800">{announcement}</p>
                  </div>
                ))}
              </div>
            </section>

            {dashboardData.newScheduleNotifications && dashboardData.newScheduleNotifications.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">New Recollection Notifications</h2>
                    <p className="text-sm text-gray-500">You have new recollection schedules matching your department and year level.</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {dashboardData.newScheduleNotifications.map((notification) => (
                    <div key={notification._id} className="rounded-2xl border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                        </div>
                        <span className="rounded-full bg-[#3a53a5] px-3 py-1 text-xs font-semibold text-white">New</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{notification.description}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <p className="text-sm text-gray-500">Venue: {notification.venue}</p>
                        <p className="text-sm text-gray-500">Date: {new Date(notification.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {dashboardData.availableEvaluations && dashboardData.availableEvaluations.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Available Evaluations</h2>
                <div className="space-y-4">
                  {dashboardData.availableEvaluations.map((evaluation) => (
                    <div key={evaluation._id} className="flex flex-col justify-between gap-4 border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4 sm:flex-row sm:items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{evaluation.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{evaluation.description}</p>
                        <p className="mt-2 text-sm text-gray-500">Due: {new Date(evaluation.dueDate).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleEnroll(evaluation._id)}
                        className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a3a85]"
                      >
                        Enroll
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Your Certificates</h2>
              {dashboardData.certificates.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No certificates yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {dashboardData.certificates.map((cert) => (
                    <div key={cert._id} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-gray-900">{cert.eventName}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold ${
                          cert.status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cert.status?.toUpperCase() || 'ISSUED'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {new Date(cert.eventDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="mt-5 flex justify-center bg-white p-4">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cert.qrCode || `CERT:${cert._id}:Xavier-eCMS`)}&color=333333&bgcolor=ffffff`}
                          alt="Certificate QR Code"
                          className="h-auto max-w-full shadow"
                          onError={(event) => {
                            event.target.src = 'https://via.placeholder.com/200x200/6b7280/ffffff?text=QR+Ready';
                            event.target.alt = 'QR Code Ready';
                          }}
                        />
                      </div>
                      <div className="mt-4 border-t border-white pt-4 text-center">
                        <p className="text-xs text-gray-500">Scan to verify</p>
                        <button className="mt-2 bg-white px-4 py-2 text-sm font-semibold text-[#3a53a5] transition hover:bg-gray-50">
                          Download Certificate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
