import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border rounded-[8px] border border-border bg-card overflow-hidden shadow-vercel">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
