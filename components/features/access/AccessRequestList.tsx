import * as React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface AccessRequestListProps {
  requests: any[];
  loading: boolean;
  resolvingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function AccessRequestList({ requests, loading, resolvingId, onApprove, onReject }: AccessRequestListProps) {
  if (loading && requests.length === 0) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center border-t border-border">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 text-muted-foreground">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-ink">All Caught Up!</h3>
        <p className="text-sm text-body mt-1">There are no pending access requests.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {requests.map((req) => (
        <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-sm text-ink">{req.user?.name}</span>
              <span className="text-xs text-body bg-muted/50 px-2 py-0.5 rounded-full">
                {req.user?.role}
              </span>
            </div>
            <p className="text-sm text-ink break-words">
              Requested <span className="font-medium text-primary">{req.level}</span> access for {req.resourceType}
            </p>
            {req.reason && (
              <div className="mt-2 text-sm text-body bg-canvas p-3 rounded-md border border-hairline border-l-2 border-l-primary/50">
                "{req.reason}"
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-3 text-xs text-body">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
            </div>
          </div>
          
          {req.status === 'pending' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                onClick={() => onReject(req.id)}
                disabled={resolvingId === req.id}
              >
                <X className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onApprove(req.id)}
                disabled={resolvingId === req.id}
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approve
              </Button>
            </div>
          ) : (
            <div className="shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                req.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {req.status}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
