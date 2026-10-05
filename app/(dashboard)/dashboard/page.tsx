'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { DashboardSkeleton } from '@/components/loading';
import { AdminDashboard } from '@/components/features/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/components/features/dashboard/ManagerDashboard';
import { DeveloperDashboard } from '@/components/features/dashboard/DeveloperDashboard';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.getDashboardStats();
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Determine which dashboard to render based on role
  if (user?.isMasterAdmin || user?.role === 'MASTER_ADMIN') {
    return <AdminDashboard data={data} />;
  }

  if (user?.role === 'PROJECT_MANAGER' || user?.role === 'TEAM_LEAD') {
    return <ManagerDashboard data={data} />;
  }

  // Default for DEVELOPER, TESTER, etc.
  return <DeveloperDashboard data={data} />;
}
