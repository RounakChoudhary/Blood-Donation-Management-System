import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Hospital, Activity, ShieldCheck, Droplet } from 'lucide-react';

export default function Sidebar({ isOpen, isMobileOpen, onMobileClose }) {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Donors', path: '/donor', icon: <Users size={20} /> },
    { name: 'Hospitals', path: '/hospital', icon: <Hospital size={20} /> },
    { name: 'Blood Bank', path: '/blood-bank', icon: <Activity size={20} /> },
    { name: 'Admin', path: '/admin', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-all duration-300" onClick={onMobileClose}></div>
      )}
      
      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-sm
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'} 
        lg:translate-x-0 ${isOpen ? 'lg:w-64' : 'lg:w-20'}`}>
        
        {/* Logo Section */}
        <div className={`flex items-center h-16 border-b border-slate-200 transition-all duration-300 overflow-hidden ${isOpen || isMobileOpen ? 'px-6 justify-start' : 'px-0 justify-center'}`}>
          <Droplet size={28} className="text-primary fill-primary flex-shrink-0" />
          <span className={`font-bold tracking-tight text-red-800 whitespace-nowrap transition-all duration-300 ${isOpen || isMobileOpen ? 'opacity-100 max-w-[200px] ml-2 text-xl' : 'opacity-0 max-w-0 ml-0 text-[0px]'}`}>
            BloodConnect
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => 
                `flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'}
                `
              }
              onClick={() => onMobileClose && onMobileClose()}
              title={(!isOpen && !isMobileOpen) ? item.name : undefined}
            >
              <div className={`flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${!isOpen && !isMobileOpen ? 'mx-auto' : ''}`}>
                {item.icon}
              </div>
              <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden text-sm ${isOpen || isMobileOpen ? 'opacity-100 max-w-[150px] ml-3' : 'opacity-0 max-w-0 ml-0'}`}>
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
