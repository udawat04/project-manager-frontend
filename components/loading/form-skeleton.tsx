import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function FormSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-full rounded-[6px]" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full rounded-[6px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full rounded-[6px]" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full rounded-[6px]" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full rounded-[6px]" />
      </div>
    </div>
  );
}
