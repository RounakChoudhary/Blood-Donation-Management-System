import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: "bg-slate-50 text-slate-600",
    critical: "bg-error-container text-on-error-container",
    pending: "bg-amber-100 text-amber-700",
    success: "bg-tertiary-fixed text-on-tertiary-fixed-variant", // Teal/Blue match as per stitch
    matched: "bg-tertiary-container text-on-tertiary-container"
  };

  return (
    <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] sm:px-4 sm:py-1.5 font-bold uppercase rounded-full tracking-widest inline-flex items-center justify-center ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
