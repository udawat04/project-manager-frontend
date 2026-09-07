'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mono, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-[6px] border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-border/80 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          mono && 'font-mono text-xs tracking-tight',
          className
        )}
        style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', ...style }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
