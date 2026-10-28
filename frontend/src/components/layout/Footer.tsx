import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 px-6 py-3 mt-auto select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-600">
          © 2026 AICTE Central Financial & Instrument Portal • Security Deposit & FDR Lifecycle System
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          AICTE Escrow Engine v2.4
        </span>
      </div>
    </footer>
  );
};

