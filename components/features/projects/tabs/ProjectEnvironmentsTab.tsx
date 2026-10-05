'use client';

import * as React from 'react';
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Download,
  FileText,
  Upload,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnvVariableTable, EnvVarItem } from '@/components/features/environments/EnvVariableTable';
import { EnvImportDialog } from '@/components/features/EnvImportDialog';
import { AccessControlModal } from '@/components/features/access/AccessControlModal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ProjectEnvironmentsTabProps {
  projectId: string;
  environments: any[];
  onEnvironmentCreated: () => void;
  projectRole: string;
  isMasterAdmin?: boolean;
  onActivityRefresh?: () => void;
}

export function ProjectEnvironmentsTab({
  projectId,
  environments,
  onEnvironmentCreated,
  onActivityRefresh,
  projectRole,
  isMasterAdmin,
}: ProjectEnvironmentsTabProps) {
  const allowEdit = isMasterAdmin || projectRole === 'EDITOR';
  const allowCopy = isMasterAdmin || projectRole === 'EDITOR' || projectRole === 'VIEWER';
  const allowReveal = isMasterAdmin || projectRole === 'EDITOR' || projectRole === 'VIEWER';
  
  const [selectedEnvId, setSelectedEnvId] = React.useState<string>(
    environments.length > 0 ? environments[0].id : ''
  );
  const [variables, setVariables] = React.useState<EnvVarItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [filterSensitive, setFilterSensitive] = React.useState<'ALL' | 'SENSITIVE' | 'PUBLIC'>('ALL');

  // Reveal All state & 30s countdown
  const [revealedAllMap, setRevealedAllMap] = React.useState<Record<string, string>>({});
  const [revealAllOpen, setRevealAllOpen] = React.useState(false);
  const [autoHideSeconds, setAutoHideSeconds] = React.useState<number | null>(null);

  // Modals state
  const [copyAllConfirmOpen, setCopyAllConfirmOpen] = React.useState(false);
  const [exportConfirmOpen, setExportConfirmOpen] = React.useState(false);
  const [createEnvOpen, setCreateEnvOpen] = React.useState(false);
  const [newEnvName, setNewEnvName] = React.useState('');
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importMode, setImportMode] = React.useState<'paste' | 'upload'>('paste');
  const [accessModalOpen, setAccessModalOpen] = React.useState(false);
  
  const [accessDenied, setAccessDenied] = React.useState(false);
  const [requestReason, setRequestReason] = React.useState('');
  const [requestingAccess, setRequestingAccess] = React.useState(false);

  // Variable Add / Edit Dialog
  const [varModalOpen, setVarModalOpen] = React.useState(false);
  const [varModalMode, setVarModalMode] = React.useState<'create' | 'edit'>('create');
  const [editVarId, setEditVarId] = React.useState<string | null>(null);
  const [varKey, setVarKey] = React.useState('');
  const [varValue, setVarValue] = React.useState('');
  const [varSensitive, setVarSensitive] = React.useState(true);
  const [varDesc, setVarDesc] = React.useState('');

  React.useEffect(() => {
    if (environments.length > 0 && !selectedEnvId) {
      setSelectedEnvId(environments[0].id);
    }
  }, [environments, selectedEnvId]);

  const fetchVariables = async () => {
    if (!selectedEnvId) return;
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await api.getVariables(selectedEnvId, {
        search: search.trim() || undefined,
        sensitive: filterSensitive === 'SENSITIVE' ? true : filterSensitive === 'PUBLIC' ? false : undefined,
      });
      setVariables(res.variables);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('explicit environment access') || err.message?.toLowerCase().includes('guests cannot access')) {
        setAccessDenied(true);
      } else {
        toast.error(err.message || 'Failed to load variables');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!requestReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setRequestingAccess(true);
    try {
      await api.createAccessRequest({
        resourceType: 'ENVIRONMENT',
        resourceId: selectedEnvId,
        reason: requestReason.trim(),
      });
      toast.success('Access request submitted successfully');
      setRequestReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request access');
    } finally {
      setRequestingAccess(false);
    }
  };

  React.useEffect(() => {
    if (selectedEnvId) {
      fetchVariables();
      setRevealedAllMap({});
      setAutoHideSeconds(null);
    }
  }, [selectedEnvId, search, filterSensitive]);

  // 30s auto-hide countdown
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoHideSeconds !== null && autoHideSeconds > 0) {
      timer = setInterval(() => {
        setAutoHideSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
    } else if (autoHideSeconds === 0 || autoHideSeconds === null) {
      setRevealedAllMap({});
    }
    return () => clearInterval(timer);
  }, [autoHideSeconds]);

  // Reveal All
  const handleConfirmRevealAll = async () => {
    setRevealAllOpen(false);
    try {
      const res = await api.revealAllVariables(selectedEnvId);
      const map: Record<string, string> = {};
      res.variables.forEach((v) => {
        map[v.id] = v.value;
      });
      setRevealedAllMap(map);
      setAutoHideSeconds(30);
      toast.warning(`${res.variables.length} secrets revealed. Auto-hiding in 30 seconds.`);
      onActivityRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reveal variables');
    }
  };

  const handleHideAll = () => {
    setRevealedAllMap({});
    setAutoHideSeconds(null);
    toast.info('All sensitive values hidden');
  };

  // Copy All
  const handleConfirmCopyAll = async () => {
    setCopyAllConfirmOpen(false);
    try {
      const res = await api.exportVariables(selectedEnvId);
      await navigator.clipboard.writeText(res.content);
      toast.success(`Copied ${res.variableCount} variables in valid .env syntax to clipboard`);
      onActivityRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to copy variables');
    }
  };

  // Export .env
  const handleConfirmExport = async () => {
    setExportConfirmOpen(false);
    try {
      const res = await api.exportVariables(selectedEnvId);
      const blob = new Blob([res.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.filename || '.env';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.filename}`);
      onActivityRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to export environment');
    }
  };

  // Save Variable
  const handleSaveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varKey.trim()) {
      toast.error('Key name is required');
      return;
    }

    try {
      if (varModalMode === 'create') {
        await api.createVariable(selectedEnvId, {
          key: varKey.trim(),
          value: varValue,
          isSensitive: varSensitive,
          description: varDesc.trim() || undefined,
        });
        toast.success(`Variable ${varKey} created`);
      } else if (editVarId) {
        await api.updateVariable(editVarId, {
          key: varKey.trim(),
          value: varValue ? varValue : undefined,
          isSensitive: varSensitive,
          description: varDesc.trim() || undefined,
        });
        toast.success(`Variable ${varKey} updated`);
      }

      setVarModalOpen(false);
      fetchVariables();
      onActivityRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save variable');
    }
  };

  // Delete Variable
  const handleDeleteVariable = async (item: EnvVarItem) => {
    if (!confirm(`Delete variable "${item.key}"? This action cannot be undone.`)) return;
    try {
      await api.deleteVariable(item.id);
      toast.success(`Deleted variable ${item.key}`);
      fetchVariables();
      onActivityRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete variable');
    }
  };

  // Create Environment
  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;

    try {
      const res = await api.createEnvironment(projectId, {
        name: newEnvName.trim(),
        type: 'CUSTOM',
      });
      toast.success(`Environment "${res.environment.name}" created`);
      setCreateEnvOpen(false);
      setNewEnvName('');
      onEnvironmentCreated();
      setSelectedEnvId(res.environment.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create environment');
    }
  };

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);
  const isRevealedAll = Object.keys(revealedAllMap).length > 0;

  return (
    <div className="space-y-5">
      {/* 1. Environment Tabs Selector Bar (Clean, Uncongested Vercel Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setSelectedEnvId(env.id)}
              className={`px-3.5 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                selectedEnvId === env.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{env.name}</span>
              {selectedEnvId === env.id && autoHideSeconds !== null && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold">
                  {autoHideSeconds}s
                </span>
              )}
            </button>
          ))}

          {allowEdit && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 rounded-[6px]"
              onClick={() => setCreateEnvOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Environment</span>
            </Button>
          )}
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {allowEdit && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setVarModalMode('create');
                  setEditVarId(null);
                  setVarKey('');
                  setVarValue('');
                  setVarSensitive(true);
                  setVarDesc('');
                  setVarModalOpen(true);
                }}
                className="h-8 text-xs gap-1.5 rounded-[6px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Variable</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-[6px]"
                onClick={() => setAccessModalOpen(true)}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Manage Access</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-[6px]"
                onClick={() => {
                  setImportMode('paste');
                  setImportDialogOpen(true);
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Paste .env</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-[6px]"
                onClick={() => {
                  setImportMode('upload');
                  setImportDialogOpen(true);
                }}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import .env</span>
              </Button>
            </>
          )}

          {allowReveal && (isRevealedAll ? (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs gap-1.5 rounded-[6px]"
              onClick={handleHideAll}
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Hide All</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 rounded-[6px]"
              onClick={() => setRevealAllOpen(true)}
              disabled={variables.length === 0}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Reveal All</span>
            </Button>
          ))}

          {allowCopy && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-[6px]"
                onClick={() => setCopyAllConfirmOpen(true)}
                disabled={variables.length === 0}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy All</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-[6px]"
                onClick={() => setExportConfirmOpen(true)}
                disabled={variables.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export .env</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      {!accessDenied && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-[8px] border border-border bg-card shadow-vercel">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${selectedEnv?.name || ''} variables...`}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-[6px] text-xs">
            {(['ALL', 'SENSITIVE', 'PUBLIC'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterSensitive(filter)}
                className={`px-3 py-1 rounded-[4px] cursor-pointer transition-colors font-medium ${
                  filterSensitive === filter
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'SENSITIVE' ? 'Sensitive' : 'Public'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Variables Table */}
      <div className="rounded-[8px] border border-border bg-card overflow-hidden shadow-vercel">
        {accessDenied ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Access Denied</h3>
              <p className="text-sm text-body max-w-md mx-auto mt-2">
                You do not have permission to view variables for this environment. Please request access from an administrator.
              </p>
            </div>
            <div className="w-full max-w-md mt-6 space-y-3">
              <Input
                placeholder="Reason for requesting access..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
              />
              <Button className="w-full" onClick={handleRequestAccess} isLoading={requestingAccess} disabled={!requestReason.trim()}>
                Request Access
              </Button>
            </div>
          </div>
        ) : loading ? (
          <TableSkeleton rows={4} />
        ) : variables.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">
              No variables found in {selectedEnv?.name}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Add variables manually, paste your .env contents, or import an existing .env file.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {allowEdit && (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setVarModalMode('create');
                      setEditVarId(null);
                      setVarKey('');
                      setVarValue('');
                      setVarModalOpen(true);
                    }}
                  >
                    Add Variable
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setImportMode('paste');
                      setImportDialogOpen(true);
                    }}
                  >
                    Paste .env
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <EnvVariableTable
            variables={variables}
            revealedAllMap={revealedAllMap}
            onEdit={!allowEdit ? undefined : (item: EnvVarItem) => {
              setVarModalMode('edit');
              setEditVarId(item.id);
              setVarKey(item.key);
              setVarValue('');
              setVarSensitive(item.isSensitive);
              setVarDesc(item.description || '');
              setVarModalOpen(true);
            }}
            onDelete={allowEdit ? handleDeleteVariable : () => {}}
            allowReveal={allowReveal}
            allowCopy={allowCopy}
            allowEdit={allowEdit}
          />
        )}
      </div>

      {/* Security Confirmation Modals */}
      <ConfirmModal
        open={revealAllOpen}
        onOpenChange={setRevealAllOpen}
        title="Reveal all environment secrets?"
        description={`This will temporarily decrypt and display all ${variables.length} sensitive values in the ${selectedEnv?.name} environment. For your safety, all values will automatically hide again in 30 seconds.`}
        confirmLabel="Reveal All"
        variant="warning"
        onConfirm={handleConfirmRevealAll}
      />

      <ConfirmModal
        open={copyAllConfirmOpen}
        onOpenChange={setCopyAllConfirmOpen}
        title="Copy all environment variables?"
        description={`This will place all ${variables.length} environment variables and secrets from ${selectedEnv?.name} onto your clipboard in valid .env syntax. Make sure you are in a secure environment.`}
        confirmLabel="Copy to Clipboard"
        onConfirm={handleConfirmCopyAll}
      />

      <ConfirmModal
        open={exportConfirmOpen}
        onOpenChange={setExportConfirmOpen}
        title="Export Environment File?"
        description={`You are about to export a decrypted .env file containing all ${selectedEnv?.name} credentials. Ensure downloaded files are kept secure and excluded from version control.`}
        confirmLabel="Export .env"
        onConfirm={handleConfirmExport}
      />

      {/* Add / Edit Variable Dialog */}
      <Dialog open={varModalOpen} onOpenChange={setVarModalOpen}>
        <DialogContent onClose={() => setVarModalOpen(false)}>
          <form onSubmit={handleSaveVariable}>
            <DialogHeader>
              <DialogTitle>
                {varModalMode === 'create' ? 'Add Environment Variable' : `Edit ${varKey}`}
              </DialogTitle>
              <DialogDescription>
                Values are encrypted with AES-256-GCM before storage.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Key Name *</label>
                <Input
                  mono
                  value={varKey}
                  onChange={(e) => setVarKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="DATABASE_URL, JWT_SECRET, PORT"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {varModalMode === 'edit' ? 'New Value (leave blank to keep current)' : 'Value'}
                </label>
                <Input
                  mono
                  type="text"
                  value={varValue}
                  onChange={(e) => setVarValue(e.target.value)}
                  placeholder="Secret or configuration value"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsSens"
                  checked={varSensitive}
                  onChange={(e) => setVarSensitive(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="modalIsSens" className="text-xs font-medium cursor-pointer text-foreground">
                  Mark as Sensitive (Masked by default & requires explicit reveal)
                </label>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-foreground">Description (optional)</label>
                <Input
                  value={varDesc}
                  onChange={(e) => setVarDesc(e.target.value)}
                  placeholder="e.g. Primary connection pooler"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setVarModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {varModalMode === 'create' ? 'Add Variable' : 'Update Variable'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import / Paste Dialog */}
      <EnvImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        environmentId={selectedEnvId}
        environmentName={selectedEnv?.name || 'Selected'}
        defaultMode={importMode}
        onSuccess={() => {
          fetchVariables();
          onActivityRefresh?.();
        }}
      />

      {/* Create Environment Dialog */}
      <Dialog open={createEnvOpen} onOpenChange={setCreateEnvOpen}>
        <DialogContent onClose={() => setCreateEnvOpen(false)}>
          <form onSubmit={handleCreateEnvironment}>
            <DialogHeader>
              <DialogTitle>Add New Environment</DialogTitle>
              <DialogDescription>
                Create a distinct environment (e.g. Staging, Preview, QA) for this project.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Environment Name *</label>
                <Input
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="e.g. Staging, Preview, QA"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateEnvOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Environment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Access Control Modal */}
      <AccessControlModal
        open={accessModalOpen}
        onOpenChange={setAccessModalOpen}
        environmentId={selectedEnvId}
        projectId={projectId}
        onSuccess={() => {
          fetchVariables();
          onActivityRefresh?.();
        }}
      />
    </div>
  );
}
