import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';

export default function Topbar({ onMenuClick, onMobileMenuClick }) {
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/donor')) return 'Donor Interface';
    if (path.startsWith('/hospital')) return 'Hospital Dashboard';
    if (path.startsWith('/blood-bank')) return 'Blood Bank Inventory';
    if (path.startsWith('/admin')) return 'Platform Administration';
    if (path.startsWith('/profile')) return 'Profile & Settings';
    if (path === '/') return 'Dashboard';
    return '';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 h-16 w-full">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Desktop Toggle Button */}
          <button 
            onClick={onMenuClick} 
            className="hidden lg:flex items-center justify-center text-slate-500 hover:text-primary transition-all duration-200 outline-none p-2 rounded-lg hover:bg-slate-100 active:scale-95 cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu size={22} />
          </button>
          
          {/* Mobile Toggle Button */}
          <button 
            onClick={onMobileMenuClick} 
            className="lg:hidden flex items-center justify-center text-slate-500 hover:text-primary transition-all duration-200 outline-none p-2 rounded-lg hover:bg-slate-100 active:scale-95 cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            <Menu size={22} />
          </button>
          
          <h1 className="text-lg font-bold tracking-tight text-slate-800 ml-1">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative p-2 rounded-full cursor-pointer hover:bg-slate-100 hover:scale-105 transition-all duration-200 text-slate-500 hover:text-primary">
            <Bell size={20} />
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>
          </div>
          
          <Link to="/profile" className="w-[38px] h-[38px] rounded-full bg-slate-100 overflow-hidden ring-2 ring-transparent hover:ring-primary/30 hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm">
            <img alt="User profile" src="https://ui-avatars.com/api/?name=Admin+User&background=ffdad6&color=b7131a&bold=true" className="w-full h-full object-cover" />
          </Link>
        </div>
      </div>
    </header>
  );
}
