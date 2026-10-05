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
import { CustomSelect } from '@/components/ui/custom-select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AccessControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environmentId: string;
  projectId: string;
  onSuccess: () => void;
}

export function AccessControlModal({
  open,
  onOpenChange,
  environmentId,
  projectId,
  onSuccess,
}: AccessControlModalProps) {
  const [accessList, setAccessList] = React.useState<any[]>([]);
  const [projectMembers, setProjectMembers] = React.useState<any[]>([]);
  
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  
  const [selectedUser, setSelectedUser] = React.useState('');
  const [selectedLevel, setSelectedLevel] = React.useState('readonly');

  React.useEffect(() => {
    if (open && environmentId && projectId) {
      fetchData();
    }
  }, [open, environmentId, projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accessRes, projRes] = await Promise.all([
        api.getEnvironmentAccessList(environmentId),
        api.getProject(projectId),
      ]);
      setAccessList(accessRes.accessList || []);
      setProjectMembers(projRes.project?.members?.map((m: any) => m.user) || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load access data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.grantEnvironmentAccess(environmentId, { userId: selectedUser, level: selectedLevel });
      toast.success('Access granted successfully');
      setSelectedUser('');
      fetchData();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant access');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await api.revokeEnvironmentAccess(environmentId, userId);
      toast.success('Access revoked');
      fetchData();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke access');
    }
  };

  const unassignedMembers = projectMembers.filter(
    m => !accessList.some(a => a.userId === m.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Environment Access Control</DialogTitle>
          <DialogDescription>
            Grant explicit access to this environment. Access overrides default project roles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-ink">Current Access</h4>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : accessList.length === 0 ? (
              <div className="text-sm text-body p-4 bg-canvas-soft rounded-md border border-hairline text-center">
                No explicit access rules defined. Only Editors and Master Admins have access.
              </div>
            ) : (
              <div className="border border-hairline rounded-md divide-y divide-hairline">
                {accessList.map((access) => (
                  <div key={access.id} className="p-3 flex items-center justify-between bg-canvas">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs font-semibold">
                        {access.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{access.user?.name}</p>
                        <p className="text-xs text-body">{access.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2 py-1 bg-canvas-soft border border-hairline rounded font-mono">
                        {access.level}
                      </span>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2" onClick={() => handleRevoke(access.userId)}>
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-hairline">
            <h4 className="text-sm font-semibold text-ink">Grant Access</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium">Team Member</label>
                <CustomSelect
                  value={selectedUser}
                  onChange={setSelectedUser}
                  options={[
                    { value: '', label: 'Select a member...' },
                    ...unassignedMembers.map(m => ({ value: m.id, label: m.name }))
                  ]}
                />
              </div>
              <div className="w-40 space-y-1.5">
                <label className="text-xs font-medium">Access Level</label>
                <CustomSelect
                  value={selectedLevel}
                  onChange={setSelectedLevel}
                  options={[
                    { value: 'readonly', label: 'Read-Only' },
                    { value: 'readwrite', label: 'Read/Write' }
                  ]}
                />
              </div>
              <Button onClick={handleGrant} disabled={!selectedUser || submitting} isLoading={submitting}>
                Grant
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
