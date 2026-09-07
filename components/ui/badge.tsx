'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors focus:outline-none select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground font-semibold',
        secondary: 'border-border bg-muted/80 text-muted-foreground',
        outline: 'border-border bg-transparent text-foreground',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold',
        production: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold',
        development: 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold',
        staging: 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold',
        archived: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 font-semibold',
        destructive: 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400 font-semibold',
        error: 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400 font-semibold',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400',
        blue: 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400',
        cyan: 'border-teal-500/30 bg-teal-500/15 text-teal-600 dark:text-teal-400',
        violet: 'border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-400',
        pink: 'border-pink-500/30 bg-pink-500/15 text-pink-600 dark:text-pink-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
