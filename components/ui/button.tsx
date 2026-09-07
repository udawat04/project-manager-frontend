'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[6px] text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.99] font-semibold border border-transparent',
        secondary:
          'bg-card text-foreground border border-border hover:bg-muted hover:border-border-hover active:bg-accent active:scale-[0.99]',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground active:scale-[0.99]',
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.99] font-semibold border border-red-600',
        destructiveOutline:
          'border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-[0.99] font-medium',
        blue:
          'bg-[#0070f3] text-white shadow-sm hover:bg-[#0060df] active:scale-[0.99] font-semibold border border-[#0070f3]',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.99]',
        link:
          'text-link underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-3.5 py-1.5',
        sm: 'h-8 px-2.5 py-1 text-xs',
        lg: 'h-10 px-5 text-sm',
        pill: 'h-8 px-4 rounded-full text-xs',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
