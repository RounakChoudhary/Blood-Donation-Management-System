import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { MapPin } from 'lucide-react';
import { getProfileSettings, updateProfile } from '../services/profileService';

export default function ProfileSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getProfileSettings()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load profile data.");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      const response = await updateProfile(data);
      setSuccess(response.message || "Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Profile & Settings</h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">Manage your personal information and preferences.</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl font-medium border border-green-200">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden mb-4 ring-4 ring-slate-50">
              <img alt="User profile" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data?.fullName || '')}&background=ffdad6&color=b7131a&size=128`} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold">{data?.fullName}</h2>
            <p className="text-sm text-slate-500 mb-4">Donor Level: {data?.donorLevel}</p>
            {data?.isEligible && (
              <Badge variant="success" className="px-6 py-2 text-xs">Eligible to Donate</Badge>
            )}
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card className="space-y-6">
            <h3 className="text-lg font-bold border-b border-slate-100 pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" value={data?.fullName} disabled className="col-span-2 bg-slate-50 text-slate-500" />
              <Input label="Blood Group" value={data?.bloodGroup} disabled className="bg-slate-50 text-slate-500" />
              <Input label="Phone Number" value={data?.phoneNumber || ''} onChange={(e) => setData({ ...data, phoneNumber: e.target.value })} />
              <div className="col-span-2">
                <Input label="Location / City" value={data?.location || ''} onChange={(e) => setData({ ...data, location: e.target.value })} icon={<MapPin size={18} />} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={isSubmitting} onClick={handleSave}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>

          <Card className="space-y-6">
            <h3 className="text-lg font-bold border-b border-slate-100 pb-2">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Emergency Alerts</p>
                  <p className="text-xs text-slate-500">Notify me immediately when there is an emergency in my radius.</p>
                </div>
                <div 
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${data?.notifications?.emergencyAlerts ? 'bg-primary' : 'bg-slate-200'}`}
                  onClick={() => setData({ ...data, notifications: { ...data.notifications, emergencyAlerts: !data.notifications.emergencyAlerts }})}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${data?.notifications?.emergencyAlerts ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Email Updates</p>
                  <p className="text-xs text-slate-500">Receive weekly donation camp schedules and system updates.</p>
                </div>
                <div 
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${data?.notifications?.emailUpdates ? 'bg-primary' : 'bg-slate-200'}`}
                  onClick={() => setData({ ...data, notifications: { ...data.notifications, emailUpdates: !data.notifications.emailUpdates }})}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${data?.notifications?.emailUpdates ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
