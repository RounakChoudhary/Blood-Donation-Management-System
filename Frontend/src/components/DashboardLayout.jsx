import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setMobileOpen(false)} 
      />
      
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        <Topbar 
          onMenuClick={() => setSidebarOpen(!isSidebarOpen)} 
          onMobileMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
