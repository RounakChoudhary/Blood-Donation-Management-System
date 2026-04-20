import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Building2, CalendarDays, Clock3, Mail, Map, MapPin, Phone, TentTree, User } from 'lucide-react';
import { getOrganiserCampProposals, proposeCamp } from '../services/campService';

const INITIAL_FORM = {
  name: '',
  date: '',
  time: '',
  venue_name: '',
  address: '',
  lat: '',
  lon: '',
  capacity: '',
  organiser_name: '',
  organiser_phone: '',
  organiser_email: '',
};

export default function CampOrganizer() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assignedBloodBank, setAssignedBloodBank] = useState(null);
  const [proposalHistory, setProposalHistory] = useState([]);
  const [historyEmail, setHistoryEmail] = useState('');

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const loadProposalHistory = async (organiserEmail) => {
    const normalizedEmail = String(organiserEmail || '').trim();
    if (!normalizedEmail) {
      setProposalHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const proposals = await getOrganiserCampProposals(normalizedEmail);
      setProposalHistory(proposals);
    } catch (err) {
      setError(err.message || 'Failed to load proposal history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setAssignedBloodBank(null);

    try {
      const organiserEmail = formData.organiser_email;
      const result = await proposeCamp({
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
      });
      setSuccess(result.message);
      setAssignedBloodBank(result.assignedBloodBank || null);
      setHistoryEmail(organiserEmail);
      await loadProposalHistory(organiserEmail);
      setFormData(INITIAL_FORM);
    } catch (err) {
      setError(err.message || 'Failed to submit camp proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <Card className="space-y-5 bg-gradient-to-br from-red-50 via-white to-amber-50 border-red-100">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <TentTree size={28} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">Organise a Blood Donation Camp</h1>
              <p className="text-sm text-on-surface-variant font-medium">
                Submit your camp proposal with venue, timing, and organiser details. Blood bank-approved camps become visible to nearby donors for discovery.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/80 border border-red-100 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">1. Submit</p>
                <p className="text-sm text-slate-600 mt-2">Share the camp schedule, venue, and contact details.</p>
              </div>
              <div className="rounded-2xl bg-white/80 border border-red-100 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">2. Review</p>
                <p className="text-sm text-slate-600 mt-2">The nearest verified blood bank reviews the proposal and marks it as accepted or rejected.</p>
              </div>
              <div className="rounded-2xl bg-white/80 border border-red-100 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">3. Discover</p>
                <p className="text-sm text-slate-600 mt-2">Accepted camps appear in donor camp discovery based on proximity.</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight">Before You Submit</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Provide accurate latitude and longitude so donors can discover the camp nearby.</p>
              <p>Capacity is optional, but adding it helps donors understand expected turnout.</p>
              <p>You will receive an email update once the assigned blood bank accepts or rejects your proposal.</p>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Back to account access? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
            </p>
          </Card>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-200 font-medium">
            {success}
            {assignedBloodBank && (
              <p className="text-sm mt-2 space-y-1">
                <span>Assigned blood bank: <span className="font-bold">{assignedBloodBank.name}</span></span>
              </p>
            )}
          </div>
        )}

        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Camp Proposal Details</h2>
            <p className="text-sm text-on-surface-variant mt-1">All fields except capacity are required by the current API.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Camp Name"
                placeholder="City Lifeline Donation Drive"
                icon={<TentTree size={18} />}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
              <Input
                label="Venue Name"
                placeholder="Town Hall Auditorium"
                icon={<MapPin size={18} />}
                value={formData.venue_name}
                onChange={(e) => updateField('venue_name', e.target.value)}
                required
              />
              <Input
                label="Date"
                type="date"
                icon={<CalendarDays size={18} />}
                value={formData.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />
              <Input
                label="Time"
                type="time"
                icon={<Clock3 size={18} />}
                value={formData.time}
                onChange={(e) => updateField('time', e.target.value)}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Full Address"
                  placeholder="123 Civic Center Road, Pune"
                  icon={<MapPin size={18} />}
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  required
                />
              </div>
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="18.5204"
                icon={<Map size={18} />}
                value={formData.lat}
                onChange={(e) => updateField('lat', e.target.value)}
                required
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="73.8567"
                icon={<Map size={18} />}
                value={formData.lon}
                onChange={(e) => updateField('lon', e.target.value)}
                required
              />
              <Input
                label="Expected Capacity"
                type="number"
                min="1"
                placeholder="150"
                value={formData.capacity}
                onChange={(e) => updateField('capacity', e.target.value)}
              />
              <div className="hidden md:block" />
              <Input
                label="Organiser Name"
                placeholder="Priya Shah"
                icon={<User size={18} />}
                value={formData.organiser_name}
                onChange={(e) => updateField('organiser_name', e.target.value)}
                required
              />
              <Input
                label="Organiser Phone"
                type="tel"
                placeholder="9876543210"
                icon={<Phone size={18} />}
                value={formData.organiser_phone}
                onChange={(e) => updateField('organiser_phone', e.target.value)}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Organiser Email"
                  type="email"
                  placeholder="organiser@example.com"
                  icon={<Mail size={18} />}
                  value={formData.organiser_email}
                  onChange={(e) => updateField('organiser_email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Camp Proposal'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-on-surface">Track Your Submitted Proposals</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                View the assigned blood bank, current status, and review outcome using the organiser email used during submission.
              </p>
            </div>
            <div className="w-full lg:max-w-md flex gap-3">
              <div className="flex-1">
                <Input
                  label="Organiser Email"
                  type="email"
                  placeholder="organiser@example.com"
                  icon={<Mail size={18} />}
                  value={historyEmail}
                  onChange={(e) => setHistoryEmail(e.target.value)}
                />
              </div>
              <Button
                type="button"
                className="self-end"
                disabled={loadingHistory}
                onClick={() => {
                  setError(null);
                  loadProposalHistory(historyEmail);
                }}
              >
                {loadingHistory ? 'Loading...' : 'View Status'}
              </Button>
            </div>
          </div>

          {proposalHistory.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-4">
              {proposalHistory.map((proposal) => (
                <div key={proposal.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Proposal #{proposal.id}</p>
                      <h3 className="text-lg font-bold text-on-surface mt-1">{proposal.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{proposal.venueName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      proposal.approvalStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : proposal.approvalStatus === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {proposal.approvalStatus === 'approved'
                        ? 'accepted'
                        : proposal.approvalStatus === 'rejected'
                          ? 'denied'
                          : 'pending'}
                    </span>
                  </div>

                  <div className="text-sm text-slate-700 font-medium space-y-1">
                    <p>Date: {proposal.dateLabel}</p>
                    <p>Time: {proposal.timeLabel}</p>
                    <p>Address: {proposal.address}</p>
                    <p>Capacity: {proposal.capacity || 'Open attendance'}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Matched Blood Bank</p>
                    {proposal.assignedBloodBank ? (
                      <>
                        <p className="font-bold text-on-surface inline-flex items-center gap-2"><Building2 size={16} /> {proposal.assignedBloodBank.name}</p>
                        <p className="text-sm text-slate-600">{proposal.assignedBloodBank.address}</p>
                        {proposal.assignedBloodBank.contactPhone && (
                          <p className="text-sm text-slate-600">Phone: {proposal.assignedBloodBank.contactPhone}</p>
                        )}
                        {proposal.assignedBloodBank.email && (
                          <p className="text-sm text-slate-600 break-all">Email: {proposal.assignedBloodBank.email}</p>
                        )}
                        {proposal.distanceKm && (
                          <p className="text-sm text-slate-600">Distance: {proposal.distanceKm} km</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-600">No nearby verified blood bank has been matched yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">No proposals loaded yet.</p>
              <p className="text-sm text-slate-500 mt-2">
                Enter the organiser email used during submission to view the matched blood bank and current review status.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
