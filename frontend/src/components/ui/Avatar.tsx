import React, { useState } from 'react';
import { cn, getImageUrl } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name = '',
  initials,
  size = 'md',
  shape = 'rounded',
  className,
  onClick,
}) => {
  const [hasError, setHasError] = useState(false);

  // Compute initials if not explicitly provided
  const computedInitials =
    initials ||
    (name
      ? name
          .replace(/^Dr\.\s*/i, '')
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '');

  const resolvedUrl = src ? getImageUrl(src) : '';
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  if (resolvedUrl && !hasError) {
    return (
      <img
        src={resolvedUrl}
        alt={alt}
        onError={() => setHasError(true)}
        onClick={onClick}
        className={cn(
          'object-cover border border-slate-200/80 shadow-sm shrink-0',
          sizeClasses[size],
          roundedClass,
          className
        )}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-center font-bold shrink-0 bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-sm select-none',
        sizeClasses[size],
        roundedClass,
        className
      )}
      title={name || alt}
    >
      {computedInitials || <UserIcon className="w-1/2 h-1/2" />}
    </div>
  );
};
