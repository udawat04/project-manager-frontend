'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-[6px] bg-muted/70 dark:bg-muted/40', className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[8px] border border-border bg-card p-5 space-y-3 shadow-vercel">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-[8px] border border-border bg-card overflow-hidden shadow-vercel">
      <div className="h-10 border-b border-border bg-muted/30 px-4 flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="divide-y divide-border/60">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="space-y-1.5 w-1/3">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-7 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
