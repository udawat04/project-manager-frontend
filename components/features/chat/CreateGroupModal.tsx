'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemberCombobox } from '@/components/ui/member-combobox';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: any[];
  onGroupCreated: (group: any) => void;
}

export function CreateGroupModal({
  open,
  onOpenChange,
  availableUsers,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = React.useState('');
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createConversation({
        type: 'group',
        name: groupName.trim(),
        participantIds: selectedUserIds,
      });
      toast.success('Group created successfully!');
      onGroupCreated(res.conversation);
      onOpenChange(false);
      setGroupName('');
      setSelectedUserIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
            <DialogDescription>
              Create a new group conversation with your team members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto px-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Group Name *</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Marketing Team"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Select Members *</label>
              <MemberCombobox
                users={availableUsers}
                selectedUserIds={selectedUserIds}
                onChange={setSelectedUserIds}
                multiple={true}
                placeholder="Search members..."
              />
            </div>
          </div>

          <DialogFooter className="pt-4 mt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
