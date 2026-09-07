'use client';

import * as React from 'react';
import { Plus, Users, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CustomSelect } from '@/components/ui/custom-select';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { MemberDetailModal } from '@/components/features/members/MemberDetailModal';
import { formatTimeAgo } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ProjectMembersTabProps {
  projectId: string;
  members: any[];
  onRefresh: () => void;
  onActivityRefresh: () => void;
}

export function ProjectMembersTab({
  projectId,
  members,
  onRefresh,
  onActivityRefresh,
}: ProjectMembersTabProps) {
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState('');
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
      setAllUsers(res.users);
      const available = res.users.filter((u) => !members.some((m) => m.userId === u.id));
      if (available.length > 0) {
        setSelectedUserId(available[0].id);
      }
      setAssignOpen(true);
    } catch {
      toast.error('Failed to load team users');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a member');
      return;
    }

    setSubmitting(true);
    try {
      await api.assignProjectMember(projectId, selectedUserId);
      toast.success('Member assigned to project');
      setAssignOpen(false);
      onRefresh();
      onActivityRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign member');
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
  const userOptions = availableUsers.map((u) => ({
    value: u.id,
    label: u.name,
    sublabel: u.email,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Project Team Members</h2>
          <p className="text-xs text-muted-foreground">
            Collaborators who have access to this project. Click any member to view their profile and all assigned projects.
          </p>
        </div>

        <Button size="sm" onClick={openAssignModal} className="gap-1.5 h-8 text-xs rounded-[6px]">
          <Plus className="h-3.5 w-3.5" />
          <span>Assign Member</span>
        </Button>
      </div>

      <Card className="divide-y divide-border overflow-hidden shadow-vercel">
        {members.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No team members assigned yet.
          </div>
        ) : (
          members.map((m) => (
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
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-border flex items-center justify-center font-bold text-xs uppercase text-primary shrink-0 group-hover:scale-105 transition-transform">
                  {m.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                    <span>{m.user?.name}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{m.user?.email}</p>
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
          ))
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
              <DialogTitle>Assign Team Member</DialogTitle>
              <DialogDescription>
                Select a registered team member to grant access to {members[0]?.project?.name || 'this project'}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Select Member *</label>
                {availableUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-2 rounded bg-muted/40 border border-border">
                    All available team members are already assigned to this project.
                  </p>
                ) : (
                  <MemberCombobox
                    users={availableUsers}
                    selectedUserIds={selectedUserId ? [selectedUserId] : []}
                    onChange={(ids) => setSelectedUserId(ids[0] || '')}
                    multiple={false}
                    placeholder="Search member by name or email..."
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} disabled={userOptions.length === 0}>
                Assign Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
