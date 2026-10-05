'use client';

import * as React from 'react';
import { ShieldAlert, Check, X, Clock, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AccessRequestList } from '@/components/features/access/AccessRequestList';

export default function AccessRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getAccessRequests();
      setRequests(res.requests);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch access requests');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.role === 'MASTER_ADMIN') {
      fetchRequests();
    }
  }, [user]);

  const handleApprove = async (id: string) => {
    setResolvingId(id);
    try {
      await api.approveAccessRequest(id, { level: 'readonly' });
      toast.success('Request approved successfully');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setResolvingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setResolvingId(id);
    try {
      await api.rejectAccessRequest(id);
      toast.success('Request rejected');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setResolvingId(null);
    }
  };

  if (user?.role !== 'MASTER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-destructive mb-4 opacity-80" />
        <h2 className="text-xl font-bold text-ink">Access Denied</h2>
        <p className="text-body text-sm mt-2 max-w-md">
          You must be a Master Admin to manage access requests.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Access Requests</h1>
          <p className="text-sm text-body mt-1">Review and manage pending environment access requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <AccessRequestList
          requests={requests}
          loading={loading}
          resolvingId={resolvingId}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </div>
  );
}
