import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#f1f3f7] text-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8 antialiased selection:bg-[#6d3bee] selection:text-white">
      <Outlet />
    </div>
  );
};

