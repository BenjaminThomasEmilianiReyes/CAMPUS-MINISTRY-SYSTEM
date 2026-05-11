import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/faculty/dashboard');
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load faculty dashboard');
    } finally {
      setLoading(false);
    }
  };

  const recommendCertificate = async (studentId) => {
    setRecommending(studentId);
    try {
      await api.post('/faculty/certificate-recommendations', { studentId });
      toast.success('Certificate recommendation sent to admin');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to recommend certificate');
    } finally {
      setRecommending('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const statCards = [
    ['Assigned Students', stats.assignedStudents || 0],
    ['Completed Students', stats.completedStudents || 0],
    ['Pending Students', stats.pendingStudents || 0],
    ['Evaluations', stats.scopedEvaluations || 0],
    ['Recollections', stats.upcomingRecollections || 0]
  ];

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-3 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        FACULTY DASHBOARD
      </h1>
      <p className="mx-6 mb-6 text-center text-sm font-semibold uppercase tracking-wide text-gray-500 lg:mx-9">
        {data?.faculty?.department || 'Assigned department'}
        {data?.faculty?.batch ? ` / ${data.faculty.batch}` : ''}
      </p>

      <div className="mx-6 space-y-8 lg:mx-9">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg">
              <div>
                <div className="text-sm font-semibold uppercase text-gray-500">{label}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
              </div>
              <svg className="h-9 w-9 text-[#3a53a5]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            to="/admin/evaluation-builder"
            className="rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <h2 className="text-xl font-semibold text-[#3a53a5]">Create Evaluation</h2>
            <p className="mt-2 text-sm text-gray-500">Post an evaluation to your assigned students.</p>
          </Link>
          <Link
            to="/admin/recollections"
            className="rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <h2 className="text-xl font-semibold text-[#3a53a5]">Create Recollection</h2>
            <p className="mt-2 text-sm text-gray-500">Schedule recollections for your assigned group.</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <section className="overflow-hidden rounded-2xl bg-white shadow-lg xl:col-span-2">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Assigned Students</h2>
              <p className="text-sm text-gray-500">View scoped students and recommend certificates.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Batch</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Certificates</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {(data?.students || []).map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{student.fullName}</p>
                        <p className="text-sm text-gray-500">{student.studentId}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.batch || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.completedEvaluations || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.certificateCount || 0}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled={!student.completedEvaluations || recommending === student._id}
                          onClick={() => recommendCertificate(student._id)}
                          className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a3a85] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {recommending === student._id ? 'Sending...' : 'Recommend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.students || data.students.length === 0) && (
                <div className="py-10 text-center text-gray-500">No students assigned to this faculty scope.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Recent Recommendations</h2>
            <div className="space-y-4">
              {(data?.recommendations || []).length === 0 ? (
                <p className="text-gray-500">No certificate recommendations yet.</p>
              ) : (
                data.recommendations.map((recommendation) => (
                  <div key={recommendation._id} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                    <p className="font-semibold text-gray-900">{recommendation.student?.fullName}</p>
                    <p className="text-sm text-gray-500">{recommendation.student?.studentId}</p>
                    <span className="mt-3 inline-flex bg-yellow-100 px-3 py-1 text-sm font-semibold capitalize text-yellow-800">
                      {recommendation.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Evaluation Monitoring</h2>
            <div className="space-y-4">
              {(data?.evaluations || []).map((evaluation) => (
                <div key={evaluation._id} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                  <h3 className="font-semibold text-gray-900">{evaluation.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{evaluation.batch} / Due {new Date(evaluation.dueDate).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-gray-600">{evaluation.submissionCount}/{evaluation.assignedCount} submitted</p>
                </div>
              ))}
              {(!data?.evaluations || data.evaluations.length === 0) && (
                <p className="text-gray-500">No evaluations found for this faculty scope.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Relevant Recollections</h2>
            <div className="space-y-4">
              {(data?.recollections || []).map((recollection) => (
                <div key={recollection._id} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                  <h3 className="font-semibold text-gray-900">{recollection.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{new Date(recollection.date).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-gray-600">{recollection.participantCount}/{recollection.slots || 0} registered</p>
                </div>
              ))}
              {(!data?.recollections || data.recollections.length === 0) && (
                <p className="text-gray-500">No upcoming recollections for this faculty scope.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
