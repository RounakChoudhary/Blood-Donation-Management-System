import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { HeartHandshake } from 'lucide-react';
import { getDonorDashboard } from '../services/donorService';

export default function DonorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDonorDashboard()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load dashboard data.");
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
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Donor Interface</h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">Manage your eligibility and track your impact.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Wait Period</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tighter text-on-surface">{data?.daysRemaining}</span>
                <span className="text-lg font-medium text-slate-400">Days Remaining</span>
              </div>
            </div>
            {data?.isCooldown ? (
              <Badge variant="critical">Cooldown</Badge>
            ) : (
              <Badge variant="success">Eligible</Badge>
            )}
          </div>
          
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Profile Completion</span>
              <span className="text-primary">{data?.profileCompletion}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${data?.profileCompletion}%` }}></div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center items-center text-center space-y-3 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="w-16 h-16 rounded-full bg-error-container text-primary flex items-center justify-center mb-2">
            <HeartHandshake size={32} />
          </div>
          <h3 className="font-bold text-lg">Total Donations</h3>
          <p className="text-4xl font-black text-primary">{data?.totalDonations}</p>
          <p className="text-xs text-slate-500 font-medium">Lives impacted: ~{data?.livesImpacted}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Recent History</h2>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4 rounded-tl-xl">Date</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4 rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.history.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-slate-500">No donation history found.</td>
                  </tr>
                ) : (
                  data?.history.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="p-4 font-medium">{item.date}</td>
                      <td className="p-4 text-slate-500">{item.location}</td>
                      <td className="p-4"><Badge>{item.bloodGroup}</Badge></td>
                      <td className="p-4">
                        <Badge variant={item.status.toLowerCase() === 'fulfilled' ? 'success' : 'pending'}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
