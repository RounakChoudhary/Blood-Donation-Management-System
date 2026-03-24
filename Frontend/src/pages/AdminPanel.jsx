import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Users, Activity, CheckCircle, Handshake, Bell } from 'lucide-react';
import { getAdminDashboard } from '../services/adminService';

export default function AdminPanel() {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col border-b-4 border-b-primary shadow-sm hover:shadow-md transition-shadow">
          <Users size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{data?.metrics.totalDonors}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Donors</p>
        </Card>
        <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <Activity size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{data?.metrics.requestsToday}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Requests Today</p>
        </Card>
        <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <CheckCircle size={24} className="text-slate-400 mb-2" />
          <p className="text-4xl font-black text-on-surface tracking-tighter">{data?.metrics.fulfillmentRate}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Fulfillment Rate</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
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
            {data?.recentActivity.length > 0 ? (
              data.recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 border-b border-slate-50 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'match' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                    {activity.type === 'match' ? <Handshake size={16} /> : <Bell size={16} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${activity.type === 'alert' ? 'text-red-600' : ''}`}>{activity.title}</p>
                    <p className="text-xs text-slate-500">{activity.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-400">{activity.timeAgo}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">No recent activity.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
