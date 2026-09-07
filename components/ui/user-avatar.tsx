'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
  dotColorClass?: string;
}

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base font-bold',
  xl: 'h-24 w-24 text-2xl font-bold',
};

export function UserAvatar({
  name = 'User',
  avatarUrl,
  size = 'md',
  className,
  fallbackClassName,
  dotColorClass,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error when avatarUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initial = (name || 'U').charAt(0).toUpperCase();

  const hasValidImage = Boolean(avatarUrl && !imageError);

  return (
    <div className={cn('relative inline-block shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-mono font-bold select-none border border-border/80 transition-all',
          sizeClass,
          !hasValidImage && (fallbackClassName || 'bg-muted text-foreground')
        )}
      >
        {hasValidImage ? (
          <img
            src={avatarUrl!}
            alt={name || 'Avatar'}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {dotColorClass && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
            size === 'xs' ? 'h-2 w-2' : size === 'xl' ? 'h-5 w-5' : 'h-3.5 w-3.5',
            dotColorClass
          )}
        />
      )}
    </div>
  );
}
