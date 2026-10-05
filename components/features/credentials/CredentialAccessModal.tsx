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
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  UserPlus,
  Trash2,
  Eye,
  Edit3,
  Check,
  Search,
  Lock,
} from 'lucide-react';

interface CredentialAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId: string;
  credentialName: string;
  onAccessUpdated?: () => void;
}

export function CredentialAccessModal({
  open,
  onOpenChange,
  credentialId,
  credentialName,
  onAccessUpdated,
}: CredentialAccessModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [accesses, setAccesses] = React.useState<any[]>([]);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [accessLevel, setAccessLevel] = React.useState<'VIEW' | 'EDIT'>('VIEW');
  const [searchUser, setSearchUser] = React.useState('');
  const [granting, setGranting] = React.useState(false);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  const fetchAccessData = async () => {
    if (!credentialId) return;
    setLoading(true);
    try {
      const [accRes, usersRes] = await Promise.all([
        api.getCredentialAccess(credentialId),
        api.getUsers(),
      ]);
      setAccesses(accRes.accesses || []);
      setAllUsers(usersRes.users || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load access list');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && credentialId) {
      setSelectedUserIds([]);
      setSearchUser('');
      setAccessLevel('VIEW');
      fetchAccessData();
    }
  }, [open, credentialId]);

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleGrantAccess = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one member to grant access');
      return;
    }

    setGranting(true);
    try {
      await api.grantCredentialAccess(credentialId, {
        userIds: selectedUserIds,
        level: accessLevel,
      });

      toast.success(
        `Granted ${accessLevel} access to ${selectedUserIds.length} member${
          selectedUserIds.length > 1 ? 's' : ''
        }`
      );
      setSelectedUserIds([]);
      await fetchAccessData();
      onAccessUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAccess = async (targetUserId: string, userName: string) => {
    setRevokingId(targetUserId);
    try {
      await api.revokeCredentialAccess(credentialId, targetUserId);
      toast.success(`Revoked access for ${userName}`);
      await fetchAccessData();
      onAccessUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke access');
    } finally {
      setRevokingId(null);
    }
  };

  // Filter available users (exclude users who are master admin since they have implicit access)
  const existingAccessUserIds = new Set(accesses.map((a) => a.userId));
  const availableUsers = allUsers.filter(
    (u) =>
      !u.isMasterAdmin &&
      u.role !== 'MASTER_ADMIN' &&
      (u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            <span>Manage Credential Access</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Assign <strong className="text-foreground">{credentialName}</strong> to multiple members with View or Edit rights.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Grant Access Section */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                <span>Grant Access to Members</span>
              </span>
              <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setAccessLevel('VIEW')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    accessLevel === 'VIEW'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>View Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccessLevel('EDIT')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    accessLevel === 'EDIT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Can Edit</span>
                </button>
              </div>
            </div>

            {/* Member search and select */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border">
                {availableUsers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No matching members found
                  </div>
                ) : (
                  availableUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const alreadyHasAccess = existingAccessUserIds.has(user.id);
                    const existingRecord = accesses.find((a) => a.userId === user.id);

                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleSelectUser(user.id)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                          isSelected
                            ? 'bg-primary/10'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {alreadyHasAccess && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-mono uppercase"
                            >
                              Currently: {existingRecord?.level || 'VIEW'}
                            </Badge>
                          )}
                          <div
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-border bg-card'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                {selectedUserIds.length} member{selectedUserIds.length === 1 ? '' : 's'} selected
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleGrantAccess}
                disabled={selectedUserIds.length === 0 || granting}
                isLoading={granting}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Grant {accessLevel} Access</span>
              </Button>
            </div>
          </div>

          {/* Current Access List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Members with Access ({accesses.length})</span>
              </span>
              <span className="text-[10px] text-muted-foreground">
                Master Admin has full access automatically
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-border rounded-lg bg-card">
                Loading members...
              </div>
            ) : accesses.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-xl bg-card">
                <Lock className="w-6 h-6 mx-auto text-muted-foreground/40 mb-1.5" />
                <p className="text-xs font-semibold text-foreground">No member access granted</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  This credential is only visible to Master Admins until access is granted above.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border bg-card overflow-hidden">
                {accesses.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 text-xs hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar
                        name={acc.user?.name || 'User'}
                        avatarUrl={acc.user?.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {acc.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {acc.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge
                        variant={acc.level === 'EDIT' ? 'default' : 'secondary'}
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 ${
                          acc.level === 'EDIT' ? 'bg-amber-600 text-white' : ''
                        }`}
                      >
                        {acc.level === 'EDIT' ? (
                          <span className="flex items-center gap-1">
                            <Edit3 className="w-2.5 h-2.5" /> CAN EDIT
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" /> VIEW ONLY
                          </span>
                        )}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevokeAccess(acc.userId, acc.user?.name || 'User')}
                        disabled={revokingId === acc.userId}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Revoke access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-3.5 border-t border-border bg-card">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
