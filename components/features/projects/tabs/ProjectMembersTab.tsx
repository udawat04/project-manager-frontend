'use client';

import * as React from 'react';
import { Plus, Users, Trash2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { MemberDetailModal } from '@/components/features/members/MemberDetailModal';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatTimeAgo, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ProjectMembersTabProps {
  projectId: string;
  members: any[];
  onRefresh: () => void;
  onActivityRefresh: () => void;
}

const ROLE_META: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  MASTER_ADMIN: {
    label: 'Master Admin',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  PROJECT_MANAGER: {
    label: 'Project Manager',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dotClass: 'bg-blue-500',
  },
  TEAM_LEAD: {
    label: 'Team Lead',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
  DEVELOPER: {
    label: 'Developer',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    dotClass: 'bg-purple-500',
  },
};

export function ProjectMembersTab({
  projectId,
  members,
  onRefresh,
  onActivityRefresh,
}: ProjectMembersTabProps) {
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedMemberDetailId, setSelectedMemberDetailId] = React.useState<string | null>(null);

  // Remove Modal
  const [removeModalOpen, setRemoveModalOpen] = React.useState(false);
  const [targetRemoveUserId, setTargetRemoveUserId] = React.useState<string | null>(null);
  const [targetRemoveUserName, setTargetRemoveUserName] = React.useState('');

  const openAssignModal = async () => {
    try {
      const res = await api.getAllUsers();
      // Filter out Master Admin so master admin cannot be assigned as a project member
      const regularUsers = (res.users || []).filter(
        (u: any) => !u.isMasterAdmin && u.role !== 'MASTER_ADMIN'
      );
      setAllUsers(regularUsers);
      setSelectedUserIds([]);
      setAssignOpen(true);
    } catch {
      toast.error('Failed to load team users');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one member to assign');
      return;
    }

    setSubmitting(true);
    try {
      await api.assignProjectMember(projectId, selectedUserIds);
      toast.success(
        selectedUserIds.length === 1
          ? 'Member assigned to project'
          : `${selectedUserIds.length} members assigned to project`
      );
      setAssignOpen(false);
      setSelectedUserIds([]);
      onRefresh();
      onActivityRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign member(s)');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = (userId: string, name: string) => {
    setTargetRemoveUserId(userId);
    setTargetRemoveUserName(name);
    setRemoveModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!targetRemoveUserId) return;
    try {
      await api.removeProjectMember(projectId, targetRemoveUserId);
      toast.success('Member removed from project');
      setRemoveModalOpen(false);
      setTargetRemoveUserId(null);
      onRefresh();
      onActivityRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const availableUsers = allUsers.filter((u) => !members.some((m) => m.userId === u.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Project Team Members</h2>
          <p className="text-xs text-muted-foreground">
            Collaborators who have access to this project. Click any member to view their profile and assigned projects.
          </p>
        </div>

        <Button size="sm" onClick={openAssignModal} className="gap-1.5 h-8 text-xs rounded-[6px]">
          <Plus className="h-3.5 w-3.5" />
          <span>Assign Members</span>
        </Button>
      </div>

      <Card className="divide-y divide-border overflow-hidden shadow-vercel">
        {members.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No team members assigned yet. Click &quot;Assign Members&quot; above to add members.
          </div>
        ) : (
          members.map((m) => {
            const roleMeta = ROLE_META[m.user?.role] || ROLE_META.DEVELOPER;
            return (
              <div
                key={m.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                {/* Clickable Profile Info */}
                <div
                  onClick={() => {
                    setSelectedMemberDetailId(m.userId);
                    setDetailModalOpen(true);
                  }}
                  className="flex items-center gap-3.5 cursor-pointer group min-w-0"
                >
                  <UserAvatar
                    name={m.user?.name}
                    avatarUrl={m.user?.avatarUrl}
                    size="md"
                    dotColorClass={roleMeta.dotClass}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                        <span>{m.user?.name}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold rounded-full border',
                          roleMeta.badgeClass
                        )}
                      >
                        {roleMeta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono truncate">
                      <span>{m.user?.email}</span>
                      {m.user?.title && (
                        <>
                          <span className="font-sans text-muted-foreground/60">•</span>
                          <span className="font-sans text-foreground/80 truncate">{m.user.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment Time & Remove Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                    Assigned {formatTimeAgo(m.assignedAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 h-7 text-xs gap-1"
                    onClick={() => confirmRemove(m.userId, m.user?.name || 'Member')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Member Details Modal */}
      <MemberDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        userId={selectedMemberDetailId}
      />

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        open={removeModalOpen}
        onOpenChange={setRemoveModalOpen}
        title="Remove member from project?"
        description={`Are you sure you want to remove ${targetRemoveUserName} from this project? They will no longer have access to this project's environments or credentials.`}
        confirmLabel="Remove Member"
        variant="destructive"
        onConfirm={handleConfirmRemove}
      />

      {/* Assign Member Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent onClose={() => setAssignOpen(false)}>
          <form onSubmit={handleAssign}>
            <DialogHeader>
              <DialogTitle>Assign Team Members</DialogTitle>
              <DialogDescription>
                Select one or multiple team members to assign to this project simultaneously.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Select Members *</label>
                  {availableUsers.length > 0 && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {selectedUserIds.length} of {availableUsers.length} selected
                    </span>
                  )}
                </div>

                {availableUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-3 rounded-md bg-muted/40 border border-border">
                    All eligible team members are already assigned to this project.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <MemberCombobox
                      users={availableUsers}
                      selectedUserIds={selectedUserIds}
                      onChange={setSelectedUserIds}
                      multiple={true}
                      placeholder="Search members by name or email..."
                    />

                    {/* Quick multi-selection list */}
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-[6px] border border-border bg-muted/10 p-1.5">
                      {availableUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        const roleMeta = ROLE_META[u.role] || ROLE_META.DEVELOPER;
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUserIds((prev) =>
                                prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              );
                            }}
                            className={cn(
                              'flex items-center justify-between p-2 rounded-[4px] text-xs cursor-pointer transition-colors border',
                              isSelected
                                ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
                                : 'bg-card border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  'h-4 w-4 rounded-[3px] border flex items-center justify-center transition-colors shrink-0',
                                  isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-foreground truncate">{u.name}</span>
                                  <span
                                    className={cn(
                                      'inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold rounded-full border',
                                      roleMeta.badgeClass
                                    )}
                                  >
                                    {roleMeta.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono truncate">{u.email}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                disabled={availableUsers.length === 0 || selectedUserIds.length === 0}
              >
                Assign {selectedUserIds.length > 0 ? `(${selectedUserIds.length}) Members` : 'Members'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
