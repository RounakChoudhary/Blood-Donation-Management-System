import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { AlertTriangle, MapPin } from 'lucide-react';
import { getHospitalDashboard, getHospitalRequestDetails, createEmergencyRequest, rematchHospitalRequest, deleteHospitalRequest } from '../services/hospitalService';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function getInitialRequestForm() {
  return {
    blood_group: 'O-',
    units_required: '1',
    lon: '',
    lat: '',
    search_radius_meters: '3000',
  };
}

export default function HospitalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [matchedDonors, setMatchedDonors] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState(null);
  const [isRematching, setIsRematching] = useState(false);
  const [rematchMessage, setRematchMessage] = useState(null);
  const [rematchError, setRematchError] = useState(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);
  const [requestForm, setRequestForm] = useState(getInitialRequestForm);
  const selectedRequest = data?.activeRequests?.find((request) => request.id === selectedRequestId) || null;
  const canRematchSelectedRequest = Boolean(
    selectedRequestId
    && selectedRequest
    && !['fulfilled', 'cancelled'].includes(String(selectedRequest.statusLabel || '').toLowerCase())
  );
  const acceptedDonors = matchedDonors.filter((donor) => donor.rawStatus === 'accepted');

  const loadDashboard = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const res = await getHospitalDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load hospital data.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const requestIds = data?.activeRequests?.map((request) => request.id) || [];

    if (requestIds.length === 0) {
      setSelectedRequestId(null);
      return;
    }

    setSelectedRequestId((previousId) => {
      if (previousId && requestIds.includes(previousId)) {
        return previousId;
      }
      return requestIds[0];
    });
  }, [data]);

  useEffect(() => {
    let isCancelled = false;

    const loadMatchedDonors = async () => {
      if (!data) return;

      if (!selectedRequestId) {
        setMatchedDonors([]);
        setMatchesError(null);
        setLoadingMatches(false);
        return;
      }

      setLoadingMatches(true);
      setMatchesError(null);

      try {
        const details = await getHospitalRequestDetails(selectedRequestId);
        if (!isCancelled) {
          setMatchedDonors(details.matchedDonors || []);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          setMatchesError(err.message || "Failed to load matched donors for the selected request.");
          setMatchedDonors([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingMatches(false);
        }
      }
    };

    loadMatchedDonors();

    return () => {
      isCancelled = true;
    };
  }, [data, selectedRequestId]);

  useEffect(() => {
    setRematchMessage(null);
    setRematchError(null);
  }, [selectedRequestId]);

  const handleRequestSubmission = async () => {
    const unitsRequired = Number(requestForm.units_required);
    const searchRadius = Number(requestForm.search_radius_meters);

    if (!Number.isInteger(unitsRequired) || unitsRequired <= 0) {
      setSubmitError("Units required must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(searchRadius) || searchRadius <= 0) {
      setSubmitError("Search radius must be greater than 0.");
      return;
    }

    const longitude = Number(requestForm.lon);
    const latitude = Number(requestForm.lat);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      setSubmitError("Please enter valid latitude and longitude values.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const response = await createEmergencyRequest(requestForm);

      setSubmitSuccess(response?.message || "Emergency request submitted successfully.");

      setModalOpen(false);
      setRequestForm(getInitialRequestForm());
      setSelectedRequestId(null);
      await loadDashboard({ showLoading: false });
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Failed to submit emergency request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRematch = async () => {
    if (!selectedRequestId || !data) {
      return;
    }

    setIsRematching(true);
    setRematchMessage(null);
    setRematchError(null);

    try {
      const selectedRequest = data.activeRequests.find((request) => request.id === selectedRequestId);
      const radiusMeters = Number(selectedRequest?.searchRadiusMeters || 5000);

      const response = await rematchHospitalRequest(selectedRequestId, {
        radius_meters: radiusMeters,
        limit: 25,
      });

      const newMatchesCount = Number(response?.new_matches_count || 0);
      setRematchMessage(
        newMatchesCount > 0
          ? `Found ${newMatchesCount} new donor match${newMatchesCount > 1 ? 'es' : ''}.`
          : "No new donors found in the current search radius."
      );

      await loadDashboard({ showLoading: false });
    } catch (err) {
      console.error(err);
      setRematchError(err.message || "Failed to find more donors.");
    } finally {
      setIsRematching(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!requestId || isDeletingRequest) {
      return;
    }

    const confirmed = window.confirm("Delete this blood request? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    setIsDeletingRequest(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setRematchMessage(null);
    setRematchError(null);

    try {
      const response = await deleteHospitalRequest(requestId);
      setSubmitSuccess(response?.message || "Blood request deleted successfully.");

      if (selectedRequestId === requestId) {
        setSelectedRequestId(null);
        setMatchedDonors([]);
      }

      await loadDashboard({ showLoading: false });
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Failed to delete request.");
    } finally {
      setIsDeletingRequest(false);
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
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Hospital Dashboard</h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Manage emergency donor matching and track donor responses in real time.</p>
        </div>
        <Button onClick={() => {
          setSubmitError(null);
          setSubmitSuccess(null);
          setRequestForm(getInitialRequestForm());
          setModalOpen(true);
        }}>
          <AlertTriangle size={20} />
          Create Request
        </Button>
      </div>
      {submitSuccess && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
          {submitSuccess}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Emergency Requests</h2>
          <div className="space-y-3">
            {data?.activeRequests.length > 0 ? (
              data.activeRequests.map((req) => (
                <Card
                  key={req.id}
                  className={`p-5 flex justify-between items-start border-l-4 cursor-pointer transition-all ${selectedRequestId === req.id ? 'ring-2 ring-primary/20' : ''} ${req.statusVariant === 'critical' ? 'border-red-600' : req.statusVariant === 'pending' ? 'border-amber-400' : 'border-blue-500'}`}
                  onClick={() => setSelectedRequestId(req.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${req.statusVariant === 'critical' ? 'bg-error-container text-on-error-container' : req.statusVariant === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {req.group}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm">{req.hosp}</h4>
                      <p className="text-xs text-slate-500 font-medium">{req.info}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Responses: {req.responseSummary?.accepted ?? 0} accepted, {req.responseSummary?.declined ?? 0} declined, {req.responseSummary?.pending ?? 0} pending
                      </p>
                      <div className="mt-2 w-full">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          <span>Fulfillment Progress</span>
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
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={req.statusVariant}>{req.statusLabel}</Badge>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteRequest(req.id);
                      }}
                      disabled={isDeletingRequest}
                    >
                      {isDeletingRequest ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm p-4 text-center">No emergency requests yet.</p>
            )}
          </div>
        </div>

        {/* Nearby Matches */}
        <div className="space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              Matched Donors (Nearby)
              {selectedRequestId ? ` - Request #${selectedRequestId}` : ''}
            </h2>
            <Button
              variant="secondary"
              className="text-xs px-3 py-2 h-auto whitespace-nowrap"
              onClick={handleRematch}
              disabled={isRematching || loadingMatches || !canRematchSelectedRequest}
            >
              {isRematching ? "Finding..." : "Find More Donors"}
            </Button>
          </div>
          {rematchMessage && (
            <p className="text-xs font-semibold text-green-700 bg-green-50 rounded-lg px-3 py-2">
              {rematchMessage}
            </p>
          )}
          {rematchError && (
            <p className="text-xs font-semibold text-on-error-container bg-error-container rounded-lg px-3 py-2">
              {rematchError}
            </p>
          )}
          {acceptedDonors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-green-700">
                  Accepted Donor Details
                </h3>
                <Badge variant="success">{acceptedDonors.length} accepted</Badge>
              </div>
              <div className="grid gap-3">
                {acceptedDonors.map((donor) => (
                  <Card key={`accepted-${donor.id}`} className="p-4 border border-green-200 bg-green-50/60">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-green-700">
                          {donor.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{donor.name}</p>
                          <p className="text-xs font-semibold text-slate-500">
                            {donor.group} donor
                            {donor.distance ? ` • ${donor.distance} km away` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-slate-700 font-medium">
                        <p>Status: Accepted</p>
                        <p>Contact: {donor.phone || 'Phone not available'}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {loadingMatches ? (
              <p className="text-slate-500 text-sm p-4 col-span-2 text-center">Loading matched donors...</p>
            ) : matchesError ? (
              <p className="text-on-error-container bg-error-container text-sm p-4 col-span-2 text-center rounded-lg">{matchesError}</p>
            ) : matchedDonors.length > 0 ? (
              matchedDonors.map((donor) => (
                <Card key={donor.id} className="p-5 flex flex-col justify-between min-h-48">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
                        {donor.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight break-words">{donor.name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{donor.distance} km away</p>
                      </div>
                    </div>
                    <Badge variant="default" className="w-fit">{donor.group} Group</Badge>
                  </div>
                    <div className="mt-3 space-y-2 shrink-0">
                      <Badge variant={donor.status} className="w-fit">{donor.rawStatus}</Badge>
                      {donor.phone && (
                        <p className="text-[11px] font-semibold text-slate-600">
                          Contact: {donor.phone}
                        </p>
                      )}
                      <div className="w-full text-xs py-2 px-3 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold text-center">
                        Status: {donor.rawStatus}
                      </div>
                    </div>
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm p-4 col-span-2 text-center">No matched donors available.</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Emergency Request"
        description="Broadcast an urgent blood requirement to eligible donors nearby."
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Blood Group Needed</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUP_OPTIONS.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setRequestForm((prev) => ({ ...prev, blood_group: type }))}
                  className={`py-3 rounded-lg text-sm font-bold transition-colors ${type === requestForm.blood_group ? 'border-2 border-primary bg-primary/5 text-primary' : 'border border-surface-container-highest hover:bg-surface-container'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Units Required"
              type="number"
              min="1"
              value={requestForm.units_required}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, units_required: e.target.value }))}
              placeholder="e.g. 2"
            />
            <Input
              label="Search Radius (m)"
              type="number"
              min="1000"
              step="1000"
              value={requestForm.search_radius_meters}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, search_radius_meters: e.target.value }))}
              placeholder="e.g. 5000"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              icon={<MapPin size={18} />}
              value={requestForm.lon}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, lon: e.target.value }))}
              placeholder="e.g. 72.8777"
            />
            <Input
              label="Latitude"
              type="number"
              step="any"
              icon={<MapPin size={18} />}
              value={requestForm.lat}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, lat: e.target.value }))}
              placeholder="e.g. 19.0760"
            />
          </div>
          {submitError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium">
              {submitError}
            </div>
          )}
          <Button className="w-full mt-4" disabled={isSubmitting} onClick={handleRequestSubmission}>
            {isSubmitting ? "Submitting..." : "Submit Emergency Request"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
