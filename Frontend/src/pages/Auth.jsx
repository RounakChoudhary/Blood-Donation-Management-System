import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { User, Mail, Lock, KeyRound, Droplet, Phone } from 'lucide-react';
import { login, register, verifyOtp } from '../services/authService';

export default function Auth({ mode = 'login' }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await login(email, password);
      const userRole = data.user?.role;

      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'hospital') {
        navigate('/hospital', { replace: true });
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
    if (!name || !email || !password || !phone) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await register({ full_name: name, email, password, phone });
      setSuccess(data.message || 'Registration successful! Check your email for the OTP.');
      // Navigate to OTP page after short delay so user sees the success message
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') handleLogin();
    else if (mode === 'register') handleRegister();
    else if (mode === 'otp') handleVerifyOtp();
  };

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
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {mode === 'login' && 'Sign in to access your dashboard'}
            {mode === 'register' && 'Join our network to save lives'}
            {mode === 'otp' && 'Enter the 6-digit code sent to your email'}
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
          {mode === 'register' && (
            <>
              <Input
                label="Full Name"
                placeholder="John Doe"
                icon={<User size={18} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                icon={<Phone size={18} />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'otp') && (
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          {mode === 'login' && (
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {mode === 'register' && (
            <Input
              label="Create Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {mode === 'login' && (
            <div className="flex justify-end">
              <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot Password?</a>
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Please wait...' : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'otp' && 'Verify Code'}
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-sm font-medium text-slate-500 pt-2 pb-1">
          {mode === 'login' && (
            <p>Don't have an account? <Link to="/register" className="text-primary hover:underline font-bold">Sign up</Link></p>
          )}
          {mode === 'register' && (
            <p>Already have an account? <Link to="/login" className="text-primary hover:underline font-bold">Sign in</Link></p>
          )}
          {mode === 'otp' && (
            <p>Already verified? <Link to="/login" className="text-primary hover:underline font-bold">Sign in</Link></p>
          )}
        </div>
      </Card>
    </div>
  );
}
