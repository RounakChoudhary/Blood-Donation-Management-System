import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { User, Mail, Lock, KeyRound, Droplet } from 'lucide-react';

export default function Auth({ mode = 'login' }) {
  const [role, setRole] = useState('donor');

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

        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          {mode === 'register' && (
            <>
              <Input label="Full Name" placeholder="John Doe" icon={<User size={18} />} />
              <Select 
                label="I am signing up as a..." 
                options={[
                  { label: 'Donor', value: 'donor' },
                  { label: 'Hospital', value: 'hospital' },
                  { label: 'Blood Bank', value: 'bank' }
                ]}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </>
          )}

          {mode !== 'otp' && (
            <Input label="Email Address" type="email" placeholder="you@example.com" icon={<Mail size={18} />} />
          )}

          {mode === 'login' && (
            <Input label="Password" type="password" placeholder="••••••••" icon={<Lock size={18} />} />
          )}

          {mode === 'register' && (
            <Input label="Create Password" type="password" placeholder="••••••••" icon={<Lock size={18} />} />
          )}

          {mode === 'otp' && (
            <Input label="One-Time Password" type="text" placeholder="000000" icon={<KeyRound size={18} />} className="text-center tracking-[1em] font-bold text-lg" />
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot Password?</a>
            </div>
          )}

          <Button type="button" className="w-full mt-2">
            {mode === 'login' && 'Sign In'}
            {mode === 'register' && 'Create Account'}
            {mode === 'otp' && 'Verify Code'}
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
            <p>Didn't receive code? <button className="text-primary hover:underline font-bold">Resend</button></p>
          )}
        </div>
      </Card>
    </div>
  );
}
