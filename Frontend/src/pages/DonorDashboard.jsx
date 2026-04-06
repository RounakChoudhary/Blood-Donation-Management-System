import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { HeartHandshake } from 'lucide-react';
import { getDonorDashboard, getDonorRequests, respondToDonorRequest, becomeVolunteer } from '../services/donorService';

function DonorOnboarding({ onComplete }) {
  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    age: '',
    bmi: '',
    lastDonatedDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await becomeVolunteer(formData);
      onComplete();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-8">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <HeartHandshake size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Become a Volunteer Donor</h1>
        <p className="text-on-surface-variant font-medium">You haven't registered as a donor yet. Complete your profile below to start saving lives today.</p>
      </div>

      <Card className="p-8">
        {error && <div className="p-4 mb-6 bg-error-container text-on-error-container rounded-xl text-sm font-semibold">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Blood Group *</label>
              <select 
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={formData.bloodGroup}
                onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                required
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Age *</label>
              <input 
                type="number" min="18" max="65" placeholder="e.g. 28"
                className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">BMI *</label>
              <input 
                type="number" step="0.1" min="18.5" max="30" placeholder="e.g. 22.5"
                className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.bmi}
                onChange={e => setFormData({...formData, bmi: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Last Donation Date</label>
              <input 
                type="date"
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.lastDonatedDate}
                onChange={e => setFormData({...formData, lastDonatedDate: e.target.value})}
              />
            </div>
          </div>
          <Button type="submit" className="w-full py-4 text-base" disabled={submitting}>
            {submitting ? "Registering..." : "Register as Volunteer"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function DonorDashboard() {
  const [data, setData] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMatchActionId, setActiveMatchActionId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const loadDonorDashboard = async () => {
      try {
        const [dashboard, requests] = await Promise.all([
          getDonorDashboard(),
          getDonorRequests(),
        ]);
        setData(dashboard);
        setPendingRequests(requests);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDonorDashboard();
  }, []);

  const handleMatchAction = async (matchId, action) => {
    setActiveMatchActionId(matchId);
    setActionMessage(null);
    setActionError(null);

    try {
      await respondToDonorRequest(matchId, action);

      setPendingRequests((previousRequests) =>
        previousRequests.filter((request) => request.matchId !== matchId)
      );
      setActionMessage(action === 'accept'
        ? "Request accepted successfully."
        : "Request declined successfully.");

      const refreshedDashboard = await getDonorDashboard();
      setData(refreshedDashboard);
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update request status.");
    } finally {
      setActiveMatchActionId(null);
    }
  };

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

  if (data?.needsOnboarding) {
    return <DonorOnboarding onComplete={() => window.location.reload()} />;
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
        <h2 className="text-xl font-bold tracking-tight">Pending Requests</h2>

        {actionMessage && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm font-semibold">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-semibold">
            {actionError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <Card key={request.matchId} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base">Request #{request.requestId}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{request.createdAt}</p>
                  </div>
                  <Badge variant="pending">Pending</Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-on-surface">Hospital:</span> {request.hospitalName}</p>
                  <p><span className="font-semibold text-on-surface">Blood Group:</span> {request.bloodGroup}</p>
                  <p><span className="font-semibold text-on-surface">Units Required:</span> {request.unitsRequired}</p>
                  <p><span className="font-semibold text-on-surface">Hospital Distance:</span> {request.distanceKm} km</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleMatchAction(request.matchId, 'accept')}
                    disabled={activeMatchActionId === request.matchId}
                  >
                    {activeMatchActionId === request.matchId ? "Processing..." : "Accept"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleMatchAction(request.matchId, 'reject')}
                    disabled={activeMatchActionId === request.matchId}
                  >
                    {activeMatchActionId === request.matchId ? "Processing..." : "Decline"}
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2">
              <p className="text-sm text-slate-500 text-center">No pending requests.</p>
            </Card>
          )}
        </div>
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
