import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Auth from './pages/Auth';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import CampOrganizer from './pages/CampOrganizer';
import DonorResponseAction from './pages/DonorResponseAction';
import AdminLayout from './pages/AdminLayout';
import AdminOverview from './pages/AdminOverview';
import AdminUsers from './pages/AdminUsers';
import AdminHospitals from './pages/AdminHospitals';
import AdminBloodBanks from './pages/AdminBloodBanks';
import AdminBloodRequests from './pages/AdminBloodRequests';
import ProfileSettings from './pages/ProfileSettings';
import { isLoggedIn, getAuthUser } from './services/authService';

// Redirects to /login if user is not authenticated
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Redirects to the correct dashboard based on user role
function RoleRedirect() {
  const user = getAuthUser();
  const role = user?.role;

  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'hospital') return <Navigate to="/hospital" replace />;
  if (role === 'bloodbank') return <Navigate to="/blood-bank" replace />;
  return <Navigate to="/donor" replace />;
}

// Redirects away from login if already logged in
function GuestRoute({ children }) {
  if (isLoggedIn()) {
    return <RoleRedirect />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes — only accessible when NOT logged in */}
        <Route path="/login" element={<GuestRoute><Auth mode="login" /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Auth mode="register" /></GuestRoute>} />
        <Route path="/verify-otp" element={<Auth mode="otp" />} />
        <Route path="/forgot-password" element={<GuestRoute><Auth mode="forgot-password" /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><Auth mode="reset-password" /></GuestRoute>} />
        <Route path="/organize-camp" element={<CampOrganizer />} />
        <Route path="/donor-requests/respond/accept" element={<DonorResponseAction action="accept" />} />
        <Route path="/donor-requests/respond/decline" element={<DonorResponseAction action="decline" />} />

        {/* Dashboard Routes — only accessible when logged in */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<RoleRedirect />} />
          <Route path="donor/*" element={<DonorDashboard />} />
          <Route path="hospital/*" element={<HospitalDashboard />} />
          <Route path="blood-bank/*" element={<BloodBankDashboard />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="hospitals" element={<AdminHospitals />} />
            <Route path="blood-banks" element={<AdminBloodBanks />} />
            <Route path="requests" element={<AdminBloodRequests />} />
          </Route>
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
