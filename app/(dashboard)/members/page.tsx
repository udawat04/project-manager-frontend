'use client';

import * as React from 'react';
import {
  Users,
  Search,
  FolderKanban,
  Mail,
  Calendar,
  ArrowRight,
  Plus,
  UserPlus,
  Check,
  Crown,
  Briefcase,
  Shield,
  Code,
  Edit2,
  Trash2,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CardSkeleton } from '@/components/loading';
import { MemberDetailModal } from '@/components/features/members/MemberDetailModal';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ImageUploadPicker } from '@/components/ui/image-upload-picker';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
];

function getRoleMeta(role?: string, isMasterAdmin?: boolean) {
  if (isMasterAdmin || role === 'MASTER_ADMIN') {
    return {
      label: 'Master Admin',
      cardClass: 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/[0.03] to-card hover:border-amber-500/70 shadow-amber-500/5',
      badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      avatarClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      dotClass: 'bg-amber-500',
      icon: <Crown className="h-3.5 w-3.5 mr-1" />,
    };
  }
  if (role === 'PROJECT_MANAGER') {
    return {
      label: 'Project Manager',
      cardClass: 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-blue-500/[0.03] to-card hover:border-blue-500/70 shadow-blue-500/5',
      badgeClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      avatarClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      dotClass: 'bg-blue-500',
      icon: <Briefcase className="h-3.5 w-3.5 mr-1" />,
    };
  }
  if (role === 'TEAM_LEAD') {
    return {
      label: 'Team Lead',
      cardClass: 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.03] to-card hover:border-emerald-500/70 shadow-emerald-500/5',
      badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      avatarClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      icon: <Shield className="h-3.5 w-3.5 mr-1" />,
    };
  }
  return {
    label: 'Developer',
    cardClass: 'border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-purple-500/[0.03] to-card hover:border-purple-500/70 shadow-purple-500/5',
    badgeClass: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
    avatarClass: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
    dotClass: 'bg-purple-500',
    icon: <Code className="h-3.5 w-3.5 mr-1" />,
  };
}

