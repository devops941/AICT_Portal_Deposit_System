import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-xs font-semibold text-slate-700">{label}</label>}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">{icon}</div>}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
