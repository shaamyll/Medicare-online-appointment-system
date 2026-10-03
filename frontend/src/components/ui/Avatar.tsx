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
  version?: string | number | null;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const COLOR_GRADIENTS = [
  'from-teal-600 to-emerald-500',
  'from-blue-600 to-indigo-500',
  'from-violet-600 to-purple-500',
  'from-sky-600 to-cyan-500',
  'from-amber-600 to-orange-500',
  'from-rose-600 to-pink-500',
  'from-emerald-600 to-teal-500',
  'from-indigo-600 to-violet-500',
];

const getDeterministicGradient = (str: string): string => {
  if (!str) return COLOR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_GRADIENTS.length;
  return COLOR_GRADIENTS[index];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name = '',
  initials,
  size = 'md',
  shape = 'circle',
  className,
  onClick,
  version,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  React.useEffect(() => {
    setHasError(false);
  }, [src, version]);

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

  const resolvedUrl = src ? getImageUrl(src, version) : '';
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const gradientClass = getDeterministicGradient(name || alt || 'user');

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
        'flex items-center justify-center font-bold shrink-0 bg-gradient-to-tr text-white shadow-xs select-none',
        gradientClass,
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
