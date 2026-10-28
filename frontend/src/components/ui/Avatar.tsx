import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className }) => {
  const [hasError, setHasError] = React.useState(false);

  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
  };

  const getInitials = (nameStr: string) => {
    return nameStr
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={cn('rounded-full object-cover ring-2 ring-white', sizes[size], className)}
      />
    );
  }

  // Generate a consistent pastel color based on name
  const colors = [
    'bg-violet-100 text-violet-700',
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700',
  ];
  const charCode = name.charCodeAt(0) || 0;
  const colorClass = colors[charCode % colors.length];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium ring-2 ring-white select-none',
        colorClass,
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
