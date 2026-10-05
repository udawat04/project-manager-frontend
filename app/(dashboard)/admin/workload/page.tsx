'use client';

import * as React from 'react';
import { useAuth } from '@/providers/auth-provider';
import { AdminTeamWorkloadView } from '@/components/features/admin/AdminTeamWorkloadView';
import { ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

export default function AdminWorkloadPage() {
  const { user } = useAuth();

  if (user && user.role !== 'MASTER_ADMIN' && !user.isMasterAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Master Admin — Team Workload & Task Analysis
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Comprehensive assignment tracking, capacity analysis, subtasks management, and bulk import/export.
        </p>
      </div>

      <AdminTeamWorkloadView />
    </div>
  );
}