export default function MembersPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Member detail modal state
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  // Add member modal state (No password!)
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newRole, setNewRole] = React.useState('DEVELOPER');
  const [newTitle, setNewTitle] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newAvatarFile, setNewAvatarFile] = React.useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = React.useState<string | null>(null);
  const [assignedProjectIds, setAssignedProjectIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  // Edit member modal state
  const [editMemberOpen, setEditMemberOpen] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editRole, setEditRole] = React.useState('DEVELOPER');
  const [editTitle, setEditTitle] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editAvatarUrl, setEditAvatarUrl] = React.useState<string | null>(null);
  const [editAvatarUploading, setEditAvatarUploading] = React.useState(false);
  const [editAssignedProjectIds, setEditAssignedProjectIds] = React.useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deletingUser, setDeletingUser] = React.useState<any | null>(null);

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

  const handleOpenEdit = async (u: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const detail = await api.getUserById(u.id);
      const user = detail.user;
      setEditingUserId(user.id);
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditRole(user.role || 'DEVELOPER');
      setEditTitle(user.title || '');
      setEditPhone(user.phone || '');
      setEditAvatarUrl(user.avatarUrl || null);
      setEditAssignedProjectIds((user.memberships || []).map((m: any) => m.project?.id).filter(Boolean));
      setEditMemberOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load member profile for editing');
    }
  };

  const handleDirectEditAvatarUpload = async (file: File) => {
    if (!editingUserId) return;
    setEditAvatarUploading(true);
    try {
      const res = await api.uploadMemberAvatar(editingUserId, file);
      setEditAvatarUrl(res.avatarUrl);
      toast.success('Member photo uploaded successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload member photo');
      throw err;
    } finally {
      setEditAvatarUploading(false);
    }
  };

  const handleRemoveEditAvatar = async () => {
    if (!editingUserId) return;
    setEditAvatarUrl(null);
    try {
      await api.updateUser(editingUserId, { avatarUrl: null });
      toast.success('Member photo removed');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove photo');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        initialPassword: newPassword.trim() || undefined,
        title: newTitle.trim() || undefined,
        phone: newPhone.trim() || undefined,
        assignedProjectIds: assignedProjectIds.length > 0 ? assignedProjectIds : undefined,
      });

      if (newAvatarFile && res.user?.id) {
        try {
          await api.uploadMemberAvatar(res.user.id, newAvatarFile);
        } catch (uploadErr) {
          console.error('Failed to upload avatar after member creation:', uploadErr);
          toast.warning('Member was created, but photo upload failed. You can re-upload in Edit Member.');
        }
      }

      toast.success(`Team member "${newName}" created successfully`);
      setAddMemberOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('DEVELOPER');
      setNewTitle('');
      setNewPhone('');
      setNewPassword('');
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
      setAssignedProjectIds([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editName.trim() || !editEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setEditSubmitting(true);
    try {
      await api.updateUser(editingUserId, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        title: editTitle.trim() || undefined,
        phone: editPhone.trim() || undefined,
        assignedProjectIds: editAssignedProjectIds,
      });

      toast.success('Member profile updated successfully');
      setEditMemberOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update member');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingUser) return;
    try {
      await api.deleteUser(deletingUser.id);
      toast.success(`Member "${deletingUser.name}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setEditMemberOpen(false);
      setDetailModalOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete member');
    }
  };

  const toggleProjectAssignment = (projectId: string) => {
    if (assignedProjectIds.includes(projectId)) {
      setAssignedProjectIds(assignedProjectIds.filter((id) => id !== projectId));
    } else {
      setAssignedProjectIds([...assignedProjectIds, projectId]);
    }
  };

  const toggleEditProjectAssignment = (projectId: string) => {
    if (editAssignedProjectIds.includes(projectId)) {
      setEditAssignedProjectIds(editAssignedProjectIds.filter((id) => id !== projectId));
    } else {
      setEditAssignedProjectIds([...editAssignedProjectIds, projectId]);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Members</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organize team members by role (Developer, Team Lead, Project Manager) and assign project access.
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

      {/* Role Legend Bar */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground font-mono">
        <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Role Highlights:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold text-[11px]">
          <Crown className="h-3 w-3" /> Master Admin
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 font-semibold text-[11px]">
          <Briefcase className="h-3 w-3" /> Project Manager
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-semibold text-[11px]">
          <Shield className="h-3 w-3" /> Team Lead
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-500 font-semibold text-[11px]">
          <Code className="h-3 w-3" /> Developer
        </span>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-lg border border-border bg-card shadow-vercel">
        <form onSubmit={handleSearch} className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name, email, or role..."
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
          {users.map((u) => {
            const roleMeta = getRoleMeta(u.role, u.isMasterAdmin);
            return (
              <Card
                key={u.id}
                onClick={() => handleOpenMember(u.id)}
                className={`p-5 flex flex-col justify-between space-y-4 border transition-all cursor-pointer group shadow-sm ${roleMeta.cardClass}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        name={u.name}
                        avatarUrl={u.avatarUrl}
                        size="md"
                        fallbackClassName={roleMeta.avatarClass}
                        dotColorClass={roleMeta.dotClass}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {u.name}
                          </h3>
                        </div>
                        {u.title && (
                          <p className="text-[11px] text-foreground/75 font-medium truncate">{u.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate font-mono">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!u.isMasterAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(u, e)}
                          title="Edit member profile"
                          className="p-1.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-0.5" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                    <Badge variant="outline" className={`text-[10px] font-mono flex items-center ${roleMeta.badgeClass}`}>
                      {roleMeta.icon}
                      <span>{roleMeta.label}</span>
                    </Badge>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span>Projects:</span>
                      <span className="font-bold text-foreground">{u._count?.memberships || 0}</span>
                    </div>
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
            );
          })}
        </div>
      )}

      {/* Add Member Modal (No Password) */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md max-h-[88vh] flex flex-col p-0 overflow-hidden" onClose={() => setAddMemberOpen(false)}>
          <form onSubmit={handleAddMember} className="flex flex-col h-full max-h-[88vh] overflow-hidden">
            <DialogHeader className="p-5 pb-3 border-b border-border shrink-0 mb-0">
              <DialogTitle>Provision Team Member</DialogTitle>
              <DialogDescription>
                Create a new member account. They will be required to change their temporary password on first login.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-5 py-4 overflow-y-auto flex-1">
              <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Profile Photo (Optional)</label>
                <ImageUploadPicker
                  currentImageUrl={newAvatarPreview}
                  name={newName || 'New Member'}
                  size="md"
                  onFileSelect={(file, preview) => {
                    setNewAvatarFile(file);
                    setNewAvatarPreview(preview);
                  }}
                  helperText="Select a photo from your device to upload to Cloudinary."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Full Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Team Role</label>
                  <CustomSelect
                    value={newRole}
                    onChange={(val) => setNewRole(val)}
                    options={ROLE_OPTIONS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Job Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Phone Number (Optional)</label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +1 234 567 890"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-muted/20 border border-border rounded-lg mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground block">Temporary Password *</label>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={generatePassword}>
                    Generate Secure
                  </Button>
                </div>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  required
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Share this password with the user securely.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-foreground">Assign to Projects</label>
                {projects.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No projects created yet.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border rounded-[6px] p-2 bg-muted/20">
                    {projects.map((p) => {
                      const isAssigned = assignedProjectIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProjectAssignment(p.id)}
                          className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border transition-colors ${
                            isAssigned
                              ? 'bg-primary/10 border-primary/40 text-foreground font-medium'
                              : 'hover:bg-muted border-transparent text-muted-foreground'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                              isAssigned ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                            }`}
                          >
                            {isAssigned && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-4 px-5 border-t border-border shrink-0 bg-card mt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddMemberOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="blue" isLoading={submitting}>
                Save Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={editMemberOpen} onOpenChange={setEditMemberOpen}>
        <DialogContent className="max-w-md max-h-[88vh] flex flex-col p-0 overflow-hidden" onClose={() => setEditMemberOpen(false)}>
          <form onSubmit={handleUpdateMember} className="flex flex-col h-full max-h-[88vh] overflow-hidden">
            <DialogHeader className="p-5 pb-3 border-b border-border shrink-0 mb-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Edit Member Profile</DialogTitle>
                  <DialogDescription>
                    Update member details, role hierarchy, and assigned project workspaces.
                  </DialogDescription>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeletingUser({ id: editingUserId, name: editName });
                    setDeleteConfirmOpen(true);
                  }}
                  className="h-8 text-xs gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 p-5 py-4 overflow-y-auto flex-1">
              <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Profile Photo</label>
                <ImageUploadPicker
                  currentImageUrl={editAvatarUrl}
                  name={editName || 'Member'}
                  size="md"
                  isUploading={editAvatarUploading}
                  onDirectUpload={handleDirectEditAvatarUpload}
                  onRemoveImage={handleRemoveEditAvatar}
                  helperText="Upload a photo from your device. Automatically saved to Cloudinary."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Full Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Team Role</label>
                  <CustomSelect
                    value={editRole}
                    onChange={(val) => setEditRole(val)}
                    options={ROLE_OPTIONS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Job Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Phone Number</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +1 234 567 890"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-foreground">Assigned Projects</label>
                {projects.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No projects available.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border rounded-[6px] p-2 bg-muted/20">
                    {projects.map((p) => {
                      const isAssigned = editAssignedProjectIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleEditProjectAssignment(p.id)}
                          className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border transition-colors ${
                            isAssigned
                              ? 'bg-primary/10 border-primary/40 text-foreground font-medium'
                              : 'hover:bg-muted border-transparent text-muted-foreground'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                              isAssigned ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                            }`}
                          >
                            {isAssigned && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-4 px-5 border-t border-border shrink-0 bg-card mt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMemberOpen(false)}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="blue" isLoading={editSubmitting}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Team Member"
        description={`Are you sure you want to delete "${deletingUser?.name}"? They will be removed from all assigned projects.`}
        confirmLabel="Delete Member"
        variant="destructive"
        onConfirm={handleDeleteMember}
      />

      {/* Member Detail Modal */}
      <MemberDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        userId={selectedUserId}
        onEdit={(userData) => handleOpenEdit(userData)}
      />
    </div>
  );
}
