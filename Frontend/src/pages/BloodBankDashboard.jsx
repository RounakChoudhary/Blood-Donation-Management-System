import React, { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  CalendarClock,
  CheckCircle2,
  Droplets,
  Hospital,
  Mail,
  MapPin,
  PlusCircle,
  Phone,
  User,
  XCircle,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { getBloodBankDashboard, reviewCampProposal, updateStock } from '../services/bloodBankService';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const STOCK_ACTION_OPTIONS = [
  { value: 'add', label: 'Add Units' },
  { value: 'remove', label: 'Remove Units' },
  { value: 'expire', label: 'Mark Expired' },
];

function getDefaultExpiryDate() {
  const inThirtyDays = new Date();
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  return inThirtyDays.toISOString().slice(0, 10);
}

function getInitialStockForm() {
  return {
    blood_group: 'O+',
    action: 'add',
    quantity: '1',
    expiry_date: getDefaultExpiryDate(),
  };
}

function getCampStatusVariant(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'success';
  if (normalized === 'rejected') return 'critical';
  return 'pending';
}

function getCampStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'accepted';
  if (normalized === 'rejected') return 'denied';
  return 'pending';
}

export default function BloodBankDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [stockForm, setStockForm] = useState(getInitialStockForm);
  const [reviewingCampId, setReviewingCampId] = useState(null);

  const loadDashboard = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await getBloodBankDashboard();
      setData(response);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load blood bank data.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summaryCards = useMemo(() => {
    const summary = data?.summary || {};

    return [
      {
        label: 'Total Units',
        value: summary.total_units ?? 0,
        helper: 'Available across all blood groups',
        icon: <Droplets size={20} />,
      },
      {
        label: 'Low Stock Groups',
        value: summary.low_stock_groups ?? 0,
        helper: 'Groups below the attention threshold',
        icon: <Boxes size={20} />,
      },
      {
        label: 'Nearby Banks',
        value: summary.nearby_banks ?? 0,
        helper: 'Verified blood banks near your location',
        icon: <CalendarClock size={20} />,
      },
      {
        label: 'Camp Proposals',
        value: summary.pending_camp_proposals ?? 0,
        helper: 'Pending camp proposals assigned to you',
        icon: <Hospital size={20} />,
      },
    ];
  }, [data]);

  const handleCampReview = async (campId, status) => {
    setReviewingCampId(campId);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await reviewCampProposal(campId, status);
      setSubmitSuccess(response.message || 'Camp proposal reviewed successfully.');
      await loadDashboard({ showLoading: false });
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Failed to review camp proposal.');
    } finally {
      setReviewingCampId(null);
    }
  };

  const handleStockUpdate = async () => {
    const quantity = Number(stockForm.quantity);

    if (!stockForm.blood_group) {
      setSubmitError('Please choose a blood group.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setSubmitError('Quantity must be a positive whole number.');
      return;
    }

    if (stockForm.action === 'add' && !stockForm.expiry_date) {
      setSubmitError('Please provide an expiry date when adding stock.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await updateStock(stockForm);
      setSubmitSuccess(response.message || 'Inventory updated successfully.');
      setModalOpen(false);
      setStockForm(getInitialStockForm());
      await loadDashboard({ showLoading: false });
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Failed to update stock.');
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
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Blood Bank Dashboard</h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Track live inventory, review hospital demand, and compare nearby blood bank availability.
          </p>
          {data?.bloodBank?.name && (
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-3">
              {data.bloodBank.name}
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setSubmitError(null);
            setSubmitSuccess(null);
            setStockForm(getInitialStockForm());
            setModalOpen(true);
          }}
        >
          <PlusCircle size={20} />
          Update Stock
        </Button>
      </div>

      {submitSuccess && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
          {submitSuccess}
        </div>
      )}

      {submitError && !isModalOpen && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium">
          {submitError}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="text-3xl font-black tracking-tight text-on-surface mt-3">{item.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-2">{item.helper}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-primary flex items-center justify-center">
                {item.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Current Inventory</h2>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-surface-container-highest text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4 rounded-tl-xl">Blood Group</th>
                    <th className="p-4">Units Available</th>
                    <th className="p-4 rounded-tr-xl">Nearest Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.inventory?.length > 0 ? (
                    data.inventory.map((inv) => (
                      <tr key={inv.id} className="text-sm">
                        <td className={`p-4 font-bold text-lg ${inv.critical ? 'text-primary' : 'text-on-surface'}`}>
                          {inv.type}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold">{inv.count} Units</span>
                            {inv.critical && <Badge variant="critical">Low Stock</Badge>}
                          </div>
                        </td>
                        <td className="p-4 text-slate-500">{inv.nearestExpiry}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-slate-500 text-sm">No inventory recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Nearby Blood Banks</h2>
          <Card className="p-5 flex flex-col gap-4">
            {data?.nearbyBanks?.length > 0 ? (
              data.nearbyBanks.map((bank, index) => (
                <div key={bank.id} className={`flex ${index !== data.nearbyBanks.length - 1 ? 'border-b border-slate-50 pb-4' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3">
                    <Hospital size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{bank.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{bank.distance}</p>
                      </div>
                      {bank.contactPhone && (
                        <span className="text-[11px] font-semibold text-slate-500">{bank.contactPhone}</span>
                      )}
                    </div>
                    <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {bank.stock.length > 0 ? (
                        <>
                          Stock:{' '}
                          {bank.stock.map((stockItem, stockIndex) => (
                            <React.Fragment key={`${bank.id}-${stockItem.group}`}>
                              <span className={stockItem.critical ? 'text-primary' : ''}>
                                {stockItem.group} ({stockItem.count})
                              </span>
                              {stockIndex < bank.stock.length - 1 && ', '}
                            </React.Fragment>
                          ))}
                        </>
                      ) : (
                        'No shared stock yet'
                      )}
                    </div>
                    {bank.address && (
                      <p className="text-xs text-slate-500 mt-2">{bank.address}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 text-center">No nearby verified blood banks found.</div>
            )}
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight">Assigned Camp Proposals</h2>
          <Badge variant="default">{data?.campProposals?.length || 0} total</Badge>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {data?.campProposals?.length > 0 ? (
            data.campProposals.map((camp) => {
              const isPending = camp.status === 'pending';
              return (
                <Card key={camp.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Camp Proposal #{camp.id}</p>
                      <h3 className="text-lg font-bold text-on-surface mt-1">{camp.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{camp.venueName}</p>
                    </div>
                    <Badge variant={getCampStatusVariant(camp.status)}>
                      {getCampStatusLabel(camp.status)}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700 font-medium">
                    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
                      <p><span className="font-bold">Date:</span> {camp.date}</p>
                      <p><span className="font-bold">Time:</span> {camp.time}</p>
                      <p><span className="font-bold">Capacity:</span> {camp.capacity || 'Open attendance'}</p>
                      <p><span className="font-bold">Distance:</span> {camp.distance}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
                      <p className="flex items-start gap-2"><User size={14} className="mt-0.5" /> {camp.organiserName}</p>
                      <p className="flex items-start gap-2"><Phone size={14} className="mt-0.5" /> {camp.organiserPhone || 'Phone unavailable'}</p>
                      <p className="flex items-start gap-2 break-all"><Mail size={14} className="mt-0.5" /> {camp.organiserEmail || 'Email unavailable'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 space-y-2">
                    <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5" /> {camp.address}</p>
                    {(camp.latitude !== null && camp.longitude !== null) && (
                      <p className="text-xs text-slate-500 font-semibold">
                        Coordinates: {camp.latitude}, {camp.longitude}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                    <span>Assigned {camp.assignedAt}</span>
                    <span>{camp.status === 'pending' ? `Submitted ${camp.createdAt}` : `Reviewed ${camp.reviewedAt}`}</span>
                  </div>

                  {isPending ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleCampReview(camp.id, 'approved')}
                        disabled={reviewingCampId === camp.id}
                        className="justify-center"
                      >
                        <CheckCircle2 size={18} />
                        {reviewingCampId === camp.id ? 'Saving...' : 'Accept'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleCampReview(camp.id, 'rejected')}
                        disabled={reviewingCampId === camp.id}
                        className="justify-center"
                      >
                        <XCircle size={18} />
                        {reviewingCampId === camp.id ? 'Saving...' : 'Deny'}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                      This proposal has already been {getCampStatusLabel(camp.status)}.
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <Card className="p-8 lg:col-span-2 text-center">
              <p className="text-sm font-semibold text-slate-700">No camp proposals assigned yet.</p>
              <p className="text-sm text-slate-500 mt-2">
                New nearby camp proposals will appear here with full organiser details and review actions.
              </p>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Update Stock">
        <div className="space-y-4">
          <Select
            label="Blood Group"
            options={BLOOD_GROUP_OPTIONS}
            value={stockForm.blood_group}
            onChange={(e) => setStockForm((prev) => ({ ...prev, blood_group: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Action"
              options={STOCK_ACTION_OPTIONS}
              value={stockForm.action}
              onChange={(e) => setStockForm((prev) => ({ ...prev, action: e.target.value }))}
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={stockForm.quantity}
              onChange={(e) => setStockForm((prev) => ({ ...prev, quantity: e.target.value }))}
              placeholder="0"
            />
          </div>
          {stockForm.action === 'add' && (
            <Input
              label="Expiry Date"
              type="date"
              value={stockForm.expiry_date}
              onChange={(e) => setStockForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
            />
          )}
          {submitError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium">
              {submitError}
            </div>
          )}
          <Button className="w-full mt-4" disabled={isSubmitting} onClick={handleStockUpdate}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
