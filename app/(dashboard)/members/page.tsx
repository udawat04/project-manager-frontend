'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  FolderKanban,
  Mail,
  Calendar,
  ArrowRight,
  Shield,
  Plus,
  UserPlus,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CardSkeleton } from '@/components/loading';
import { MemberDetailModal } from '@/components/features/members/MemberDetailModal';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function MembersPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Member detail modal state
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  // Add member modal state
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [assignedProjectIds, setAssignedProjectIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [userRes, projRes] = await Promise.all([
        api.getAllUsers(search.trim() || undefined),
        api.getProjects(),
      ]);
      setUsers(userRes.users);
      setProjects(projRes.projects);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenMember = (userId: string) => {
    setSelectedUserId(userId);
    setDetailModalOpen(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim() || undefined,
        assignedProjectIds: assignedProjectIds.length > 0 ? assignedProjectIds : undefined,
      });

      toast.success(`Team member "${newName}" created successfully`);
      setAddMemberOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setAssignedProjectIds([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create member');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProjectAssignment = (projectId: string) => {
    if (assignedProjectIds.includes(projectId)) {
      setAssignedProjectIds(assignedProjectIds.filter((id) => id !== projectId));
    } else {
      setAssignedProjectIds([...assignedProjectIds, projectId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Members</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage team collaborators and control their assigned projects, environments, and infrastructure.
          </p>
        </div>

        <Button
          variant="blue"
          onClick={() => setAddMemberOpen(true)}
          className="gap-1.5 h-9 px-3.5 rounded-[6px] shadow-sm font-semibold self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Member</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-lg border border-border bg-card shadow-vercel">
        <form onSubmit={handleSearch} className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name or email..."
            className="pl-9 h-9 text-xs border-transparent bg-muted/40 focus:bg-card focus:border-border"
          />
        </form>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border bg-card">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3 stroke-1" />
          <h3 className="text-sm font-semibold text-foreground">No team members found</h3>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query or add a new team member.</p>
          <Button
            variant="blue"
            size="sm"
            onClick={() => setAddMemberOpen(true)}
            className="mt-4 h-8 text-xs font-semibold"
          >
            Add First Member
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <Card
              key={u.id}
              onClick={() => handleOpenMember(u.id)}
              className="p-5 flex flex-col justify-between space-y-4 border-border bg-card shadow-vercel hover:border-border/80 transition-all cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm uppercase text-foreground font-mono shrink-0 shadow-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {u.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate font-mono">{u.email}</p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                <div className="pt-2 border-t border-border text-xs flex items-center justify-between text-muted-foreground font-mono">
                  <span>Assigned Projects:</span>
                  <Badge variant="secondary" className="font-mono text-[11px] bg-muted border border-border text-foreground">
                    {u._count?.memberships || 0}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between font-mono">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {formatDate(u.createdAt)}</span>
                </div>
                <span className="text-[10px] text-primary group-hover:underline font-semibold">View Profile →</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md" onClose={() => setAddMemberOpen(false)}>
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Invite a new collaborator and assign them to your workspace projects.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Full Name *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email Address *</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@company.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Initial Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty for default password (password123)"
                />
              </div>

              {/* Assign Projects */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Assign Projects</label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {assignedProjectIds.length} selected
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border bg-muted/20">
                  {projects.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No projects created yet.
                    </div>
                  ) : (
                    projects.map((p) => {
                      const isSelected = assignedProjectIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProjectAssignment(p.id)}
                          className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 font-semibold text-foreground'
                              : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{p.name}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddMemberOpen(false)}
                className="h-8 text-xs rounded-[6px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                variant="blue"
                className="h-8 text-xs rounded-[6px] font-semibold"
              >
                {submitting ? 'Creating...' : 'Create Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Member Detail Drawer / Modal */}
      <MemberDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        userId={selectedUserId}
      />
    </div>
  );
}
