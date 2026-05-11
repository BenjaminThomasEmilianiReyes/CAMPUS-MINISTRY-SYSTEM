import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data || []);
      } catch (error) {
        toast.error('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      const matchesSearch = keyword
        ? [user.fullName, user.email, user.batch, user.role].some((value) =>
            String(value || '').toLowerCase().includes(keyword)
          )
        : true;

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const stats = [
    ['Total Accounts', users.length],
    ['Students', users.filter((user) => user.role === 'student').length],
    ['Faculty', users.filter((user) => user.role === 'staff').length],
    ['Admins', users.filter((user) => user.role === 'admin').length]
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
        MANAGE ACCOUNTS
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
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 1114 0H3z" />
              </svg>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 border-b px-6 py-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Accounts Center</h2>
              <p className="text-sm text-gray-500">Registered admin, faculty, and student accounts.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search accounts"
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5] sm:w-64"
              />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-10 border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5]"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Faculty</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Batch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{user.fullName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="bg-[#edf0f7] px-3 py-1 text-xs font-semibold uppercase text-[#3a53a5]">
                        {user.role === 'staff' ? 'Faculty' : user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{user.batch || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-10 text-center text-gray-500">No accounts match your filters.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageAccounts;
