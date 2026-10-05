import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface RequestAccessButtonProps {
  resourceId: string;
  resourceType: 'environment' | 'project';
}

export function RequestAccessButton({ resourceId, resourceType }: RequestAccessButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await api.createAccessRequest({
        resourceId,
        resourceType,
        reason: 'Need access for current sprint tasks',
      });
      toast.success('Access request submitted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRequest} disabled={loading} className="gap-2">
      <ShieldAlert className="w-4 h-4" />
      Request Access
    </Button>
  );
}
