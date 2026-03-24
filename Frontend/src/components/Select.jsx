import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({ label, options, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">{label}</label>}
      <div className="relative">
        <select 
          className={`w-full px-4 py-4 bg-surface-container-low border-none rounded-xl text-sm appearance-none focus:ring-2 focus:ring-primary/20 transition-all outline-none ${className}`} 
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-on-surface-variant">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
