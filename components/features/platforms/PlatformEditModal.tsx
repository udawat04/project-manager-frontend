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
import { CustomSelect } from '@/components/ui/custom-select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PlatformEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: any;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'HOSTING', label: 'Hosting & Compute' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'DNS_CDN', label: 'DNS & CDN' },
  { value: 'SOURCE_CONTROL', label: 'Source Control & Git' },
  { value: 'STORAGE', label: 'Object Storage' },
  { value: 'PAYMENTS', label: 'Payments & Billing' },
  { value: 'EMAIL', label: 'Email & Communications' },
  { value: 'ANALYTICS', label: 'Analytics & Logging' },
  { value: 'MOBILE', label: 'Mobile App Stores' },
  { value: 'OTHER', label: 'Other' },
];

export function PlatformEditModal({
  open,
  onOpenChange,
  platform,
  onSuccess,
}: PlatformEditModalProps) {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('HOSTING');
  const [websiteUrl, setWebsiteUrl] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (platform && open) {
      setName(platform.name || '');
      setCategory(platform.category || 'HOSTING');
      setWebsiteUrl(platform.websiteUrl || '');
      setDescription(platform.description || '');
    }
  }, [platform, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Platform name is required');
      return;
    }

    setLoading(true);
    try {
      await api.updatePlatform(platform.id, {
        name: name.trim(),
        category,
        websiteUrl: websiteUrl.trim() || undefined,
        description: description.trim() || undefined,
      });

      toast.success('Platform details updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update platform');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Platform Details</DialogTitle>
            <DialogDescription>
              Update provider name, category classification, or documentation link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Platform Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vercel, Supabase, Cloudflare"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Category</label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val)}
                options={CATEGORIES}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Official Website URL</label>
              <Input
                mono
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://vercel.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of platform capabilities"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-8 text-xs rounded-[6px] bg-ink text-on-primary hover:bg-ink/90"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
