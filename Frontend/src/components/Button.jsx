import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyles = "px-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-primary/20 active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02]",
    secondary: "border-2 border-primary text-primary hover:bg-red-50",
    ghost: "text-primary hover:bg-primary-fixed hover:bg-opacity-30",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
