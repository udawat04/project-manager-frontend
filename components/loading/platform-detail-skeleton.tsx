'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function PlatformDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Skeleton className="h-4 w-28" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-[6px]" />
          <Skeleton className="h-8 w-28 rounded-[6px]" />
          <Skeleton className="h-8 w-28 rounded-[6px]" />
        </div>
      </div>

      {/* Accounts List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
        </div>

        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-5 space-y-4 border-border bg-card shadow-vercel">
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-3.5 w-48" />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24 rounded-[6px]" />
                  <Skeleton className="h-8 w-28 rounded-[6px]" />
                </div>
              </div>

              {/* Connected Projects */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-28 rounded-[6px]" />
                  <Skeleton className="h-7 w-32 rounded-[6px]" />
                </div>
              </div>

              {/* Stored Credentials */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Skeleton className="h-4 w-40" />
                <div className="p-3 rounded-[6px] border border-border bg-muted/40 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
