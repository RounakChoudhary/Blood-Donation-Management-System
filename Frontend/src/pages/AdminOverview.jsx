import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import {
  Users,
  Activity,
  CheckCircle,
  Droplet,
  Clock3,
  Target,
  HeartHandshake,
  Building2,
  Syringe,
  TimerReset,
} from 'lucide-react';
import { getAdminDashboard, getAdminReports } from '../services/adminService';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatPercent(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? `${normalized.toFixed(1)}%` : '0.0%';
}

function formatDate(value) {
  if (!value) return 'No donations recorded';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No donations recorded';

  return parsed.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusVariant(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'fulfilled') return 'success';
  if (normalized === 'pending' || normalized === 'open') return 'pending';
  if (normalized === 'cancelled' || normalized === 'rejected') return 'critical';
  return 'default';
}

export default function AdminOverview() {
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadAdminOverview() {
      try {
        const [dashboardData, reportData] = await Promise.all([
          getAdminDashboard(),
          getAdminReports(),
        ]);

        if (!active) return;
        setDashboard(dashboardData);
        setReports(reportData);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError('Failed to load admin overview.');
        setLoading(false);
      }
    }

    loadAdminOverview();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-xl font-medium">
        {error}
      </div>
    );
  }

  const donationReport = reports?.donation_report || {};
  const emergencyReport = reports?.emergency_response_report || {};
  const bloodGroups = donationReport.by_blood_group || [];
  const statusBreakdown = emergencyReport.status_breakdown || [];
  const leadingBloodGroup = bloodGroups.reduce((top, item) => {
    if (!top) return item;
    return Number(item.total_units || 0) > Number(top.total_units || 0) ? item : top;
  }, null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Platform Administration</h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">
          System-wide metrics, donation reporting, and emergency response performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col border-b-4 border-b-primary shadow-sm hover:shadow-md transition-shadow">
          <Users size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{formatNumber(dashboard?.users)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Users</p>
        </Card>
        <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <Activity size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{formatNumber(dashboard?.hospitals)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Hospitals</p>
        </Card>
        <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <CheckCircle size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{formatNumber(dashboard?.bloodBanks)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Blood Banks</p>
        </Card>
        <Card className="flex flex-col border-b-4 border-b-red-500 shadow-sm hover:shadow-md transition-shadow">
          <Droplet size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{formatNumber(dashboard?.bloodRequests)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Requests</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Pending Verifications</h2>
          <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-6 rounded-2xl">
            <div className="bg-white p-4 rounded-xl text-center border-b-2 border-orange-400 shadow-sm">
              <p className="text-[10px] font-bold mb-1 text-orange-500">Hospitals</p>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(dashboard?.pendingHospitals)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl text-center border-b-2 border-orange-400 shadow-sm">
              <p className="text-[10px] font-bold mb-1 text-orange-500">Blood Banks</p>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(dashboard?.pendingBloodBanks)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Operational Metrics</h2>
          <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-6 rounded-2xl">
            <div className="bg-white p-4 rounded-xl border-b-2 border-blue-400 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock3 size={16} />
                <p className="text-[10px] font-bold uppercase tracking-wider">Requests Today</p>
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                {formatNumber(dashboard?.requestsToday)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border-b-2 border-emerald-400 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600">
                <Target size={16} />
                <p className="text-[10px] font-bold uppercase tracking-wider">Fulfillment Rate</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-2">
                {formatPercent(dashboard?.fulfillmentRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.3fr_0.9fr] gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Donation Report</h2>
          <Card className="space-y-5">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100">
                <div className="flex items-center gap-2 text-rose-700">
                  <Users size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Total Donors</p>
                </div>
                <p className="text-2xl font-black text-rose-900 mt-3">{formatNumber(donationReport.total_donors)}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700">
                  <Syringe size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Donation Records</p>
                </div>
                <p className="text-2xl font-black text-blue-900 mt-3">{formatNumber(donationReport.total_donation_records)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Droplet size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Units Donated</p>
                </div>
                <p className="text-2xl font-black text-emerald-900 mt-3">{formatNumber(donationReport.total_units_donated)}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                <div className="flex items-center gap-2 text-amber-700">
                  <Building2 size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Hospitals Served</p>
                </div>
                <p className="text-2xl font-black text-amber-900 mt-3">{formatNumber(donationReport.unique_hospitals)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-surface-container-low p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Coverage Snapshot</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Unique donors who donated</span>
                    <span className="font-bold text-on-surface">{formatNumber(donationReport.unique_donors)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Latest donation date</span>
                    <span className="font-bold text-on-surface">{formatDate(donationReport.latest_donation_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Leading blood group</span>
                    <span className="font-bold text-on-surface">
                      {leadingBloodGroup ? `${leadingBloodGroup.blood_group} (${formatNumber(leadingBloodGroup.total_units)} units)` : 'No data'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">By Blood Group</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {bloodGroups.length > 0 ? bloodGroups.map((group) => (
                    <div key={group.blood_group} className="rounded-xl bg-white border border-slate-100 p-3">
                      <p className="text-xs font-bold text-on-surface">{group.blood_group}</p>
                      <p className="text-lg font-black text-primary mt-2">{formatNumber(group.total_units)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {formatNumber(group.donation_count)} donations
                      </p>
                    </div>
                  )) : (
                    <div className="col-span-full text-sm text-on-surface-variant">
                      No donation report data available yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Emergency Response Report</h2>
          <Card className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-red-50 p-4 border border-red-100">
                <div className="flex items-center gap-2 text-red-700">
                  <HeartHandshake size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Total Requests</p>
                </div>
                <p className="text-2xl font-black text-red-900 mt-3">{formatNumber(emergencyReport.total_requests)}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4 border border-sky-100">
                <div className="flex items-center gap-2 text-sky-700">
                  <Droplet size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Units Requested</p>
                </div>
                <p className="text-2xl font-black text-sky-900 mt-3">{formatNumber(emergencyReport.total_units_requested)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Fulfilled</p>
                </div>
                <p className="text-2xl font-black text-emerald-900 mt-3">{formatNumber(emergencyReport.fulfilled_requests)}</p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-4 border border-violet-100">
                <div className="flex items-center gap-2 text-violet-700">
                  <TimerReset size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Avg Response</p>
                </div>
                <p className="text-2xl font-black text-violet-900 mt-3">
                  {emergencyReport.average_response_minutes === null
                    ? 'N/A'
                    : `${Math.round(Number(emergencyReport.average_response_minutes))} min`}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Request Status Breakdown</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {statusBreakdown.length > 0 ? statusBreakdown.map((item) => (
                  <Badge key={item.status} variant={getStatusVariant(item.status)}>
                    {item.status}: {formatNumber(item.request_count)}
                  </Badge>
                )) : (
                  <span className="text-sm text-on-surface-variant">No request status data available yet.</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Match Outcomes</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Total donor matches</span>
                  <span className="font-bold text-on-surface">{formatNumber(emergencyReport.total_matches)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Accepted matches</span>
                  <span className="font-bold text-emerald-700">{formatNumber(emergencyReport.accepted_matches)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Declined matches</span>
                  <span className="font-bold text-red-700">{formatNumber(emergencyReport.declined_matches)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Awaiting response</span>
                  <span className="font-bold text-amber-700">{formatNumber(emergencyReport.awaiting_response_matches)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">No response</span>
                  <span className="font-bold text-slate-700">{formatNumber(emergencyReport.no_response_matches)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-on-surface-variant">Open requests</span>
                  <span className="font-bold text-on-surface">{formatNumber(emergencyReport.open_requests)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Cancelled requests</span>
                  <span className="font-bold text-on-surface">{formatNumber(emergencyReport.cancelled_requests)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
