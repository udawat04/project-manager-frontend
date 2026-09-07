'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  KeyRound,
  Search,
  FolderKanban,
  Server,
  Lock,
  Copy,
  Check,
  Plus,
  Layers,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/ui/custom-select';
import { CardSkeleton } from '@/components/loading';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { SecretField } from '@/components/features/SecretField';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function GlobalCredentialsPage() {
  const [credentials, setCredentials] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [platformAccounts, setPlatformAccounts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [scopeTab, setScopeTab] = React.useState<'ALL' | 'PROJECT' | 'PLATFORM'>('ALL');
  const [selectedScopeFilter, setSelectedScopeFilter] = React.useState<string>('ALL');
  const [copyingId, setCopyingId] = React.useState<string | null>(null);

  // Add Credential Modal
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [credScope, setCredScope] = React.useState<'PROJECT' | 'PLATFORM_ACCOUNT'>('PROJECT');
  const [targetProjectId, setTargetProjectId] = React.useState('');
  const [targetAccountId, setTargetAccountId] = React.useState('');
  const [credName, setCredName] = React.useState('');
  const [credType, setCredType] = React.useState('LOGIN');
  const [credFields, setCredFields] = React.useState<any[]>([
    { name: 'username_or_email', value: '', type: 'text', isSensitive: false },
    { name: 'password', value: '', type: 'password', isSensitive: true },
  ]);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const [credRes, projRes, accRes] = await Promise.all([
        api.getCredentials({
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          search: search.trim() || undefined,
        }),
        api.getProjects(),
        api.getPlatformAccounts(),
      ]);
      setCredentials(credRes.credentials);
      setProjects(projRes.projects);
      setPlatformAccounts(accRes.accounts);

      if (projRes.projects.length > 0 && !targetProjectId) {
        setTargetProjectId(projRes.projects[0].id);
      }
      if (accRes.accounts.length > 0 && !targetAccountId) {
        setTargetAccountId(accRes.accounts[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCredentials();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCredentials();
  };

  const handleCredTypeChange = (newType: string) => {
    setCredType(newType);
    if (newType === 'LOGIN') {
      setCredFields([
        { name: 'username_or_email', value: '', type: 'text', isSensitive: false },
        { name: 'password', value: '', type: 'password', isSensitive: true },
      ]);
    } else if (newType === 'API_KEY') {
      setCredFields([
        { name: 'apiKey', value: '', type: 'token', isSensitive: true },
      ]);
    } else if (newType === 'DATABASE') {
      setCredFields([
        { name: 'host', value: '', type: 'text', isSensitive: false },
        { name: 'port', value: '5432', type: 'text', isSensitive: false },
        { name: 'database', value: '', type: 'text', isSensitive: false },
        { name: 'username', value: '', type: 'text', isSensitive: false },
        { name: 'password', value: '', type: 'password', isSensitive: true },
      ]);
    } else if (newType === 'SSH') {
      setCredFields([
        { name: 'privateKey', value: '', type: 'password', isSensitive: true },
        { name: 'passphrase', value: '', type: 'password', isSensitive: true },
      ]);
    } else if (newType === 'TOKEN') {
      setCredFields([
        { name: 'token', value: '', type: 'token', isSensitive: true },
      ]);
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credName.trim()) {
      toast.error('Credential name is required');
      return;
    }

    if (credScope === 'PROJECT' && !targetProjectId) {
      toast.error('Please select a project');
      return;
    }
    if (credScope === 'PLATFORM_ACCOUNT' && !targetAccountId) {
      toast.error('Please select a platform account');
      return;
    }

    setSubmitting(true);
    try {
      await api.createCredential({
        name: credName.trim(),
        type: credType,
        projectId: credScope === 'PROJECT' ? targetProjectId : undefined,
        platformAccountId: credScope === 'PLATFORM_ACCOUNT' ? targetAccountId : undefined,
        fields: credFields,
      });

      toast.success('Credential created successfully');
      setAddModalOpen(false);
      setCredName('');
      handleCredTypeChange('LOGIN');
      fetchCredentials();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create credential');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentialSet = async (cred: any) => {
    setCopyingId(cred.id);
    try {
      const res = await api.revealCredential(cred.id);
      const lines = res.fields.map((f: any) => `${f.name}=${f.value}`);
      const text = lines.join('\n');
      await navigator.clipboard.writeText(text);
      await api.logCredentialCopy(cred.id, 'ALL_FIELDS');
      toast.success(`Copied all fields for "${cred.name}" to clipboard`);
    } catch {
      toast.error('Failed to copy credential fields');
    } finally {
      setTimeout(() => setCopyingId(null), 1500);
    }
  };

  const types = ['ALL', 'API_KEY', 'LOGIN', 'DATABASE', 'SSH', 'TOKEN', 'CUSTOM'];

  // Filter credentials by Scope (All vs Project-scoped vs Platform-scoped)
  const scopedCredentials = React.useMemo(() => {
    let filtered = credentials;
    if (scopeTab === 'PROJECT') {
      filtered = filtered.filter((c) => !!c.project);
      if (selectedScopeFilter !== 'ALL') {
        filtered = filtered.filter((c) => c.project?.id === selectedScopeFilter);
      }
    } else if (scopeTab === 'PLATFORM') {
      filtered = filtered.filter((c) => !!c.platformAccount);
      if (selectedScopeFilter !== 'ALL') {
        filtered = filtered.filter((c) => c.platformAccount?.id === selectedScopeFilter);
      }
    }
    return filtered;
  }, [credentials, scopeTab, selectedScopeFilter]);

  const projectCount = credentials.filter((c) => !!c.project).length;
  const platformCount = credentials.filter((c) => !!c.platformAccount).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Encrypted Credentials Vault</span>
            <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organized secrets directory. Switch between Project credentials and Platform Account logins.
          </p>
        </div>

        <Button
          variant="blue"
          onClick={() => setAddModalOpen(true)}
          className="gap-1.5 h-9 px-3.5 rounded-[6px] shadow-sm font-semibold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Credential</span>
        </Button>
      </div>

      {/* Scope Switcher Tabs: All vs Project-wise vs Platform-wise */}
      <div className="flex items-center justify-between border-b border-border pb-2 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setScopeTab('ALL');
              setSelectedScopeFilter('ALL');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeTab === 'ALL'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            style={scopeTab === 'ALL' ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Credentials</span>
            <Badge variant="secondary" className="font-mono text-[10px] ml-1">
              {credentials.length}
            </Badge>
          </button>

          <button
            onClick={() => {
              setScopeTab('PROJECT');
              setSelectedScopeFilter('ALL');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeTab === 'PROJECT'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            style={scopeTab === 'PROJECT' ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
          >
            <FolderKanban className="h-3.5 w-3.5 text-blue-500" />
            <span>Project Credentials</span>
            <Badge variant="secondary" className="font-mono text-[10px] ml-1">
              {projectCount}
            </Badge>
          </button>

          <button
            onClick={() => {
              setScopeTab('PLATFORM');
              setSelectedScopeFilter('ALL');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeTab === 'PLATFORM'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            style={scopeTab === 'PLATFORM' ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
          >
            <Server className="h-3.5 w-3.5 text-purple-500" />
            <span>Platform Account Credentials</span>
            <Badge variant="secondary" className="font-mono text-[10px] ml-1">
              {platformCount}
            </Badge>
          </button>
        </div>

        {/* Dynamic Secondary Filter based on Scope */}
        {scopeTab === 'PROJECT' && (
          <div className="w-48">
            <CustomSelect
              value={selectedScopeFilter}
              onChange={setSelectedScopeFilter}
              options={[
                { value: 'ALL', label: 'All Projects' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
        )}

        {scopeTab === 'PLATFORM' && (
          <div className="w-56">
            <CustomSelect
              value={selectedScopeFilter}
              onChange={setSelectedScopeFilter}
              options={[
                { value: 'ALL', label: 'All Platform Accounts' },
                ...platformAccounts.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.platform?.name})`,
                })),
              ]}
            />
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 p-3 rounded-lg border border-border bg-card shadow-vercel">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search credentials by name, notes..."
            className="pl-9 h-9 text-xs border-transparent bg-muted/40 focus:bg-card focus:border-border"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {types.map((t) => {
            const isSelected = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                    : 'bg-muted/60 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                style={isSelected ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
              >
                {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Credentials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : scopedCredentials.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border bg-card">
          <KeyRound className="h-8 w-8 mx-auto text-muted-foreground mb-2 stroke-1" />
          <p className="text-xs font-semibold text-foreground">No credentials found in this view</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {scopeTab === 'PROJECT'
              ? 'Add credentials directly scoped to one of your projects.'
              : scopeTab === 'PLATFORM'
              ? 'Add login credentials or API keys scoped to external platform accounts.'
              : 'Try clearing your search query or switching scope tabs.'}
          </p>
          <Button
            size="sm"
            variant="blue"
            onClick={() => setAddModalOpen(true)}
            className="mt-4 h-8 text-xs font-semibold"
          >
            Add Credential
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scopedCredentials.map((cred) => {
            const isProjectScoped = !!cred.project;
            const scopeName = isProjectScoped
              ? cred.project.name
              : cred.platformAccount?.name;

            return (
              <Card
                key={cred.id}
                className="p-5 space-y-4 border-border bg-card shadow-vercel hover:border-border/80 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{cred.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-mono border-border">
                        {cred.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        {isProjectScoped ? (
                          <>
                            <FolderKanban className="h-3 w-3 text-blue-500 shrink-0" />
                            <Link
                              href={`/projects/${cred.project.id}?tab=credentials`}
                              className="hover:underline text-foreground font-medium"
                            >
                              {scopeName}
                            </Link>
                          </>
                        ) : (
                          <>
                            <ProviderIcon
                              provider={cred.platformAccount?.platform?.slug || cred.platformAccount?.platform?.name || ''}
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <span>{scopeName} ({cred.platformAccount?.platform?.name})</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCredentialSet(cred)}
                    disabled={copyingId === cred.id}
                    className="h-7 px-2.5 text-[11px] gap-1 rounded-[6px] border-border font-mono"
                  >
                    {copyingId === cred.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy All</span>
                      </>
                    )}
                  </Button>
                </div>

                {cred.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{cred.notes}</p>
                )}

                <div className="space-y-2 pt-2 border-t border-border">
                  {cred.fields?.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-2 rounded bg-muted/40 border border-border flex items-center justify-between text-xs gap-3"
                    >
                      <span className="font-mono text-muted-foreground text-[11px] shrink-0 font-medium">
                        {f.name}:
                      </span>
                      <SecretField
                        isSensitive={f.isSensitive}
                        onReveal={async () => {
                          const res = await api.revealCredential(cred.id);
                          const found = res.fields.find((field: any) => field.id === f.id);
                          return found ? found.value : '';
                        }}
                        onCopy={() => api.logCredentialCopy(cred.id, f.name)}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Credential Modal (Project vs Platform Account scoped) */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-xl" onClose={() => setAddModalOpen(false)}>
          <form onSubmit={handleCreateCredential}>
            <DialogHeader>
              <DialogTitle>Add Vault Credential</DialogTitle>
              <DialogDescription>
                Store login credentials, tokens, or database keys scoped by project or platform account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
              {/* Scope Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Credential Scope *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCredScope('PROJECT')}
                    className={`p-2.5 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      credScope === 'PROJECT'
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FolderKanban className="h-4 w-4 text-blue-500" />
                    <span>Project Credential</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCredScope('PLATFORM_ACCOUNT')}
                    className={`p-2.5 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      credScope === 'PLATFORM_ACCOUNT'
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Server className="h-4 w-4 text-purple-500" />
                    <span>Platform Account</span>
                  </button>
                </div>
              </div>

              {/* Target Project or Account */}
              {credScope === 'PROJECT' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Target Project *</label>
                  <CustomSelect
                    value={targetProjectId}
                    onChange={setTargetProjectId}
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder="Select project..."
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Target Platform Account *</label>
                  <CustomSelect
                    value={targetAccountId}
                    onChange={setTargetAccountId}
                    options={platformAccounts.map((a) => ({
                      value: a.id,
                      label: `${a.name} (${a.platform?.name || 'Platform'})`,
                    }))}
                    placeholder="Select platform account..."
                  />
                </div>
              )}

              {/* Credential Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Credential Name *</label>
                <Input
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                  placeholder="e.g. Admin Login, Stripe Secret Key, Production Postgres"
                  required
                />
              </div>

              {/* Credential Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Credential Type *</label>
                <CustomSelect
                  value={credType}
                  onChange={handleCredTypeChange}
                  options={[
                    { value: 'LOGIN', label: 'Login (Username/Email & Password)' },
                    { value: 'API_KEY', label: 'API Key / Secret Token' },
                    { value: 'DATABASE', label: 'Database Connection Credentials' },
                    { value: 'SSH', label: 'SSH Keypair / Certificate' },
                    { value: 'TOKEN', label: 'Access Token' },
                    { value: 'CUSTOM', label: 'Custom Fields' },
                  ]}
                />
              </div>

              {/* Dynamic Credential Fields */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-foreground">Credential Fields</span>
                    <p className="text-[11px] text-muted-foreground">
                      Fields auto-populate based on selected credential type.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] rounded-[4px]"
                    onClick={() =>
                      setCredFields([
                        ...credFields,
                        { name: 'customField', value: '', type: 'text', isSensitive: true },
                      ])
                    }
                  >
                    + Add Field
                  </Button>
                </div>

                <div className="space-y-2">
                  {credFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        mono
                        value={field.name}
                        onChange={(e) => {
                          const copy = [...credFields];
                          copy[idx].name = e.target.value;
                          setCredFields(copy);
                        }}
                        placeholder="Field Name"
                        className="w-1/3 text-xs"
                      />
                      <Input
                        type={field.isSensitive ? 'password' : 'text'}
                        value={field.value}
                        onChange={(e) => {
                          const copy = [...credFields];
                          copy[idx].value = e.target.value;
                          setCredFields(copy);
                        }}
                        placeholder="Field Value"
                        className="flex-1 text-xs"
                      />
                      {credFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCredFields(credFields.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive p-1 rounded cursor-pointer"
                          title="Remove field"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
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
                {submitting ? 'Saving...' : 'Save Credential'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
