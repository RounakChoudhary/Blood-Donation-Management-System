import React from 'react';

export default function Input({ icon, label, className = '', ...props }) {
  return (
    <div className="relative space-y-1">
      {label && <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1 block">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
            {icon}
          </div>
        )}
        <input 
          className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-4 py-4 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50 outline-none ${className}`} 
          {...props} 
        />
      </div>
    </div>
  );
}
