import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getAdminHospitals, approveHospital, rejectHospital } from '../services/adminService';

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

function getOnboardingBadge(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'verified') return 'success';
  if (normalized === 'rejected') return 'critical';
  return 'pending';
}

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([]);
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
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHospitals() {
      setLoading(true);
      setError(null);
      try {
        const result = await getAdminHospitals({
          search: searchQuery,
          limit: PAGE_SIZE,
          page,
        });

        if (!cancelled) {
          setHospitals(result.hospitals);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load hospitals.');
          setHospitals([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHospitals();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, page]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleStatusAction = async (hospitalId, actionType) => {
    setActionError(null);
    setActionSuccess(null);
    setActiveActionId(hospitalId);

    try {
      if (actionType === 'approve') {
        const res = await approveHospital(hospitalId);
        setActionSuccess(res?.message || 'Hospital approved successfully.');
      } else {
        const res = await rejectHospital(hospitalId);
        setActionSuccess(res?.message || 'Hospital rejected successfully.');
      }

      const refreshed = await getAdminHospitals({
        search: searchQuery,
        limit: PAGE_SIZE,
        page,
      });
      setHospitals(refreshed.hospitals);
      setPagination(refreshed.pagination);
    } catch (err) {
      setActionError(err.message || `Failed to ${actionType} hospital.`);
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Hospitals</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Review onboarding status and verify hospital accounts.</p>
        </div>
        <Badge variant="default">{pagination.totalCount} total</Badge>
      </div>

      <Card className="space-y-4">
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSearchSubmit}>
          <Input
            className="sm:flex-1"
            icon={<Search size={18} />}
            placeholder="Search by hospital name, email, or phone"
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
                <th className="p-4 rounded-tl-xl">Hospital</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Verified At</th>
                <th className="p-4 rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-sm text-slate-500">Loading hospitals...</td>
                </tr>
              ) : hospitals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-sm text-slate-500">No hospitals found.</td>
                </tr>
              ) : (
                hospitals.map((hospital) => {
                  const status = String(hospital.onboarding_status || '').toLowerCase();
                  const isPending = status === 'pending';
                  const isBusy = activeActionId === hospital.id;

                  return (
                    <tr key={hospital.id} className="text-sm">
                      <td className="p-4">
                        <p className="font-semibold text-on-surface">{hospital.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500 mt-1">{hospital.address || 'Address not available'}</p>
                      </td>
                      <td className="p-4 text-slate-600">{hospital.email || 'N/A'}</td>
                      <td className="p-4 text-slate-600">{hospital.phone || 'N/A'}</td>
                      <td className="p-4">
                        <Badge variant={getOnboardingBadge(status)}>{status || 'unknown'}</Badge>
                      </td>
                      <td className="p-4 text-slate-500">{formatDate(hospital.verified_at)}</td>
                      <td className="p-4">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <Button
                              className="px-3 py-2 text-xs"
                              disabled={isBusy}
                              onClick={() => handleStatusAction(hospital.id, 'approve')}
                            >
                              {isBusy ? 'Updating...' : 'Approve'}
                            </Button>
                            <Button
                              variant="secondary"
                              className="px-3 py-2 text-xs"
                              disabled={isBusy}
                              onClick={() => handleStatusAction(hospital.id, 'reject')}
                            >
                              {isBusy ? 'Updating...' : 'Reject'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">No actions</span>
                        )}
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
