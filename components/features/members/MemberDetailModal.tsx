'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Calendar, Mail, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface MemberDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export function MemberDetailModal({
  open,
  onOpenChange,
  userId,
}: MemberDetailModalProps) {
  const [userData, setUserData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && userId) {
      setLoading(true);
      api
        .getUserById(userId)
        .then((res: { user: any }) => setUserData(res.user))
        .catch((err: any) => console.error('Failed to load user detail:', err))
        .finally(() => setLoading(false));
    } else {
      setUserData(null);
    }
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Member Profile & Projects</DialogTitle>
          <DialogDescription>
            Detailed assignment history and active project involvement.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading member information...
          </div>
        ) : !userData ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No member details available.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-3.5 p-4 rounded-[8px] bg-muted/40 border border-border">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-border flex items-center justify-center font-bold text-base uppercase text-primary shrink-0">
                {userData.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-foreground truncate">{userData.name}</h3>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span>{userData.email}</span>
                </p>
                <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Member since {formatDate(userData.createdAt)}</span>
                </p>
              </div>
            </div>

            {/* Assigned Projects List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span>Assigned Projects ({userData.memberships?.length || 0})</span>
                </span>
              </div>

              {(!userData.memberships || userData.memberships.length === 0) ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-[6px]">
                  This member is not currently assigned to any projects.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 border border-border rounded-[8px] p-2">
                  {userData.memberships.map((m: any) => (
                    <Link
                      key={m.id}
                      href={`/projects/${m.project?.id}`}
                      onClick={() => onOpenChange(false)}
                      className="p-2.5 rounded-[6px] hover:bg-muted/60 transition-colors flex items-center justify-between border border-transparent hover:border-border group block"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {m.project?.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {m.project?.type}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                          Assigned {formatDate(m.assignedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            m.project?.status === 'PRODUCTION'
                              ? 'success'
                              : m.project?.status === 'STAGING'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px] font-mono uppercase"
                        >
                          {m.project?.status}
                        </Badge>
                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground opacity-60 group-hover:opacity-100" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
