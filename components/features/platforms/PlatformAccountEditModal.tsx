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
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PlatformAccountEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any;
  onSuccess: () => void;
}

export function PlatformAccountEditModal({
  open,
  onOpenChange,
  account,
  onSuccess,
}: PlatformAccountEditModalProps) {
  const [name, setName] = React.useState('');
  const [loginIdentifier, setLoginIdentifier] = React.useState('');
  const [accountUrl, setAccountUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (account && open) {
      setName(account.name || '');
      setLoginIdentifier(account.loginIdentifier || '');
      setAccountUrl(account.accountUrl || '');
      setNotes(account.notes || '');
    }
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !loginIdentifier.trim()) {
      toast.error('Name and Login Identifier are required');
      return;
    }

    setLoading(true);
    try {
      await api.updatePlatformAccount(account.id, {
        name: name.trim(),
        loginIdentifier: loginIdentifier.trim(),
        accountUrl: accountUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Platform account updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Platform Account</DialogTitle>
            <DialogDescription>
              Update account display name, login email, and dashboard links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Account Label *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production AWS, Client Vercel"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Login Identifier / Email *</label>
              <Input
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="company@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Dashboard URL</label>
              <Input
                mono
                value={accountUrl}
                onChange={(e) => setAccountUrl(e.target.value)}
                placeholder="https://vercel.com/my-team"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Organization or usage notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
