import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'high' | 'medium' | 'low' | 'primary' | 'success' | 'outline' | 'slate';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'primary', children, ...props }) => {
  const variants = {
    high: 'bg-rose-50 text-rose-600 border border-rose-200/60 font-semibold',
    medium: 'bg-amber-50 text-amber-600 border border-amber-200/60 font-semibold',
    low: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 font-semibold',
    primary: 'bg-violet-50 text-primary-700 border border-violet-200/60 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium',
    outline: 'border border-slate-200 text-slate-700 bg-white font-medium',
    slate: 'bg-slate-100 text-slate-700 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
