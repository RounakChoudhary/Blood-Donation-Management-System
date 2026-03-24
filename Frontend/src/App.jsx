import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Auth from './pages/Auth';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import AdminPanel from './pages/AdminPanel';
import ProfileSettings from './pages/ProfileSettings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/verify-otp" element={<Auth mode="otp" />} />

        {/* Dashboard Routes with Layout */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/donor" replace />} />
          <Route path="donor/*" element={<DonorDashboard />} />
          <Route path="hospital/*" element={<HospitalDashboard />} />
          <Route path="blood-bank/*" element={<BloodBankDashboard />} />
          <Route path="admin/*" element={<AdminPanel />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
