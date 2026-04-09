import React, { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getAdminBloodRequests, deleteAdminBloodRequest } from '../services/adminService';

const PAGE_SIZE = 10;

function formatDateTime(value) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'fulfilled') return 'success';
  if (normalized === 'active' || normalized === 'matching') return 'matched';
  if (normalized === 'cancelled') return 'critical';
  return 'pending';
}

export default function AdminBloodRequests() {
  const [requests, setRequests] = useState([]);
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
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [activeDeleteId, setActiveDeleteId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      setLoading(true);
      setError(null);
      try {
        const result = await getAdminBloodRequests({
          search: searchQuery,
          limit: PAGE_SIZE,
          page,
        });

        if (!cancelled) {
          setRequests(result.requests);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load blood requests.');
          setRequests([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, page]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleDelete = async (requestId) => {
    const shouldDelete = window.confirm(`Delete blood request #${requestId}? This action cannot be undone.`);
    if (!shouldDelete) return;

    setActionError(null);
    setActionSuccess(null);
    setActiveDeleteId(requestId);

    try {
      const res = await deleteAdminBloodRequest(requestId);
      setActionSuccess(res?.message || 'Blood request deleted successfully.');

      const refreshed = await getAdminBloodRequests({
        search: searchQuery,
        limit: PAGE_SIZE,
        page,
      });
      setRequests(refreshed.requests);
      setPagination(refreshed.pagination);
    } catch (err) {
      setActionError(err.message || 'Failed to delete blood request.');
    } finally {
      setActiveDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Blood Requests</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Monitor emergency requests and remove invalid entries.</p>
        </div>
        <Badge variant="default">{pagination.totalCount} total</Badge>
      </div>

      <Card className="space-y-4">
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSearchSubmit}>
          <Input
            className="sm:flex-1"
            icon={<Search size={18} />}
            placeholder="Search by blood group or status"
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
        {actionError && (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
            {actionSuccess}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4 rounded-tl-xl">Request</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">Units</th>
                <th className="p-4">Urgency</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-sm text-slate-500">Loading blood requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-sm text-slate-500">No blood requests found.</td>
                </tr>
              ) : (
                requests.map((request) => {
                  const requestId = Number(request.id);
                  const isBusy = activeDeleteId === requestId;
                  return (
                    <tr key={requestId} className="text-sm">
                      <td className="p-4">
                        <p className="font-semibold text-on-surface">Request #{requestId}</p>
                        <p className="text-xs text-slate-500 mt-1">Hospital ID: {request.hospital_id || 'N/A'}</p>
                      </td>
                      <td className="p-4 text-slate-700 font-semibold">{request.blood_group || 'N/A'}</td>
                      <td className="p-4 text-slate-600">{request.units_required ?? 'N/A'}</td>
                      <td className="p-4 text-slate-600">{request.urgency_level || 'N/A'}</td>
                      <td className="p-4">
                        <Badge variant={getStatusBadge(request.status)}>{request.status || 'unknown'}</Badge>
                      </td>
                      <td className="p-4 text-slate-500">{formatDateTime(request.created_at)}</td>
                      <td className="p-4">
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          disabled={isBusy}
                          onClick={() => handleDelete(requestId)}
                        >
                          <Trash2 size={14} />
                          {isBusy ? 'Deleting...' : 'Delete'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
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
