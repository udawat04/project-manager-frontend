'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  FolderKanban,
  ExternalLink,
  Users,
  Layers,
  Server,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CustomSelect } from '@/components/ui/custom-select';
import { CardSkeleton } from '@/components/loading';
import { TechnologyCombobox } from '@/components/ui/technology-combobox';
import { TechnologyIcon } from '@/components/ui/technology-icon';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { MemberCombobox } from '@/components/ui/member-combobox';
import {
  FRONTEND_TECHNOLOGIES,
  BACKEND_TECHNOLOGIES,
  DATABASE_TECHNOLOGIES,
  WORDPRESS_BUILDERS_THEMES,
  WORDPRESS_PLUGINS,
  WORDPRESS_SERVERS_DATABASES,
} from '@/lib/technologies';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState<string>('');

  // Create Project Modal state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);

  // Form Fields
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [type, setType] = React.useState<string>('CUSTOM');
  const [status, setStatus] = React.useState<string>('DEVELOPMENT');
  const [repositoryUrl, setRepositoryUrl] = React.useState('');
  const [productionUrl, setProductionUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Tech stack fields (for Custom)
  const [frontendTech, setFrontendTech] = React.useState<string[]>(['Next.js', 'React', 'Tailwind CSS']);
  const [backendTech, setBackendTech] = React.useState<string[]>(['Node.js', 'Express.js']);
  const [databaseTech, setDatabaseTech] = React.useState<string[]>(['PostgreSQL', 'Prisma']);

  // WordPress fields
  const [wpWebsiteUrl, setWpWebsiteUrl] = React.useState('');
  const [wpAdminUrl, setWpAdminUrl] = React.useState('');
  const [wpHosting, setWpHosting] = React.useState('');
  const [wpDomain, setWpDomain] = React.useState('');
  const [wpBuilders, setWpBuilders] = React.useState<string[]>(['Elementor']);
  const [wpPlugins, setWpPlugins] = React.useState<string[]>(['WooCommerce', 'Advanced Custom Fields (ACF)']);
  const [wpDbServer, setWpDbServer] = React.useState<string[]>(['MySQL 8.0', 'Redis Object Cache', 'PHP 8.2']);

  // Members selection
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);


  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setProjects(res.projects);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getAllUsers();
      // Filter out Master Admin so master admin is never shown or assigned in project creation
      const assignableUsers = (res.users || []).filter(
        (u: any) => !u.isMasterAdmin && u.role !== 'MASTER_ADMIN'
      );
      setAllUsers(assignableUsers);
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    fetchProjects();
  }, [typeFilter, statusFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const toggleMemberSelection = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setCreateLoading(true);
    try {
      let techStackObj: any = undefined;
      let wpConfigObj: any = undefined;

      if (type === 'CUSTOM') {
        techStackObj = {
          frontend: frontendTech,
          backend: backendTech,
          database: databaseTech,
        };
      } else if (type === 'WORDPRESS') {
        techStackObj = {
          frontend: wpBuilders,
          backend: wpPlugins,
          database: wpDbServer,
        };
        wpConfigObj = {
          websiteUrl: wpWebsiteUrl.trim() || undefined,
          adminUrl: wpAdminUrl.trim() || undefined,
          hostingProvider: wpHosting.trim() || undefined,
          domainProvider: wpDomain.trim() || undefined,
        };
      }

      await api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        status,
        repositoryUrl: type === 'WORDPRESS' ? undefined : repositoryUrl.trim() || undefined,
        productionUrl: type === 'WORDPRESS' ? wpWebsiteUrl.trim() || undefined : productionUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        techStack: techStackObj,
        wpConfig: wpConfigObj,
        assignedMemberIds: selectedMemberIds,
        initialMemberIds: selectedMemberIds,
      });

      toast.success(`Project "${name}" created successfully`);
      setCreateOpen(false);

      // Reset form
      setName('');
      setDescription('');
      setType('CUSTOM');
      setStatus('DEVELOPMENT');
      setRepositoryUrl('');
      setProductionUrl('');
      setNotes('');
      setSelectedMemberIds([]);

      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Projects</h1>
          <p className="text-xs text-body mt-1">
            Manage your applications, WordPress deployments, and service ecosystems.
          </p>
        </div>
        {user?.isMasterAdmin && (
          <Button
            onClick={() => {
              setSelectedMemberIds([]);
              setCreateOpen(true);
            }}
            className="gap-1.5 h-9 px-4 rounded-[6px] bg-ink hover:bg-ink/90 text-on-primary shadow-vercel"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar with Vercel Styling */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-lg border border-hairline bg-canvas shadow-vercel">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-mute" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, description..."
            className="pl-9 h-9 text-xs border-transparent bg-canvas-soft focus:bg-canvas focus:border-hairline"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-muted/70 border border-border p-1 rounded-full text-xs">
            {['ALL', 'CUSTOM', 'WORDPRESS', 'OTHER'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
                style={typeFilter === t ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' } : undefined}
              >
                {t === 'ALL' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted/70 border border-border p-1 rounded-full text-xs">
            {['ALL', 'PRODUCTION', 'DEVELOPMENT', 'STAGING'].map((s) => {
              const isSelected = statusFilter === s;
              let selectedClass = 'bg-card text-foreground font-semibold shadow-xs border border-border';
              if (isSelected && s === 'PRODUCTION') {
                selectedClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30 shadow-xs';
              } else if (isSelected && s === 'DEVELOPMENT') {
                selectedClass = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30 shadow-xs';
              } else if (isSelected && s === 'STAGING') {
                selectedClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30 shadow-xs';
              }

              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? selectedClass
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  {s === 'ALL' ? 'All Statuses' : s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Projects List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border bg-card">
          <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground mb-3 stroke-1" />
          <h3 className="text-sm font-semibold text-foreground">No projects found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Get started by creating your first project to organize your environments and credentials.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-4 gap-1.5 h-8 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const totalTasks = proj.tasks?.length || 0;
            const completedTasks = proj.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <Link key={proj.id} href={`/projects/${proj.id}`}>
              <Card className="h-full hover:border-border-hover hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group border border-border bg-card shadow-xs">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {proj.name}
                    </CardTitle>
                    <Badge
                      variant={
                        proj.status === 'PRODUCTION'
                          ? 'production'
                          : proj.status === 'STAGING'
                          ? 'staging'
                          : proj.status === 'DEVELOPMENT'
                          ? 'development'
                          : 'secondary'
                      }
                      className="text-[10px] uppercase font-mono"
                    >
                      {proj.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-body line-clamp-2 mt-1">
                    {proj.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3">
                  {/* Tech stack badges */}
                  {proj.techStack && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {proj.techStack.frontend?.slice(0, 2).map((t: string) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-canvas-soft border border-hairline text-[10px] font-mono text-body"
                        >
                          <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                          <span>{t}</span>
                        </span>
                      ))}
                      {proj.techStack.backend?.slice(0, 1).map((t: string) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-canvas-soft border border-hairline text-[10px] font-mono text-body"
                        >
                          <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                          <span>{t}</span>
                        </span>
                      ))}
                      {proj.techStack.database?.slice(0, 1).map((t: string) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-canvas-soft border border-hairline text-[10px] font-mono text-body"
                        >
                          <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* WordPress indicator */}
                  {proj.type === 'WORDPRESS' && proj.wpConfig && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-canvas-soft border border-hairline text-[10px] font-mono text-body">
                        <TechnologyIcon name="WordPress" className="h-3 w-3 shrink-0" />
                        <span>WordPress</span>
                      </span>
                      {proj.wpConfig.hostingProvider && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-canvas-soft border border-hairline text-[10px] font-mono text-body">
                          <ProviderIcon provider={proj.wpConfig.hostingProvider} className="h-3 w-3 shrink-0" />
                          <span>{proj.wpConfig.hostingProvider}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Task Progress Rollup */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-body">
                      <span className="font-medium text-ink flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        Tasks
                      </span>
                      <span>{completedTasks} / {totalTasks} ({progress}%)</span>
                    </div>
                    <div className="w-full bg-canvas-soft rounded-full h-1.5 border border-hairline overflow-hidden">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary counts */}
                  <div className="flex items-center justify-between text-xs text-body pt-3 border-t border-hairline font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-canvas-soft border border-hairline text-[10px] font-medium text-ink">
                      {proj.type}
                    </span>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span>{proj._count?.environments ?? proj.environments?.length ?? 0} envs</span>
                      <span>•</span>
                      <span>{proj._count?.platforms ?? proj.platforms?.length ?? 0} platforms</span>
                      <span>•</span>
                      <span>{proj._count?.members ?? proj.members?.length ?? 0} members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)} className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <form onSubmit={handleCreateProject} className="flex flex-col max-h-[88vh]">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Define your project and configure its technology stack, team members, or WordPress properties.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto p-6 flex-1 pr-5">
              {/* Basic Fields */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Project Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PG Ledger, Acme Mobile App"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of what this project does"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">Project Type</label>
                  <CustomSelect
                    value={type}
                    onChange={(val) => setType(val)}
                    options={[
                      { value: 'CUSTOM', label: 'Custom / Code Project' },
                      { value: 'WORDPRESS', label: 'WordPress' },
                      { value: 'OTHER', label: 'Other' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink">Status</label>
                  <CustomSelect
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={[
                      { value: 'DEVELOPMENT', label: 'Development' },
                      { value: 'STAGING', label: 'Staging' },
                      { value: 'PRODUCTION', label: 'Production' },
                      { value: 'IDEA', label: 'Idea' },
                      { value: 'MAINTENANCE', label: 'Maintenance' },
                      { value: 'ARCHIVED', label: 'Archived' },
                    ]}
                  />
                </div>
              </div>

              {/* Conditional: Custom Code Tech Stack */}
              {type === 'CUSTOM' && (
                <>
                  <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-3">
                    <h4 className="text-xs font-bold text-foreground">Technology Stack</h4>
                    <div className="space-y-3">
                      <TechnologyCombobox
                        label="Frontend Technologies"
                        options={FRONTEND_TECHNOLOGIES}
                        selected={frontendTech}
                        onChange={setFrontendTech}
                        placeholder="Search or add frontend frameworks..."
                      />
                      <TechnologyCombobox
                        label="Backend Technologies"
                        options={BACKEND_TECHNOLOGIES}
                        selected={backendTech}
                        onChange={setBackendTech}
                        placeholder="Search or add backend runtimes..."
                      />
                      <TechnologyCombobox
                        label="Database & Storage"
                        options={DATABASE_TECHNOLOGIES}
                        selected={databaseTech}
                        onChange={setDatabaseTech}
                        placeholder="Search or add databases..."
                      />
                    </div>
                  </div>

                  {/* Custom Code URLs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Repository URL</label>
                      <Input
                        mono
                        value={repositoryUrl}
                        onChange={(e) => setRepositoryUrl(e.target.value)}
                        placeholder="https://github.com/org/repo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Production URL</label>
                      <Input
                        mono
                        value={productionUrl}
                        onChange={(e) => setProductionUrl(e.target.value)}
                        placeholder="https://app.domain.com"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Conditional: WordPress Config & Tech Stack */}
              {type === 'WORDPRESS' && (
                <>
                  <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">WordPress Stack & Builders</h4>
                      <span className="text-[10px] text-muted-foreground font-mono">WordPress Ecosystem</span>
                    </div>

                    <div className="space-y-3">
                      <TechnologyCombobox
                        label="Theme & Page Builders"
                        options={WORDPRESS_BUILDERS_THEMES}
                        selected={wpBuilders}
                        onChange={setWpBuilders}
                        placeholder="Select builders (Elementor, Divi 4, Divi 5, Bricks...)"
                      />
                      <TechnologyCombobox
                        label="Essential Plugins & Tools"
                        options={WORDPRESS_PLUGINS}
                        selected={wpPlugins}
                        onChange={setWpPlugins}
                        placeholder="Select plugins (WooCommerce, ACF, Yoast SEO...)"
                      />
                      <TechnologyCombobox
                        label="Database & Server / PHP"
                        options={WORDPRESS_SERVERS_DATABASES}
                        selected={wpDbServer}
                        onChange={setWpDbServer}
                        placeholder="Select infrastructure (MySQL, Redis, LiteSpeed, PHP...)"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-3">
                    <h4 className="text-xs font-bold text-foreground">WordPress URLs & Hosting</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">Website URL *</label>
                        <Input
                          mono
                          value={wpWebsiteUrl}
                          onChange={(e) => setWpWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="h-8 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">WP Admin URL</label>
                        <Input
                          mono
                          value={wpAdminUrl}
                          onChange={(e) => setWpAdminUrl(e.target.value)}
                          placeholder="https://example.com/wp-admin"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">Hosting Provider</label>
                        <Input
                          value={wpHosting}
                          onChange={(e) => setWpHosting(e.target.value)}
                          placeholder="Hostinger, WP Engine"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">Domain Provider</label>
                        <Input
                          value={wpDomain}
                          onChange={(e) => setWpDomain(e.target.value)}
                          placeholder="Namecheap, GoDaddy"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Scalable Team Member Assignment */}
              <MemberCombobox
                users={allUsers}
                selectedUserIds={selectedMemberIds}
                onChange={setSelectedMemberIds}
                label="Assign Team Members"
                placeholder="Search and assign team members..."
              />
            </div>

            <DialogFooter className="p-4 px-6 border-t border-border bg-muted/20 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="h-8 text-xs rounded-[6px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                variant="blue"
                className="h-8 text-xs rounded-[6px] font-semibold"
              >
                {createLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
