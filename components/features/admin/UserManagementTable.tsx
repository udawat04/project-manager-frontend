'use client';

import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Shield, Key, Trash, UserX, UserCheck } from 'lucide-react';

export default function UserManagementTable({ users, loading, onUpdate }: { users: any[], loading: boolean, onUpdate: () => void }) {
  
  const handleToggleStatus = async (user: any) => {
    try {
      await api.updateUser(user.id, { isActive: !user.isActive } as any);
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.deleteUser(id);
      toast.success('User deleted successfully');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-background/30 border-dashed">
        <p>No members found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Member</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => {
            const dropdownItems = [];

            if (!user.isMasterAdmin) {
              dropdownItems.push({
                label: user.isActive ? 'Revoke Access' : 'Restore Access',
                icon: user.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />,
                onClick: () => handleToggleStatus(user),
                destructive: user.isActive,
              });
            }

            dropdownItems.push({
              label: 'Delete Member',
              icon: <Trash className="h-3.5 w-3.5" />,
              onClick: () => handleDelete(user.id),
              destructive: true,
              disabled: user.isMasterAdmin,
            });

            return (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                    <div>
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {user.name}
                        {user.isMasterAdmin && <Shield className="h-3 w-3 text-primary" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isMasterAdmin ? 'default' : 'secondary'} className="capitalize text-xs">
                    {user.role.replace('_', ' ').toLowerCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? (
                    <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/10">Deactivated</Badge>
                  )}
                  {user.mustChangePassword && (
                    <Badge variant="outline" className="ml-2 border-orange-500/50 text-orange-500 bg-orange-500/10" title="Must change password on next login">
                      <Key className="h-3 w-3 mr-1" /> Temp PW
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu
                    trigger={
                      <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    }
                    items={dropdownItems}
                    align="right"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
