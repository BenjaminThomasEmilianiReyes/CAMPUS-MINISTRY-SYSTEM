import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const StudentRecords = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [completionStatus, setCompletionStatus] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const params = new URLSearchParams();
        if (completionStatus) params.append('completionStatus', completionStatus);

        const response = await api.get(`/admin/students?${params.toString()}`);
        setStudents(response.data || []);
      } catch (error) {
        toast.error('Failed to load student records');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [completionStatus]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return students;

    return students.filter((student) =>
      [student.fullName, student.email, student.studentId, student.batch, student.department].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      )
    );
  }, [students, search]);

  const stats = [
    ['Student Records', students.length],
    ['With Submissions', students.filter((student) => student.completedEvaluations > 0).length],
    ['Pending', students.filter((student) => !student.completedEvaluations).length],
    ['Departments', new Set(students.map((student) => student.department).filter(Boolean)).size]
  ];

  if (loading) {
    return (
      <div className="-m-6 flex min-h-screen items-center justify-center bg-[#edf0f7]">
        <div className="h-24 w-24 animate-spin rounded-full border-b-2 border-[#3a53a5]" />
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        STUDENT RECORDS
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg">
              <div>
                <div className="text-sm font-semibold uppercase text-gray-500">{label}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
              </div>
              <svg className="h-9 w-9 text-[#3a53a5]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4C3.567 4 2 4.895 2 6v9c0 1.105 1.567 2 3.5 2 1.292 0 2.42-.4 3-1 .58.6 1.708 1 3 1 1.933 0 3.5-.895 3.5-2V6c0-1.105-1.567-2-3.5-2a7.968 7.968 0 00-3.5.804z" />
              </svg>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 border-b px-6 py-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Student List</h2>
              <p className="text-sm text-gray-500">Student information, course/year, and evaluation completion progress.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students"
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5] sm:w-64"
              />
              <select
                value={completionStatus}
                onChange={(event) => setCompletionStatus(event.target.value)}
                className="h-10 border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5]"
              >
                <option value="">All Students</option>
                <option value="completed">With Submissions</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Batch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Completed</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Latest Submission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{student.fullName}</p>
                      <p className="text-sm text-gray-500">{student.studentId || '-'}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.department || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.batch || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#3a53a5]">
                      {student.completedEvaluations || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {student.latestSubmissionAt ? new Date(student.latestSubmissionAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="py-10 text-center text-gray-500">No students match your filters.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentRecords;
