'use client';

import * as React from 'react';
import { Plus, Server, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CustomSelect } from '@/components/ui/custom-select';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ProjectPlatformsTabProps {
  projectId: string;
  connectedPlatforms: any[];
  onRefresh: () => void;
  onActivityRefresh: () => void;
}

export function ProjectPlatformsTab({
  projectId,
  connectedPlatforms,
  onRefresh,
  onActivityRefresh,
}: ProjectPlatformsTabProps) {
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [allAccounts, setAllAccounts] = React.useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState('');
  const [resourceName, setResourceName] = React.useState('');
  const [resourceUrl, setResourceUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Disconnect confirmation
  const [disconnectModalOpen, setDisconnectModalOpen] = React.useState(false);
  const [targetDisconnectId, setTargetDisconnectId] = React.useState<string | null>(null);
  const [targetDisconnectName, setTargetDisconnectName] = React.useState<string>('');

  const openConnectModal = async () => {
    try {
      const res = await api.getPlatformAccounts();
      setAllAccounts(res.accounts);
      if (res.accounts.length > 0) {
        setSelectedAccountId(res.accounts[0].id);
      }
      setConnectOpen(true);
    } catch {
      toast.error('Failed to load platform accounts');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      toast.error('Please choose an account');
      return;
    }

    setSubmitting(true);
    try {
      await api.connectProjectPlatform(projectId, {
        platformAccountId: selectedAccountId,
        resourceName: resourceName.trim() || undefined,
        resourceUrl: resourceUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Platform account connected successfully');
      setConnectOpen(false);
      setResourceName('');
      setResourceUrl('');
      setNotes('');
      onRefresh();
      onActivityRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect platform');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDisconnect = (id: string, name: string) => {
    setTargetDisconnectId(id);
    setTargetDisconnectName(name);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!targetDisconnectId) return;
    try {
      await api.disconnectProjectPlatform(targetDisconnectId);
      toast.success('Platform disconnected from project');
      setDisconnectModalOpen(false);
      setTargetDisconnectId(null);
      onRefresh();
      onActivityRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect platform');
    }
  };

  const accountOptions = allAccounts.map((acc) => ({
    value: acc.id,
    label: `${acc.platform?.name || 'Platform'} - ${acc.name}`,
    sublabel: acc.loginIdentifier,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Connected Platforms & Infrastructure</h2>
          <p className="text-xs text-muted-foreground">
            External cloud accounts (Vercel, Supabase, Cloudflare, etc.) used by this project.
          </p>
        </div>

        <Button size="sm" onClick={openConnectModal} className="gap-1.5 h-8 text-xs rounded-[6px]">
          <Plus className="h-3.5 w-3.5" />
          <span>Connect Platform</span>
        </Button>
      </div>

      {connectedPlatforms.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Server className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">No platforms connected</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Link an external hosting, database, or CDN account to record and access deployment infrastructure.
          </p>
          <Button size="sm" onClick={openConnectModal} className="mt-4">
            Connect First Platform
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedPlatforms.map((conn) => (
            <Card key={conn.id} className="p-5 flex flex-col justify-between space-y-4 shadow-vercel">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-[4px] bg-canvas-soft border border-hairline flex items-center justify-center p-1 shrink-0">
                      <ProviderIcon
                        provider={conn.platformAccount?.platform?.slug || conn.platformAccount?.platform?.name || ''}
                        className="h-4 w-4"
                      />
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      {conn.platformAccount?.platform?.name || 'Platform'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Connected
                  </Badge>
                </div>

                <div className="p-2.5 rounded-[6px] bg-muted/40 border border-border space-y-1 text-xs">
                  <p className="text-muted-foreground">
                    Account: <strong className="text-foreground">{conn.platformAccount?.name}</strong>
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                    {conn.platformAccount?.loginIdentifier}
                  </p>
                </div>

                {conn.resourceName && (
                  <div className="text-xs font-mono">
                    <span className="text-muted-foreground text-[11px] block">Resource:</span>
                    <span className="font-semibold text-foreground">{conn.resourceName}</span>
                  </div>
                )}

                {conn.resourceUrl && (
                  <a
                    href={conn.resourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{conn.resourceUrl}</span>
                  </a>
                )}
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 h-7 text-xs gap-1"
                  onClick={() =>
                    confirmDisconnect(
                      conn.id,
                      `${conn.platformAccount?.platform?.name || 'Platform'} (${conn.platformAccount?.name})`
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        open={disconnectModalOpen}
        onOpenChange={setDisconnectModalOpen}
        title="Disconnect platform account?"
        description={`Are you sure you want to disconnect ${targetDisconnectName} from this project? This will remove the connection record.`}
        confirmLabel="Disconnect"
        variant="destructive"
        onConfirm={handleConfirmDisconnect}
      />

      {/* Connect Platform Dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent onClose={() => setConnectOpen(false)}>
          <form onSubmit={handleConnect}>
            <DialogHeader>
              <DialogTitle>Connect Platform Account</DialogTitle>
              <DialogDescription>
                Link an external platform account to this project.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Select Platform Account *</label>
                <CustomSelect
                  value={selectedAccountId}
                  onChange={setSelectedAccountId}
                  options={accountOptions}
                  placeholder="Choose an account..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Resource Name (optional)</label>
                <Input
                  mono
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  placeholder="e.g. pg-ledger-web, prod-cluster"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Resource URL (optional)</label>
                <Input
                  mono
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://pgledger.vercel.app"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Notes</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Production deployment branch: main"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setConnectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Connect Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
