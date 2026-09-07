import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ProjectSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-[6px]" />
            <Skeleton className="h-8 w-28 rounded-[6px]" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-md bg-muted/40 border border-border w-fit">
        <Skeleton className="h-7 w-20 rounded" />
        <Skeleton className="h-7 w-28 rounded" />
        <Skeleton className="h-7 w-24 rounded" />
        <Skeleton className="h-7 w-24 rounded" />
        <Skeleton className="h-7 w-20 rounded" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 space-y-2 border-border bg-card shadow-vercel">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>

      {/* Main card */}
      <Card className="p-6 space-y-4 border-border bg-card shadow-vercel">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-[6px]" />
          <Skeleton className="h-20 rounded-[6px]" />
        </div>
      </Card>
    </div>
  );
}
