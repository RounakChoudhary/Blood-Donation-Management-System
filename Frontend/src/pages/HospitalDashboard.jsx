import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { AlertTriangle, MapPin } from 'lucide-react';
import { getHospitalDashboard, createEmergencyRequest } from '../services/hospitalService';

export default function HospitalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getHospitalDashboard()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load hospital data.");
        setLoading(false);
      });
  }, []);

  const handleRequestSubmission = async () => {
    setIsSubmitting(true);
    try {
      await createEmergencyRequest({ group: 'O-', urgency: 'Critical' });
      setModalOpen(false);
      // Re-fetch data or update locally if real backend
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Emergency Dashboard</h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Manage active blood requirements and donor matching.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <AlertTriangle size={20} />
          Create Emergency Request
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Active Requests</h2>
          <div className="space-y-3">
            {data?.activeRequests.length > 0 ? (
              data.activeRequests.map((req) => (
                <Card key={req.id} className={`p-5 flex justify-between items-start border-l-4 ${req.status === 'critical' ? 'border-red-600' : req.status === 'pending' ? 'border-amber-400' : 'border-blue-500'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${req.status === 'critical' ? 'bg-error-container text-on-error-container' : req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {req.group}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm">{req.hosp}</h4>
                      <p className="text-xs text-slate-500 font-medium">{req.info}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Responses: {req.responseSummary?.accepted ?? 0} accepted, {req.responseSummary?.declined ?? 0} declined, {req.responseSummary?.pending ?? 0} pending
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          <span>Fulfillment</span>
                          <span>{req.fulfillmentPercent ?? 0}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, req.fulfillmentPercent ?? 0))}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={req.status}>{req.status}</Badge>
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm p-4 text-center">No active requests.</p>
            )}
          </div>
        </div>

        {/* Nearby Matches */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Matched Donors (Nearby)</h2>
          <div className="grid grid-cols-2 gap-4">
            {data?.matchedDonors.length > 0 ? (
              data.matchedDonors.map((donor) => (
                <Card key={donor.id} className="p-5 flex flex-col justify-between h-48">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
                        {donor.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight">{donor.name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{donor.distance} km away</p>
                      </div>
                    </div>
                    <Badge variant="default" className="w-fit">{donor.group} Group</Badge>
                  </div>
                  <Button variant="secondary" className="w-full text-xs py-2 h-auto mt-4">Notify Donor</Button>
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm p-4 col-span-2 text-center">No matched donors available.</p>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create Emergency Request" description="Broadcast a critical blood requirement to eligible donors nearby.">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Blood Group Needed</label>
            <div className="grid grid-cols-4 gap-2">
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((type) => (
                <button key={type} className={`py-3 rounded-lg text-sm font-bold transition-colors ${type === 'O-' ? 'border-2 border-primary bg-primary/5 text-primary' : 'border border-surface-container-highest hover:bg-surface-container'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Input icon={<MapPin size={18} />} placeholder="Hospital or Collection Point" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Urgency" options={['Critical', 'High', 'Medium']} />
            <Input label="Units (ml)" type="number" placeholder="e.g. 450" />
          </div>
          <Button className="w-full mt-4" disabled={isSubmitting} onClick={handleRequestSubmission}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
