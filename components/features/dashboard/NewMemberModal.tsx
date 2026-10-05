'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface NewMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewMemberModal({ open, onOpenChange, onSuccess }: NewMemberModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    role: 'DEVELOPER',
    initialPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.initialPassword) {
      toast.error('Name, email, and password are required');
      return;
    }

    setLoading(true);
    try {
      // The API doesn't have an explicit createUser exposed in api.ts yet, but users.controller.ts has one.
      // Let's call apiRequest directly if it's not in api.ts
      await api.apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('Member created successfully');
      onSuccess?.();
      onOpenChange(false);
      setFormData({ name: '', email: '', role: 'DEVELOPER', initialPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Create a new team member and provide their initial login credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              placeholder="e.g. jane@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="DEVELOPER">Developer</option>
              <option value="TESTER">Tester</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="MASTER_ADMIN">Master Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Initial Password</label>
            <Input
              type="password"
              placeholder="Minimum 8 characters"
              value={formData.initialPassword}
              onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Create Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
