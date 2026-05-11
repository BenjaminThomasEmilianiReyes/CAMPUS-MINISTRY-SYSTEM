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

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-4">
          Faculty Dashboard
        </h1>
        <p className="text-xl text-gray-600">
          {data?.faculty?.department || 'Assigned department'}
          {data?.faculty?.batch ? ` • ${data.faculty.batch}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
        {[
          ['Assigned Students', stats.assignedStudents || 0],
          ['Completed Students', stats.completedStudents || 0],
          ['Pending Students', stats.pendingStudents || 0],
          ['Evaluations', stats.scopedEvaluations || 0],
          ['Recollections', stats.upcomingRecollections || 0]
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl shadow-xl p-7">
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link
          to="/admin/evaluation-builder"
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
        >
          <h2 className="text-2xl font-bold mb-1">Create Evaluation</h2>
          <p className="opacity-90">Post an evaluation to your assigned students.</p>
        </Link>
        <Link
          to="/admin/recollections"
          className="bg-gradient-to-r from-secondary to-primary text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
        >
          <h2 className="text-2xl font-bold mb-1">Create Recollection</h2>
          <p className="opacity-90">Schedule recollections for your assigned group.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Assigned Students</h2>
            <p className="text-gray-600 mt-2">Faculty can view and recommend certificates only for this scoped group.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Batch</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Submitted</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Certificates</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {recommending === student._id ? 'Sending...' : 'Recommend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data?.students || data.students.length === 0) && (
              <div className="text-center py-10 text-gray-500">No students assigned to this faculty scope.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Recommendations</h2>
          <div className="space-y-4">
            {(data?.recommendations || []).length === 0 ? (
              <p className="text-gray-500">No certificate recommendations yet.</p>
            ) : (
              data.recommendations.map((recommendation) => (
                <div key={recommendation._id} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900">{recommendation.student?.fullName}</p>
                  <p className="text-sm text-gray-500">{recommendation.student?.studentId}</p>
                  <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold capitalize">
                    {recommendation.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Evaluation Monitoring</h2>
          <div className="space-y-4">
            {(data?.evaluations || []).map((evaluation) => (
              <div key={evaluation._id} className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900">{evaluation.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{evaluation.batch} • Due {new Date(evaluation.dueDate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 mt-2">{evaluation.submissionCount}/{evaluation.assignedCount} submitted</p>
              </div>
            ))}
            {(!data?.evaluations || data.evaluations.length === 0) && (
              <p className="text-gray-500">No evaluations found for this faculty scope.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Relevant Recollections</h2>
          <div className="space-y-4">
            {(data?.recollections || []).map((recollection) => (
              <div key={recollection._id} className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900">{recollection.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{new Date(recollection.date).toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-2">{recollection.participantCount}/{recollection.slots || 0} registered</p>
              </div>
            ))}
            {(!data?.recollections || data.recollections.length === 0) && (
              <p className="text-gray-500">No upcoming recollections for this faculty scope.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
