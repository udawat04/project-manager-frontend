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
import { Button } from '@/components/ui/button';
import {
  FolderKanban,
  Calendar,
  Mail,
  ExternalLink,
  Edit2,
  Phone,
  Briefcase,
  Crown,
  Shield,
  Code,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/ui/user-avatar';

interface MemberDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onEdit?: (user: any) => void;
}

function getRoleBadge(role?: string, isMasterAdmin?: boolean) {
  if (isMasterAdmin || role === 'MASTER_ADMIN') {
    return {
      label: 'Master Admin',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold',
      icon: <Crown className="h-3 w-3 mr-1" />,
    };
  }
  if (role === 'PROJECT_MANAGER') {
    return {
      label: 'Project Manager',
      badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/30 font-semibold',
      icon: <Briefcase className="h-3 w-3 mr-1" />,
    };
  }
  if (role === 'TEAM_LEAD') {
    return {
      label: 'Team Lead',
      badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold',
      icon: <Shield className="h-3 w-3 mr-1" />,
    };
  }
  return {
    label: 'Developer',
    badgeClass: 'bg-purple-500/10 text-purple-500 border-purple-500/30 font-semibold',
    icon: <Code className="h-3 w-3 mr-1" />,
  };
}

export function MemberDetailModal({
  open,
  onOpenChange,
  userId,
  onEdit,
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

  const roleMeta = getRoleBadge(userData?.role, userData?.isMasterAdmin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Member Profile & Assignments</DialogTitle>
              <DialogDescription>
                Detailed team role, contact info, and active project involvement.
              </DialogDescription>
            </div>
            {userData && !userData.isMasterAdmin && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(userData);
                }}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
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
            <div className="p-4 rounded-[8px] bg-muted/40 border border-border space-y-3">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  name={userData.name}
                  avatarUrl={userData.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground truncate">{userData.name}</h3>
                    <Badge variant="outline" className={`text-[10px] font-mono flex items-center ${roleMeta.badgeClass}`}>
                      {roleMeta.icon}
                      <span>{roleMeta.label}</span>
                    </Badge>
                  </div>
                  {userData.title && (
                    <p className="text-xs text-foreground/80 font-medium mt-0.5">{userData.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span>{userData.email}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70 text-[11px] text-muted-foreground font-mono">
                {userData.phone ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{userData.phone}</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground/60">No phone listed</div>
                )}
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Joined {formatDate(userData.createdAt)}</span>
                </div>
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
