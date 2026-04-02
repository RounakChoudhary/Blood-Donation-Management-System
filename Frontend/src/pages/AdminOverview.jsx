import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Users, Activity, CheckCircle, Handshake, Bell, Droplet } from 'lucide-react';
import { getAdminDashboard } from '../services/adminService';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminDashboard()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load admin data.");
        setLoading(false);
      });
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Platform Administration</h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">System-wide metrics and inventory oversight.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col border-b-4 border-b-primary shadow-sm hover:shadow-md transition-shadow">
          <Users size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{data?.users || 0}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Donors</p>
        </Card>
        <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <Activity size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{data?.hospitals || 0}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Hospitals</p>
        </Card>
        <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <CheckCircle size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{data?.bloodBanks || 0}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Blood Banks</p>
        </Card>
        <Card className="flex flex-col border-b-4 border-b-red-500 shadow-sm hover:shadow-md transition-shadow">
          <Droplet size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{data?.bloodRequests || 0}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Active Requests</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Pending Verifications</h2>
          <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-6 rounded-2xl">
            <div className={`bg-white p-4 rounded-xl text-center border-b-2 border-orange-400 shadow-sm`}>
              <p className={`text-[10px] font-bold mb-1 text-orange-500`}>Hospitals</p>
              <p className={`text-2xl font-bold text-orange-600`}>{data?.pendingHospitals || 0}</p>
            </div>
             <div className={`bg-white p-4 rounded-xl text-center border-b-2 border-orange-400 shadow-sm`}>
              <p className={`text-[10px] font-bold mb-1 text-orange-500`}>Blood Banks</p>
              <p className={`text-2xl font-bold text-orange-600`}>{data?.pendingBloodBanks || 0}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Central Inventory Levels</h2>
          <div className="grid grid-cols-4 gap-3 bg-surface-container-low p-6 rounded-2xl">
            {data?.centralInventory.map((inv) => (
              <div key={inv.type} className={`bg-white p-4 rounded-xl text-center border-b-2 ${inv.critical ? 'border-red-600' : 'border-slate-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold mb-1 ${inv.critical ? 'text-red-500' : 'text-slate-400'}`}>{inv.type}</p>
                <p className={`text-2xl font-bold ${inv.critical ? 'text-red-600' : 'text-on-surface'}`}>{inv.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
          <Card className="p-0 overflow-hidden">
            <div className="p-4 text-center text-slate-500 text-sm">System audit logs are coming soon.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
