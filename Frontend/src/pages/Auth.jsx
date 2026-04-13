import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { User, Mail, Lock, KeyRound, Droplet, Phone, MapPin, Map } from 'lucide-react';
import {
  login,
  register,
  verifyOtp,
  registerHospital,
  loginHospital,
  registerBloodBank,
  loginBloodBank,
  forgotPassword,
  resetPassword,
} from '../services/authService';

export default function Auth({ mode = 'login' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') || '';

  const [role, setRole] = useState('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [hospitalLicenseNumber, setHospitalLicenseNumber] = useState('');
  const [hospitalEmergencyContactPhone, setHospitalEmergencyContactPhone] = useState('');
  const [hospitalType, setHospitalType] = useState('Government');

  const [licenseNumber, setLicenseNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const donorBloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const hospitalTypeOptions = [
    { label: 'Government', value: 'Government' },
    { label: 'Private', value: 'Private' },
    { label: 'Trust', value: 'Trust' },
  ];

  const roleOptions = mode === 'register'
    ? [
        { label: 'Donor / User', value: 'donor' },
        { label: 'Hospital', value: 'hospital' },
        { label: 'Blood Bank', value: 'bloodbank' },
      ]
    : [
        { label: 'Donor / Admin', value: 'donor' },
        { label: 'Hospital', value: 'hospital' },
        { label: 'Blood Bank', value: 'bloodbank' },
      ];

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let userRole;
      if (role === 'hospital') {
        await loginHospital(email, password);
        userRole = 'hospital';
      } else if (role === 'bloodbank') {
        await loginBloodBank(email, password);
        userRole = 'bloodbank';
      } else {
        const data = await login(email, password);
        userRole = data.user?.role;
      }

      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'hospital') {
        navigate('/hospital', { replace: true });
      } else if (userRole === 'bloodbank') {
        navigate('/blood-bank', { replace: true });
      } else {
        navigate('/donor', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (role === 'bloodbank') {
      if (!name || !licenseNumber || !contactPerson || !phone || !address || !lat || !lon) {
        setError('Please fill in all blood bank fields.');
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const data = await registerBloodBank({
          name,
          license_number: licenseNumber,
          contact_person: contactPerson,
          contact_phone: phone,
          email,
          address,
          lon,
          lat,
        });
        setSuccess(data.message || 'Blood Bank registered successfully! Please wait for Admin approval.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2500);
      } catch (err) {
        setError(err.message || 'Blood Bank registration failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === 'hospital') {
      if (
        !name ||
        !phone ||
        !email ||
        !address ||
        !hospitalLicenseNumber ||
        !hospitalEmergencyContactPhone ||
        !hospitalType ||
        !lat ||
        !lon
      ) {
        setError('Please fill in all hospital fields.');
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const data = await registerHospital({
          name,
          phone,
          email,
          address,
          license_number: hospitalLicenseNumber,
          emergency_contact_phone: hospitalEmergencyContactPhone,
          hospital_type: hospitalType,
          lon,
          lat,
        });
        setSuccess(data.message || 'Hospital registered successfully! Please wait for Admin approval.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2500);
      } catch (err) {
        setError(err.message || 'Hospital registration failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !dateOfBirth ||
      !bloodGroup ||
      !address ||
      !emergencyContactName ||
      !emergencyContactPhone ||
      !lat ||
      !lon
    ) {
      setError('Please fill in all donor registration fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await register({
        full_name: name,
        email,
        password,
        phone,
        lon,
        lat,
        date_of_birth: dateOfBirth,
        blood_group: bloodGroup,
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      });
      setSuccess(data.message || 'Registration successful! Check your email for the OTP.');
      setTimeout(() => {
        navigate('/verify-otp', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      setError('Please enter your email and the OTP code.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await verifyOtp(email, otp);
      setSuccess(data.message || 'Account verified! You can now log in.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (role !== 'donor') {
      setError('Password reset is currently available only for donor and admin accounts.');
      return;
    }

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await forgotPassword(email);
      setSuccess(data.message || 'If the account exists, a password reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetToken) {
      setError('Reset token is missing. Please use the password reset link from your email.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await resetPassword({
        token: resetToken,
        new_password: password,
      });
      setSuccess(data.message || 'Password updated successfully.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') handleLogin();
    else if (mode === 'register') handleRegister();
    else if (mode === 'otp') handleVerifyOtp();
    else if (mode === 'forgot-password') handleForgotPassword();
    else if (mode === 'reset-password') handlePasswordReset();
  };

  const showAccountType = mode === 'login' || mode === 'register' || mode === 'forgot-password';
  const showEmailField =
    mode === 'login' ||
    mode === 'otp' ||
    mode === 'forgot-password' ||
    (mode === 'register' && (role === 'donor' || role === 'hospital' || role === 'bloodbank'));

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-red-800 flex items-center justify-center gap-2">
          <Droplet size={36} className="text-primary fill-primary" />
          BloodConnect
        </h1>
        <p className="text-slate-500 mt-2">The Vital Pulse</p>
      </div>

      <Card className="w-full max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            {mode === 'login' && 'Welcome back'}
            {mode === 'register' && 'Create your account'}
            {mode === 'otp' && 'Verify your identity'}
            {mode === 'forgot-password' && 'Reset your password'}
            {mode === 'reset-password' && 'Choose a new password'}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {mode === 'login' && 'Sign in to access your dashboard'}
            {mode === 'register' && 'Join our network to save lives'}
            {mode === 'otp' && 'Enter the 6-digit code sent to your email'}
            {mode === 'forgot-password' && 'Enter your donor or admin email to receive a reset link'}
            {mode === 'reset-password' && 'Set a new password for your donor or admin account'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm font-semibold">
            {success}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {showAccountType && (
            <Select
              label="Account Type"
              options={roleOptions}
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError(null);
              }}
            />
          )}

          {mode === 'register' && (
            <>
              {role === 'donor' && (
                <>
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    icon={<User size={18} />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Select
                    label="Blood Group"
                    options={donorBloodGroupOptions}
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </>
              )}

              {(role === 'hospital' || role === 'bloodbank') && (
                <Input
                  label={role === 'hospital' ? 'Hospital Name' : 'Blood Bank Name'}
                  placeholder={role === 'hospital' ? 'City General Hospital' : 'LifeFlow Blood Bank'}
                  icon={<User size={18} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              {role === 'hospital' && (
                <>
                  <Input
                    label="License Number"
                    placeholder="HSP-2026-001"
                    icon={<KeyRound size={18} />}
                    value={hospitalLicenseNumber}
                    onChange={(e) => setHospitalLicenseNumber(e.target.value)}
                  />
                  <Select
                    label="Hospital Type"
                    options={hospitalTypeOptions}
                    value={hospitalType}
                    onChange={(e) => setHospitalType(e.target.value)}
                  />
                </>
              )}

              {role === 'bloodbank' && (
                <>
                  <Input
                    label="License Number"
                    placeholder="BLD-2023-XYZ"
                    icon={<KeyRound size={18} />}
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                  <Input
                    label="Contact Person"
                    placeholder="Dr. Sarah Smith"
                    icon={<User size={18} />}
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </>
              )}

              {(role === 'donor' || role === 'hospital' || role === 'bloodbank') && (
                <Input
                  label="Contact Phone"
                  type="tel"
                  placeholder="9876543210"
                  icon={<Phone size={18} />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}

              {(role === 'donor' || role === 'hospital' || role === 'bloodbank') && (
                <Input
                  label="Full Address"
                  placeholder="123 Care Street, Medical District"
                  icon={<MapPin size={18} />}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              )}

              {role === 'donor' && (
                <>
                  <Input
                    label="Emergency Contact Name"
                    placeholder="Jane Doe"
                    icon={<User size={18} />}
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                  />
                  <Input
                    label="Emergency Contact Phone"
                    type="tel"
                    placeholder="9876543211"
                    icon={<Phone size={18} />}
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  />
                </>
              )}

              {role === 'hospital' && (
                <Input
                  label="Emergency Contact Phone"
                  type="tel"
                  placeholder="9876543211"
                  icon={<Phone size={18} />}
                  value={hospitalEmergencyContactPhone}
                  onChange={(e) => setHospitalEmergencyContactPhone(e.target.value)}
                />
              )}

              {(role === 'donor' || role === 'hospital' || role === 'bloodbank') && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Location Coordinates
                  </p>
                  <div className="flex gap-4">
                    <Input
                      label="Latitude"
                      placeholder="e.g. 19.0760"
                      icon={<Map size={18} />}
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                    <Input
                      label="Longitude"
                      placeholder="e.g. 72.8777"
                      icon={<Map size={18} />}
                      value={lon}
                      onChange={(e) => setLon(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {showEmailField && (
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          {(mode === 'login' || mode === 'reset-password') && (
            <Input
              label={mode === 'login' ? 'Password' : 'New Password'}
              type="password"
              placeholder="********"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {mode === 'register' && role === 'donor' && (
            <Input
              label="Create Password"
              type="password"
              placeholder="********"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {mode === 'reset-password' && (
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="********"
              icon={<Lock size={18} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          {mode === 'otp' && (
            <Input
              label="One-Time Password"
              type="text"
              placeholder="000000"
              icon={<KeyRound size={18} />}
              className="text-center tracking-[1em] font-bold text-lg"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          )}

          {mode === 'forgot-password' && role !== 'donor' && (
            <p className="text-xs font-medium text-on-surface-variant">
              Password reset is currently available only for donor and admin accounts.
            </p>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              {role === 'donor' ? (
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                  Forgot Password?
                </Link>
              ) : (
                <span className="text-xs font-medium text-on-surface-variant">
                  Password reset is available for donor/admin accounts.
                </span>
              )}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Please wait...' : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Register'}
                {mode === 'otp' && 'Verify Code'}
                {mode === 'forgot-password' && 'Send Reset Link'}
                {mode === 'reset-password' && 'Update Password'}
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-sm font-medium text-slate-500 pt-2 pb-1">
          {mode === 'login' && (
            <p>Don&apos;t have an account? <Link to="/register" className="text-primary hover:underline font-bold">Sign up</Link></p>
          )}
          {mode === 'register' && (
            <p>Already have an account? <Link to="/login" className="text-primary hover:underline font-bold">Sign in</Link></p>
          )}
          {mode === 'otp' && (
            <p>Already verified? <Link to="/login" className="text-primary hover:underline font-bold">Sign in</Link></p>
          )}
          {mode === 'forgot-password' && (
            <p>Remembered it? <Link to="/login" className="text-primary hover:underline font-bold">Sign in</Link></p>
          )}
          {mode === 'reset-password' && (
            <p>Back to login? <Link to="/login" className="text-primary hover:underline font-bold">Sign in</Link></p>
          )}
        </div>
      </Card>
    </div>
  );
}
