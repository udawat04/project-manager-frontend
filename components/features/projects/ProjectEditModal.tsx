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
import { TechnologyCombobox } from '@/components/ui/technology-combobox';
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

interface ProjectEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onSuccess: () => void;
}

export function ProjectEditModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectEditModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState('DEVELOPMENT');
  const [type, setType] = React.useState('CUSTOM');
  const [productionUrl, setProductionUrl] = React.useState('');
  const [stagingUrl, setStagingUrl] = React.useState('');
  const [repositoryUrl, setRepositoryUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Tech stack (Custom)
  const [frontendTech, setFrontendTech] = React.useState<string[]>([]);
  const [backendTech, setBackendTech] = React.useState<string[]>([]);
  const [databaseTech, setDatabaseTech] = React.useState<string[]>([]);

  // WordPress Specific Fields
  const [wpWebsiteUrl, setWpWebsiteUrl] = React.useState('');
  const [wpAdminUrl, setWpAdminUrl] = React.useState('');
  const [wpHosting, setWpHosting] = React.useState('');
  const [wpDomain, setWpDomain] = React.useState('');
  const [wpBuilders, setWpBuilders] = React.useState<string[]>([]);
  const [wpPlugins, setWpPlugins] = React.useState<string[]>([]);
  const [wpDbServer, setWpDbServer] = React.useState<string[]>([]);

  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (project && open) {
      setName(project.name || '');
      setDescription(project.description || '');
      setStatus(project.status || 'DEVELOPMENT');
      setType(project.type || 'CUSTOM');
      setProductionUrl(project.productionUrl || '');
      setStagingUrl(project.stagingUrl || '');
      setRepositoryUrl(project.repositoryUrl || '');
      setNotes(project.notes || '');

      // Tech Stack
      if (project.type === 'WORDPRESS') {
        setWpBuilders(project.techStack?.frontend || ['Elementor']);
        setWpPlugins(project.techStack?.backend || ['WooCommerce', 'Advanced Custom Fields (ACF)']);
        setWpDbServer(project.techStack?.database || ['MySQL 8.0', 'Redis Object Cache', 'PHP 8.2']);
      } else {
        setFrontendTech(project.techStack?.frontend || []);
        setBackendTech(project.techStack?.backend || []);
        setDatabaseTech(project.techStack?.database || []);
      }

      // WordPress Config
      if (project.wpConfig) {
        setWpWebsiteUrl(project.wpConfig.websiteUrl || project.productionUrl || '');
        setWpAdminUrl(project.wpConfig.adminUrl || '');
        setWpHosting(project.wpConfig.hostingProvider || '');
        setWpDomain(project.wpConfig.domainProvider || '');
      } else {
        setWpWebsiteUrl(project.productionUrl || '');
        setWpAdminUrl(project.productionUrl ? `${project.productionUrl.replace(/\/$/, '')}/wp-admin` : '');
        setWpHosting('');
        setWpDomain('');
      }
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      const techStack =
        type === 'WORDPRESS'
          ? {
              frontend: wpBuilders,
              backend: wpPlugins,
              database: wpDbServer,
            }
          : {
              frontend: frontendTech,
              backend: backendTech,
              database: databaseTech,
            };

      const wpConfig =
        type === 'WORDPRESS'
          ? {
              websiteUrl: wpWebsiteUrl.trim() || undefined,
              adminUrl: wpAdminUrl.trim() || undefined,
              hostingProvider: wpHosting.trim() || undefined,
              domainProvider: wpDomain.trim() || undefined,
            }
          : undefined;

      await api.updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        type,
        productionUrl: type === 'WORDPRESS' ? wpWebsiteUrl.trim() || undefined : productionUrl.trim() || undefined,
        stagingUrl: stagingUrl.trim() || undefined,
        repositoryUrl: type === 'WORDPRESS' ? undefined : repositoryUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        techStack,
        wpConfig,
      });

      toast.success('Project details updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'DEVELOPMENT', label: 'Development' },
    { value: 'STAGING', label: 'Staging' },
    { value: 'PRODUCTION', label: 'Production' },
    { value: 'IDEA', label: 'Idea' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  const typeOptions = [
    { value: 'CUSTOM', label: 'Custom / Code Project' },
    { value: 'WORDPRESS', label: 'WordPress' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
            <DialogDescription>
              Update configuration, operational URLs, and technology stack for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Project Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Dental Care, Acme App"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this project does"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Project Type</label>
                <CustomSelect
                  value={type}
                  onChange={(val) => setType(val)}
                  options={typeOptions}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <CustomSelect
                  value={status}
                  onChange={(val) => setStatus(val)}
                  options={statusOptions}
                />
              </div>
            </div>

            {/* Custom Code Tech Stack */}
            {type === 'CUSTOM' && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3.5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Technology Stack
                </h4>

                <TechnologyCombobox
                  label="Frontend Technologies"
                  placeholder="Search frontend technologies (Next.js, React, Tailwind...)"
                  options={FRONTEND_TECHNOLOGIES}
                  selected={frontendTech}
                  onChange={setFrontendTech}
                />

                <TechnologyCombobox
                  label="Backend & Runtime"
                  placeholder="Search backend runtimes (Node.js, Express, Go, Python...)"
                  options={BACKEND_TECHNOLOGIES}
                  selected={backendTech}
                  onChange={setBackendTech}
                />

                <TechnologyCombobox
                  label="Databases & Caches"
                  placeholder="Search databases (PostgreSQL, MongoDB, Redis...)"
                  options={DATABASE_TECHNOLOGIES}
                  selected={databaseTech}
                  onChange={setDatabaseTech}
                />
              </div>
            )}

            {/* WordPress-Specific Tech Stack & Theme Builders */}
            {type === 'WORDPRESS' && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    WordPress Stack & Builders
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono">WordPress Ecosystem</span>
                </div>

                <TechnologyCombobox
                  label="Theme & Page Builders"
                  placeholder="Select builders & themes (Elementor, Divi 4, Divi 5, Bricks, Gutenberg...)"
                  options={WORDPRESS_BUILDERS_THEMES}
                  selected={wpBuilders}
                  onChange={setWpBuilders}
                />

                <TechnologyCombobox
                  label="Essential Plugins & E-commerce"
                  placeholder="Select plugins (WooCommerce, ACF, Yoast SEO, WP Rocket...)"
                  options={WORDPRESS_PLUGINS}
                  selected={wpPlugins}
                  onChange={setWpPlugins}
                />

                <TechnologyCombobox
                  label="Database, Cache & Web Server"
                  placeholder="Select infrastructure (MySQL 8.0, Redis Object Cache, LiteSpeed, PHP 8.2...)"
                  options={WORDPRESS_SERVERS_DATABASES}
                  selected={wpDbServer}
                  onChange={setWpDbServer}
                />
              </div>
            )}

            {/* Custom URLs */}
            {type !== 'WORDPRESS' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Production URL</label>
                    <Input
                      mono
                      value={productionUrl}
                      onChange={(e) => setProductionUrl(e.target.value)}
                      placeholder="https://app.example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Staging URL</label>
                    <Input
                      mono
                      value={stagingUrl}
                      onChange={(e) => setStagingUrl(e.target.value)}
                      placeholder="https://staging.example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Repository URL</label>
                  <Input
                    mono
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                  />
                </div>
              </>
            )}

            {/* WordPress Specific URLs & Providers */}
            {type === 'WORDPRESS' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Website URL *</label>
                    <Input
                      mono
                      value={wpWebsiteUrl}
                      onChange={(e) => setWpWebsiteUrl(e.target.value)}
                      placeholder="https://apexmedical.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">WP Admin Login URL</label>
                    <Input
                      mono
                      value={wpAdminUrl}
                      onChange={(e) => setWpAdminUrl(e.target.value)}
                      placeholder="https://apexmedical.com/wp-admin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Hosting Provider</label>
                    <Input
                      value={wpHosting}
                      onChange={(e) => setWpHosting(e.target.value)}
                      placeholder="e.g. Hostinger, WP Engine, Kinsta"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Domain Provider</label>
                    <Input
                      value={wpDomain}
                      onChange={(e) => setWpDomain(e.target.value)}
                      placeholder="e.g. Namecheap, Cloudflare, GoDaddy"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Staging / Test URL (optional)</label>
                  <Input
                    mono
                    value={stagingUrl}
                    onChange={(e) => setStagingUrl(e.target.value)}
                    placeholder="https://staging.apexmedical.com"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Operational Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Architecture decisions, plugin licenses, branch conventions..."
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
              disabled={submitting}
              variant="blue"
              className="h-8 text-xs rounded-[6px] font-semibold"
            >
              {submitting ? 'Saving...' : 'Save Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
