import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getAdminUsers } from '../services/adminService';

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getRoleBadge(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'matched' : 'default';
}

function getStatusBadge(accessStatus) {
  const normalized = String(accessStatus || '').toLowerCase();
  if (normalized === 'active') return 'success';
  if (normalized === 'restricted') return 'critical';
  return 'pending';
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const result = await getAdminUsers({
          search: searchQuery,
          limit: PAGE_SIZE,
          page,
        });

        if (!cancelled) {
          setUsers(result.users);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load users.');
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, page]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">View registered users and account states.</p>
        </div>
        <Badge variant="default">{pagination.totalCount} total</Badge>
      </div>

      <Card className="space-y-4">
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSearchSubmit}>
          <Input
            className="sm:flex-1"
            icon={<Search size={18} />}
            placeholder="Search by name, email, or phone"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit" className="sm:w-auto">Search</Button>
        </form>

        {error && (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4 rounded-tl-xl">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-tr-xl">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-sm text-slate-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-sm text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="text-sm">
                    <td className="p-4 font-semibold text-on-surface">{user.full_name || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{user.email || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{user.phone || 'N/A'}</td>
                    <td className="p-4"><Badge variant={getRoleBadge(user.role)}>{user.role || 'user'}</Badge></td>
                    <td className="p-4"><Badge variant={getStatusBadge(user.access_status)}>{user.access_status || 'unknown'}</Badge></td>
                    <td className="p-4 text-slate-500">{formatDate(user.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs font-medium text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="px-4 py-2 text-xs"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              className="px-4 py-2 text-xs"
              onClick={() => setPage((prev) => Math.min(pagination.totalPages || 1, prev + 1))}
              disabled={loading || page >= (pagination.totalPages || 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
