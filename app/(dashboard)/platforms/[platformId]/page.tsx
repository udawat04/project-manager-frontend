'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Server,
  ArrowLeft,
  Plus,
  ExternalLink,
  FolderKanban,
  KeyRound,
  Trash2,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/ui/custom-select';
import { PlatformDetailSkeleton } from '@/components/loading';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { SecretField } from '@/components/features/SecretField';
import { PlatformEditModal } from '@/components/features/platforms/PlatformEditModal';
import { PlatformAccountEditModal } from '@/components/features/platforms/PlatformAccountEditModal';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function PlatformDetailPage() {
  const params = useParams();
  const platformId = params.platformId as string;

  const [platform, setPlatform] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Platform Edit Modal
  const [editPlatformOpen, setEditPlatformOpen] = React.useState(false);

  // Account Edit Modal
  const [editAccountOpen, setEditAccountOpen] = React.useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = React.useState<any>(null);

  // Add Account Modal
  const [addAccountOpen, setAddAccountOpen] = React.useState(false);
  const [accName, setAccName] = React.useState('');
  const [accLogin, setAccLogin] = React.useState('');
  const [accUrl, setAccUrl] = React.useState('');
  const [accNotes, setAccNotes] = React.useState('');

  // Add Account Credential Modal
  const [addCredOpen, setAddCredOpen] = React.useState(false);
  const [targetAccountId, setTargetAccountId] = React.useState('');
  const [credName, setCredName] = React.useState('');
  const [credType, setCredType] = React.useState('API_KEY');
  const [credFields, setCredFields] = React.useState<any[]>([
    { name: 'apiToken', value: '', type: 'token', isSensitive: true },
  ]);

  const handleCredTypeChange = (type: string) => {
    setCredType(type);
    if (type === 'LOGIN') {
      setCredFields([
        { name: 'username_or_email', value: '', type: 'text', isSensitive: false },
        { name: 'password', value: '', type: 'password', isSensitive: true },
      ]);
    } else if (type === 'API_KEY') {
      setCredFields([
        { name: 'apiToken', value: '', type: 'token', isSensitive: true },
      ]);
    } else if (type === 'DATABASE') {
      setCredFields([
        { name: 'host', value: '', type: 'text', isSensitive: false },
        { name: 'port', value: '5432', type: 'text', isSensitive: false },
        { name: 'database', value: '', type: 'text', isSensitive: false },
        { name: 'username', value: '', type: 'text', isSensitive: false },
        { name: 'password', value: '', type: 'password', isSensitive: true },
      ]);
    } else if (type === 'SSH') {
      setCredFields([
        { name: 'privateKey', value: '', type: 'password', isSensitive: true },
        { name: 'passphrase', value: '', type: 'password', isSensitive: true },
      ]);
    }
  };

  const fetchPlatform = async () => {
    setLoading(true);
    try {
      const res = await api.getPlatform(platformId);
      setPlatform(res.platform);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load platform');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlatform();
  }, [platformId]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim() || !accLogin.trim()) return;

    try {
      await api.createPlatformAccount({
        platformId,
        name: accName.trim(),
        loginIdentifier: accLogin.trim(),
        accountUrl: accUrl.trim() || undefined,
        notes: accNotes.trim() || undefined,
      });
      toast.success('Account added successfully');
      setAddAccountOpen(false);
      setAccName('');
      setAccLogin('');
      setAccUrl('');
      setAccNotes('');
      fetchPlatform();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add account');
    }
  };

  const handleAddAccountCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccountId || !credName.trim()) return;

    try {
      await api.createCredential({
        name: credName.trim(),
        type: credType,
        platformAccountId: targetAccountId,
        fields: credFields,
      });
      toast.success('Credential saved to platform account');
      setAddCredOpen(false);
      setCredName('');
      setCredFields([{ name: 'apiToken', value: '', type: 'token', isSensitive: true }]);
      fetchPlatform();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add credential');
    }
  };

  if (loading) {
    return <PlatformDetailSkeleton />;
  }

  if (!platform) {
    return (
      <div className="p-12 text-center border border-hairline rounded-lg bg-canvas">
        <p className="text-body font-medium">Platform not found.</p>
        <Link
          href="/platforms"
          className="text-link text-xs mt-3 inline-flex items-center gap-1 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Platforms</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/platforms"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Platforms</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center p-2 shadow-xs shrink-0">
              <ProviderIcon provider={platform.slug || platform.name} className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-ink">{platform.name}</h1>
                <Badge variant="outline" className="text-[10px] border-hairline">
                  {platform.category.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-body mt-0.5">{platform.description || 'Cloud platform provider'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {platform.websiteUrl && (
              <a
                href={platform.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-[6px] border border-hairline bg-canvas hover:bg-canvas-soft text-xs font-mono flex items-center gap-1.5 text-body hover:text-ink transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Visit Site</span>
              </a>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditPlatformOpen(true)}
              className="gap-1.5 h-8 text-xs rounded-[6px] border-hairline"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Platform</span>
            </Button>

            <Button
              onClick={() => setAddAccountOpen(true)}
              size="sm"
              className="gap-1.5 h-8 text-xs rounded-[6px] bg-ink hover:bg-ink/90 text-on-primary shadow-vercel"
            >
              <Plus className="h-4 w-4" />
              <span>Add Account</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Registered Accounts ({platform.accounts?.length || 0})</h2>

        {(!platform.accounts || platform.accounts.length === 0) ? (
          <Card className="p-12 text-center border-dashed border-hairline bg-canvas">
            <Server className="h-8 w-8 mx-auto text-mute mb-2 stroke-1" />
            <p className="text-xs font-semibold text-ink">No accounts registered for {platform.name}</p>
            <p className="text-[11px] text-body mt-1">
              Add accounts (company, personal, or client logins) to connect projects.
            </p>
            <Button
              onClick={() => setAddAccountOpen(true)}
              size="sm"
              className="mt-3 h-8 text-xs rounded-[6px] bg-ink text-on-primary"
            >
              Add First Account
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {platform.accounts.map((acc: any) => (
              <Card key={acc.id} className="p-5 space-y-4 border-hairline bg-canvas shadow-vercel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{acc.name}</h3>
                      <span className="font-mono text-xs text-mute">({acc.loginIdentifier})</span>
                    </div>
                    {acc.notes && <p className="text-xs text-body mt-1">{acc.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 rounded-[6px] border-hairline"
                      onClick={() => {
                        setSelectedAccountForEdit(acc);
                        setEditAccountOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit Account</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 rounded-[6px] border-hairline"
                      onClick={() => {
                        setTargetAccountId(acc.id);
                        setAddCredOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Credential</span>
                    </Button>

                    {acc.accountUrl && (
                      <a
                        href={acc.accountUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-[6px] border border-hairline hover:bg-canvas-soft text-body hover:text-ink transition-colors"
                        title="Open account console"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Connected Projects */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-body" />
                    Connected Projects ({acc.projectLinks?.length || 0})
                  </span>

                  {(!acc.projectLinks || acc.projectLinks.length === 0) ? (
                    <p className="text-[11px] text-body">
                      This account is not yet connected to any project.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {acc.projectLinks.map((link: any) => (
                        <Link
                          key={link.id}
                          href={`/projects/${link.project?.id}?tab=platforms`}
                          className="px-2.5 py-1 rounded-[6px] border border-hairline bg-canvas-soft hover:bg-canvas hover:border-hairline-strong text-xs font-mono text-ink transition-colors flex items-center gap-1.5"
                        >
                          <span>{link.project?.name}</span>
                          {link.resourceName && (
                            <span className="text-mute font-normal text-[10px]">
                              ({link.resourceName})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account Credentials */}
                {acc.credentials && acc.credentials.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-hairline">
                    <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-body" />
                      Stored Credentials ({acc.credentials.length})
                    </span>

                    <div className="space-y-2">
                      {acc.credentials.map((cred: any) => (
                        <div
                          key={cred.id}
                          className="p-3 rounded-[6px] border border-hairline bg-canvas-soft text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink">{cred.name}</span>
                            <Badge variant="outline" className="font-mono text-[10px] border-hairline">
                              {cred.type}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            {cred.fields?.map((f: any) => (
                              <div key={f.id} className="flex items-center gap-2">
                                <span className="text-mute font-mono text-[11px] w-24 shrink-0">
                                  {f.name}:
                                </span>
                                {f.isSensitive ? (
                                  <SecretField value={f.value} isSensitive={true} />
                                ) : (
                                  <span className="font-mono text-ink">{f.value}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Platform Modal */}
      <PlatformEditModal
        open={editPlatformOpen}
        onOpenChange={setEditPlatformOpen}
        platform={platform}
        onSuccess={fetchPlatform}
      />

      {/* Edit Platform Account Modal */}
      <PlatformAccountEditModal
        open={editAccountOpen}
        onOpenChange={setEditAccountOpen}
        account={selectedAccountForEdit}
        onSuccess={fetchPlatform}
      />

      {/* Add Account Modal */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent onClose={() => setAddAccountOpen(false)}>
          <form onSubmit={handleAddAccount}>
            <DialogHeader>
              <DialogTitle>Add {platform.name} Account</DialogTitle>
              <DialogDescription>
                Register an account login or tenant identity for {platform.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Account Friendly Name *</label>
                <Input
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. Acme Corp Master, Dev Vercel"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Login Identifier / Email *</label>
                <Input
                  value={accLogin}
                  onChange={(e) => setAccLogin(e.target.value)}
                  placeholder="dev@acme.com or username"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Dashboard URL (optional)</label>
                <Input
                  mono
                  value={accUrl}
                  onChange={(e) => setAccUrl(e.target.value)}
                  placeholder="https://vercel.com/acme"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Notes</label>
                <Input
                  value={accNotes}
                  onChange={(e) => setAccNotes(e.target.value)}
                  placeholder="Billing contact, 2FA notes, etc."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddAccountOpen(false)}
                className="h-8 text-xs rounded-[6px]"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs rounded-[6px] bg-ink text-on-primary">
                Add Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Account Credential Modal */}
      <Dialog open={addCredOpen} onOpenChange={setAddCredOpen}>
        <DialogContent onClose={() => setAddCredOpen(false)}>
          <form onSubmit={handleAddAccountCredential}>
            <DialogHeader>
              <DialogTitle>Add Account Credential</DialogTitle>
              <DialogDescription>
                Save tokens, keys, or passwords associated with this account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Credential Name *</label>
                <Input
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                  placeholder="Personal Access Token, Deploy Key"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Type</label>
                <CustomSelect
                  value={credType}
                  onChange={(val) => handleCredTypeChange(val)}
                  options={[
                    { value: 'API_KEY', label: 'API Key / Token' },
                    { value: 'LOGIN', label: 'Login (Username & Password)' },
                    { value: 'SSH', label: 'SSH Key' },
                    { value: 'TOKEN', label: 'Access Token' },
                    { value: 'CUSTOM', label: 'Custom' },
                  ]}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-hairline">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Credential Fields</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      setCredFields([
                        ...credFields,
                        { name: 'secretKey', value: '', type: 'token', isSensitive: true },
                      ])
                    }
                  >
                    + Add Field
                  </Button>
                </div>

                {credFields.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Field Name"
                      value={f.name}
                      onChange={(e) => {
                        const copy = [...credFields];
                        copy[i].name = e.target.value;
                        setCredFields(copy);
                      }}
                      className="w-1/3 text-xs"
                    />
                    <Input
                      placeholder="Field Value"
                      value={f.value}
                      onChange={(e) => {
                        const copy = [...credFields];
                        copy[i].value = e.target.value;
                        setCredFields(copy);
                      }}
                      className="flex-1 text-xs"
                    />
                    {credFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setCredFields(credFields.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCredOpen(false)}
                className="h-8 text-xs rounded-[6px]"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs rounded-[6px] bg-ink text-on-primary">
                Save Credential
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
