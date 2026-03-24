import React, { useState, useEffect } from 'react';
import { PlusCircle, Hospital } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { getBloodBankDashboard, updateStock } from '../services/bloodBankService';

export default function BloodBankDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getBloodBankDashboard()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load blood bank data.");
        setLoading(false);
      });
  }, []);

  const handleStockUpdate = async () => {
    setIsSubmitting(true);
    try {
      await updateStock({ action: 'add' });
      setModalOpen(false);
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
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Blood Bank Inventory</h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Manage local stock, update quantities, and track expiry dates.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusCircle size={20} />
          Update Stock
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
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
                  {data?.inventory.length > 0 ? (
                    data.inventory.map((inv) => (
                      <tr key={inv.id} className="text-sm">
                        <td className={`p-4 font-bold text-lg ${inv.critical ? 'text-primary' : 'text-on-surface'}`}>{inv.type}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
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
            {data?.nearbyBanks.length > 0 ? (
              data.nearbyBanks.map((bank, index) => (
                <div key={bank.id} className={`flex ${index !== data.nearbyBanks.length - 1 ? 'border-b border-slate-50 pb-4' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3">
                    <Hospital size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{bank.name}</p>
                    <p className="text-xs text-slate-400">{bank.distance}</p>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Stock: {bank.stock.map((s, idx) => (
                        <React.Fragment key={idx}>
                          <span className={s.critical ? 'text-primary' : ''}>{s.group} ({s.count})</span>
                          {idx < bank.stock.length - 1 && ', '}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 text-center">No nearby banks found.</div>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Update Stock">
        <div className="space-y-4">
          <Select label="Blood Group" options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Action" options={['Add Units', 'Remove Units', 'Mark Expired']} />
            <Input label="Quantity" type="number" placeholder="0" />
          </div>
          <Input label="Expiry Date (for new units)" type="date" />
          <Button className="w-full mt-4" disabled={isSubmitting} onClick={handleStockUpdate}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
