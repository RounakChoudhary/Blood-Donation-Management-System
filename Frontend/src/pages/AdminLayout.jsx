import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Hospital, Activity, Droplet } from 'lucide-react';

export default function AdminLayout() {
  const tabs = [
    { name: 'Overview', path: '.', icon: <LayoutDashboard size={18} />, end: true },
    { name: 'Users', path: 'users', icon: <Users size={18} />, end: false },
    { name: 'Hospitals', path: 'hospitals', icon: <Hospital size={18} />, end: false },
    { name: 'Blood Banks', path: 'blood-banks', icon: <Activity size={18} />, end: false },
    { name: 'Requests', path: 'requests', icon: <Droplet size={18} />, end: false },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
               ${isActive 
                 ? 'bg-primary/10 text-primary border-b-2 border-primary -mb-[9px]' 
                 : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-b-2 border-transparent'
               }`
            }
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </NavLink>
        ))}
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
