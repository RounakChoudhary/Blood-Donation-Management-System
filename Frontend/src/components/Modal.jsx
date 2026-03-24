import React from 'react';

export default function Modal({ isOpen, onClose, title, description, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/60 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-8 pt-8 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1 block">Emergency Portal</span>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform outline-none"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
            </button>
          </div>
          {description && <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{description}</p>}
        </div>
        <div className="px-8 py-4 overflow-y-auto space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
