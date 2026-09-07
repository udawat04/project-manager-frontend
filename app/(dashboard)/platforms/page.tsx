'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Server,
  Plus,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldAlert,
  Check,
  CheckCircle2,
  BookmarkPlus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CustomSelect } from '@/components/ui/custom-select';
import { CardSkeleton } from '@/components/loading';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function PlatformsPage() {
  const [platforms, setPlatforms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'MY_PLATFORMS' | 'CATALOG'>('MY_PLATFORMS');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [search, setSearch] = React.useState('');

  // Added platforms tracking (saved in localStorage, plus any platform with accounts)
  const [addedPlatformIds, setAddedPlatformIds] = React.useState<string[]>([]);

  // Add Account Modal
  const [addAccountOpen, setAddAccountOpen] = React.useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = React.useState('');
  const [accName, setAccName] = React.useState('');
  const [accLogin, setAccLogin] = React.useState('');
  const [accUrl, setAccUrl] = React.useState('');
  const [accNotes, setAccNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Add Platform Modal (Catalog selector)
  const [addPlatformOpen, setAddPlatformOpen] = React.useState(false);
  const [catalogSearch, setCatalogSearch] = React.useState('');
  const [customName, setCustomName] = React.useState('');
  const [customCategory, setCustomCategory] = React.useState('HOSTING');
  const [customWebsite, setCustomWebsite] = React.useState('');
  const [customDescription, setCustomDescription] = React.useState('');
  const [creatingCustom, setCreatingCustom] = React.useState(false);

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const res = await api.getPlatforms({
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: search.trim() || undefined,
      });
      setPlatforms(res.platforms);

      // Load stored added platforms
      const stored = localStorage.getItem('projectvault_added_platforms');
      let initialAdded: string[] = [];
      if (stored) {
        try {
          initialAdded = JSON.parse(stored);
        } catch {
          initialAdded = [];
        }
      }

      // Platforms with accounts are automatically considered added
      const withAccounts = res.platforms.filter((p: any) => p.accountCount > 0).map((p: any) => p.id);
      const combined = Array.from(new Set([...initialAdded, ...withAccounts]));

      // If user had nothing saved and nothing with accounts, default to popular platforms
      if (combined.length === 0 && res.platforms.length > 0) {
        const defaults = res.platforms
          .filter((p: any) => ['vercel', 'supabase', 'cloudflare', 'github'].includes(p.slug))
          .map((p: any) => p.id);
        setAddedPlatformIds(defaults);
        localStorage.setItem('projectvault_added_platforms', JSON.stringify(defaults));
      } else {
        setAddedPlatformIds(combined);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlatforms();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlatforms();
  };

  // Add platform to workspace
  const handleAddPlatformToWorkspace = (platformId: string, platformName: string) => {
    const updated = Array.from(new Set([...addedPlatformIds, platformId]));
    setAddedPlatformIds(updated);
    localStorage.setItem('projectvault_added_platforms', JSON.stringify(updated));
    toast.success(`"${platformName}" added to your workspace platforms!`);
  };

  // Remove platform from workspace
  const handleRemovePlatformFromWorkspace = (platformId: string, platformName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const plat = platforms.find((p) => p.id === platformId);
    if (plat && plat.accountCount > 0) {
      toast.error(`Cannot remove "${platformName}" because it has ${plat.accountCount} registered accounts. Delete accounts first.`);
      return;
    }
    const updated = addedPlatformIds.filter((id) => id !== platformId);
    setAddedPlatformIds(updated);
    localStorage.setItem('projectvault_added_platforms', JSON.stringify(updated));
    toast.info(`"${platformName}" removed from your workspace`);
  };

  // Create custom platform
  const handleCreateCustomPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      toast.error('Platform name is required');
      return;
    }
    setCreatingCustom(true);
    try {
      const res = await api.apiRequest<{ platform: any }>('/platforms', {
        method: 'POST',
        body: JSON.stringify({
          name: customName.trim(),
          category: customCategory,
          websiteUrl: customWebsite.trim() || undefined,
          description: customDescription.trim() || undefined,
        }),
      });

      toast.success(`Platform "${customName}" created and added!`);
      handleAddPlatformToWorkspace(res.platform.id, res.platform.name);
      setCustomName('');
      setCustomWebsite('');
      setCustomDescription('');
      setAddPlatformOpen(false);
      fetchPlatforms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create custom platform');
    } finally {
      setCreatingCustom(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatformId || !accName.trim() || !accLogin.trim()) {
      toast.error('Platform, Account Name, and Login Identifier are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.createPlatformAccount({
        platformId: selectedPlatformId,
        name: accName.trim(),
        loginIdentifier: accLogin.trim(),
        accountUrl: accUrl.trim() || undefined,
        notes: accNotes.trim() || undefined,
      });

      toast.success('Platform account registered successfully');
      setAddAccountOpen(false);
      setAccName('');
      setAccLogin('');
      setAccUrl('');
      setAccNotes('');
      fetchPlatforms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add platform account');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    'ALL',
    'HOSTING',
    'DATABASE',
    'DNS_CDN',
    'SOURCE_CONTROL',
    'STORAGE',
    'PAYMENTS',
  ];

  // User's added platforms (platforms explicitly added OR with accounts)
  const myAddedPlatforms = React.useMemo(() => {
    return platforms.filter((p) => addedPlatformIds.includes(p.id) || p.accountCount > 0);
  }, [platforms, addedPlatformIds]);

  // Options for Account Creation: ONLY SHOW USER'S ADDED PLATFORMS
  const addedPlatformOptions = React.useMemo(() => {
    return myAddedPlatforms.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.category.replace('_', ' ')})`,
    }));
  }, [myAddedPlatforms]);

  // When opening add account modal, default to first added platform
  React.useEffect(() => {
    if (myAddedPlatforms.length > 0 && !selectedPlatformId) {
      setSelectedPlatformId(myAddedPlatforms[0].id);
    }
  }, [myAddedPlatforms, selectedPlatformId]);

  // Filtered platforms for display
  const displayedPlatforms = activeTab === 'MY_PLATFORMS' ? myAddedPlatforms : platforms;

  // Filtered catalog platforms for the "Add Platform" modal
  const filteredCatalog = React.useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return platforms.filter((p) => {
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
    });
  }, [platforms, catalogSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platforms & Multi-Accounts</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Connect only the cloud providers you use. Manage company, client, and personal accounts with isolated access.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Platform Button */}
          <Button
            variant="blue"
            onClick={() => setAddPlatformOpen(true)}
            className="gap-1.5 h-9 px-3.5 rounded-[6px] shadow-sm font-semibold"
          >
            <BookmarkPlus className="h-4 w-4" />
            <span>Add Platform</span>
          </Button>

          {/* Add Account Button */}
          <Button
            onClick={() => {
              if (myAddedPlatforms.length === 0) {
                toast.info('Please add a platform to your workspace first');
                setAddPlatformOpen(true);
              } else {
                setAddAccountOpen(true);
              }
            }}
            className="gap-1.5 h-9 px-3.5 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </Button>
        </div>
      </div>

      {/* Scope Navigation Tabs: My Platforms vs All Catalog */}
      <div className="flex items-center justify-between border-b border-border pb-2 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('MY_PLATFORMS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MY_PLATFORMS'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            style={activeTab === 'MY_PLATFORMS' ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
          >
            <Server className="h-3.5 w-3.5 text-primary" />
            <span>My Platforms</span>
            <Badge variant="secondary" className="font-mono text-[10px] ml-1">
              {myAddedPlatforms.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CATALOG'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            style={activeTab === 'CATALOG' ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
          >
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Provider Catalog</span>
            <Badge variant="outline" className="font-mono text-[10px] ml-1">
              {platforms.length}
            </Badge>
          </button>
        </div>

        {activeTab === 'MY_PLATFORMS' && (
          <span className="text-[11px] text-muted-foreground">
            Showing only platforms active in your workspace.
          </span>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 p-3 rounded-lg border border-border bg-card shadow-vercel">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search platforms (Vercel, Supabase, Cloudflare, AWS, etc.)..."
            className="pl-9 h-9 text-xs border-transparent bg-muted/40 focus:bg-card focus:border-border"
          />
        </form>

        {/* Clean Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                    : 'bg-muted/60 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                style={isSelected ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
              >
                {cat === 'ALL' ? 'All Categories' : cat.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Platforms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : displayedPlatforms.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border bg-card">
          <Server className="h-10 w-10 mx-auto text-muted-foreground mb-3 stroke-1" />
          <h3 className="text-sm font-semibold text-foreground">
            {activeTab === 'MY_PLATFORMS'
              ? 'No platforms added to your workspace yet'
              : 'No platforms match your criteria'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === 'MY_PLATFORMS'
              ? 'Add only the cloud providers you actually use (e.g. Vercel, Supabase, Hostinger) to keep your workspace clean.'
              : 'Try clearing your search query or selecting another category.'}
          </p>
          {activeTab === 'MY_PLATFORMS' && (
            <Button
              onClick={() => setAddPlatformOpen(true)}
              variant="blue"
              className="mt-4 h-8 text-xs font-semibold gap-1.5"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Browse & Add Platforms</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPlatforms.map((plat) => {
            const isAdded = addedPlatformIds.includes(plat.id) || plat.accountCount > 0;
            return (
              <div key={plat.id} className="relative group">
                <Link href={`/platforms/${plat.id}`} className="block h-full">
                  <Card className="h-full hover:border-border hover:shadow-vercel transition-all cursor-pointer flex flex-col justify-between border-border bg-card shadow-vercel">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-md bg-muted/60 border border-border flex items-center justify-center p-1.5 shrink-0">
                            <ProviderIcon provider={plat.slug || plat.name} className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {plat.name}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[10px] border-border">
                                {plat.category.replace('_', ' ')}
                              </Badge>
                              {isAdded && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2">
                        {plat.description || 'Cloud infrastructure provider'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3">
                      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>
                          <strong className="text-foreground font-semibold">{plat.accountCount}</strong>{' '}
                          {plat.accountCount === 1 ? 'Account' : 'Accounts'}
                        </span>
                        <span>•</span>
                        <span>
                          Used by <strong className="text-foreground font-semibold">{plat.projectCount}</strong>{' '}
                          {plat.projectCount === 1 ? 'Project' : 'Projects'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Quick Add/Remove toggle in Catalog mode */}
                {activeTab === 'CATALOG' && (
                  <div className="absolute bottom-3 right-3 z-10">
                    {isAdded ? (
                      <button
                        type="button"
                        onClick={(e) => handleRemovePlatformFromWorkspace(plat.id, plat.name, e)}
                        className="px-2 py-1 rounded-[4px] bg-muted/80 hover:bg-red-500/15 hover:text-red-600 text-muted-foreground text-[10px] font-medium border border-border transition-colors flex items-center gap-1 cursor-pointer"
                        title="Deactivate from workspace"
                      >
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Added</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddPlatformToWorkspace(plat.id, plat.name);
                        }}
                        className="px-2.5 py-1 rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Platform to Workspace Modal */}
      <Dialog open={addPlatformOpen} onOpenChange={setAddPlatformOpen}>
        <DialogContent className="max-w-xl" onClose={() => setAddPlatformOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Platform to Workspace</DialogTitle>
            <DialogDescription>
              Select from existing cloud provider templates or register a custom provider.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Search catalog */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search catalog (e.g. Vercel, Supabase, Cloudflare, AWS, Stripe)..."
                className="pl-8 h-8 text-xs"
              />
            </div>

            {/* Provider Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Available Providers</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-border rounded-md bg-muted/20">
                {filteredCatalog.map((plat) => {
                  const isAdded = addedPlatformIds.includes(plat.id) || plat.accountCount > 0;
                  return (
                    <div
                      key={plat.id}
                      onClick={() => {
                        if (!isAdded) {
                          handleAddPlatformToWorkspace(plat.id, plat.name);
                        }
                      }}
                      className={`p-2.5 rounded-[6px] border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isAdded
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-foreground cursor-default'
                          : 'border-border bg-card hover:border-primary/60 hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center p-1 shrink-0">
                          <ProviderIcon provider={plat.slug || plat.name} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate leading-tight">{plat.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{plat.category.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {isAdded ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Check className="h-3 w-3" />
                          Added
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-primary shrink-0 hover:underline">
                          + Add
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Register Custom Platform Section */}
            <form onSubmit={handleCreateCustomPlatform} className="space-y-3 pt-3 border-t border-border">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Or Register Custom Provider
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Platform Name *</label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Hetzner, Upstash"
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Category</label>
                  <CustomSelect
                    value={customCategory}
                    onChange={(val) => setCustomCategory(val)}
                    options={[
                      { value: 'HOSTING', label: 'Hosting & Compute' },
                      { value: 'DATABASE', label: 'Database & Storage' },
                      { value: 'DNS_CDN', label: 'DNS & CDN' },
                      { value: 'SOURCE_CONTROL', label: 'Source Control' },
                      { value: 'STORAGE', label: 'Object Storage' },
                      { value: 'PAYMENTS', label: 'Payments' },
                      { value: 'OTHER', label: 'Other' },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Website URL</label>
                <Input
                  mono
                  value={customWebsite}
                  onChange={(e) => setCustomWebsite(e.target.value)}
                  placeholder="https://provider.com"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={creatingCustom}
                  size="sm"
                  className="h-8 text-xs font-semibold bg-primary text-primary-foreground"
                >
                  {creatingCustom ? 'Creating...' : 'Register & Add Platform'}
                </Button>
              </div>
            </form>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddPlatformOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Platform Account Modal (Only shows added platforms!) */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent onClose={() => setAddAccountOpen(false)}>
          <form onSubmit={handleAddAccount}>
            <DialogHeader>
              <DialogTitle>Register Platform Account</DialogTitle>
              <DialogDescription>
                Add a new account for one of your workspace platforms (e.g. &quot;Personal Vercel&quot; or &quot;Client Cloudflare&quot;).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Platform *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAddAccountOpen(false);
                      setAddPlatformOpen(true);
                    }}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    + Add other platform
                  </button>
                </div>
                <CustomSelect
                  value={selectedPlatformId}
                  onChange={(val) => setSelectedPlatformId(val)}
                  options={addedPlatformOptions}
                  placeholder="Select one of your added platforms..."
                />
                {addedPlatformOptions.length === 0 && (
                  <p className="text-[11px] text-destructive">
                    No platforms added yet. Click &quot;+ Add other platform&quot; first.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Account Friendly Name *</label>
                <Input
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. Company Production, Client Vercel"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Login Identifier / Email *</label>
                <Input
                  value={accLogin}
                  onChange={(e) => setAccLogin(e.target.value)}
                  placeholder="company@example.com or admin_user"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Account Dashboard URL (optional)</label>
                <Input
                  mono
                  value={accUrl}
                  onChange={(e) => setAccUrl(e.target.value)}
                  placeholder="https://vercel.com/my-team"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Notes</label>
                <Input
                  value={accNotes}
                  onChange={(e) => setAccNotes(e.target.value)}
                  placeholder="Master enterprise production account"
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
              <Button
                type="submit"
                disabled={submitting || addedPlatformOptions.length === 0}
                className="h-8 text-xs rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {submitting ? 'Saving...' : 'Save Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
