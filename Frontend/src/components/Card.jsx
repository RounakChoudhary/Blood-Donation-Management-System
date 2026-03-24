import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-slate-50 ${className}`} {...props}>
      {children}
    </div>
  );
}
