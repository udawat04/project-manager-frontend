'use client';

import * as React from 'react';
import { Plus, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CustomSelect } from '@/components/ui/custom-select';
import { SecretField } from '@/components/features/SecretField';
import { CopyAllCredentialsButton } from '@/components/features/credentials/CopyAllCredentialsButton';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ProjectCredentialsTabProps {
  projectId: string;
  credentials: any[];
  onRefresh: () => void;
  onActivityRefresh: () => void;
}

export function ProjectCredentialsTab({
  projectId,
  credentials,
  onRefresh,
  onActivityRefresh,
}: ProjectCredentialsTabProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('API_KEY');
  const [fields, setFields] = React.useState<any[]>([
    { name: 'apiKey', value: '', type: 'token', isSensitive: true },
  ]);
  const [submitting, setSubmitting] = React.useState(false);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'LOGIN') {
      setFields([
        { name: 'username_or_email', value: '', type: 'text', isSensitive: false },
        { name: 'password', value: '', type: 'password', isSensitive: true },
      ]);
    } else if (newType === 'API_KEY') {
      setFields([
        { name: 'apiKey', value: '', type: 'token', isSensitive: true },
      ]);
    } else if (newType === 'DATABASE') {
      setFields([
        { name: 'host', value: '', type: 'text', isSensitive: false },
        { name: 'port', value: '5432', type: 'text', isSensitive: false },
        { name: 'database', value: '', type: 'text', isSensitive: false },
        { name: 'username', value: '', type: 'text', isSensitive: false },
        { name: 'password', value: '', type: 'password', isSensitive: true },
      ]);
    } else if (newType === 'SSH') {
      setFields([
        { name: 'privateKey', value: '', type: 'password', isSensitive: true },
        { name: 'passphrase', value: '', type: 'password', isSensitive: true },
      ]);
    }
  };


  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [targetDeleteId, setTargetDeleteId] = React.useState<string | null>(null);
  const [targetDeleteName, setTargetDeleteName] = React.useState('');

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Credential name is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.createCredential({
        name: name.trim(),
        type,
        projectId,
        fields,
      });

      toast.success('Credential saved to project vault');
      setAddOpen(false);
      setName('');
      setFields([{ name: 'apiKey', value: '', type: 'token', isSensitive: true }]);
      onRefresh();
      onActivityRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create credential');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setTargetDeleteId(id);
    setTargetDeleteName(name);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteId) return;
    try {
      await api.deleteCredential(targetDeleteId);
      toast.success('Credential deleted');
      setDeleteModalOpen(false);
      setTargetDeleteId(null);
      onRefresh();
      onActivityRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete credential');
    }
  };

  const typeOptions = [
    { value: 'API_KEY', label: 'API Key' },
    { value: 'LOGIN', label: 'Login (Email & Password)' },
    { value: 'DATABASE', label: 'Database Connection' },
    { value: 'SSH', label: 'SSH Key' },
    { value: 'TOKEN', label: 'Access Token' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Project Credentials Vault</h2>
          <p className="text-xs text-muted-foreground">
            Scoped secrets, API keys, passwords, and tokens dedicated to this project.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CopyAllCredentialsButton projectId={projectId} credentialsCount={credentials.length} />
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 h-8 text-xs rounded-[6px]">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Credential</span>
          </Button>
        </div>
      </div>

      {credentials.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <KeyRound className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">No credentials stored</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Store Stripe, OpenAI, Cloudinary, or database passwords securely.
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)} className="mt-4">
            Add First Credential
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((cred) => (
            <Card key={cred.id} className="p-5 space-y-4 shadow-vercel">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{cred.name}</h3>
                  <Badge variant="outline" className="text-[10px] font-mono mt-1">
                    {cred.type}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => confirmDelete(cred.id, cred.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                {cred.fields?.map((field: any) => (
                  <div key={field.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground font-medium">{field.name}:</span>
                    <SecretField
                      isSensitive={field.isSensitive}
                      onReveal={async () => {
                        const res = await api.revealCredential(cred.id);
                        const found = res.fields?.find((f: any) => f.id === field.id);
                        return found ? found.value : '';
                      }}
                      onCopy={() => api.logCredentialCopy(cred.id, field.name)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete credential?"
        description={`Are you sure you want to delete "${targetDeleteName}"? This action cannot be undone.`}
        confirmLabel="Delete Credential"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />

      {/* Add Credential Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent onClose={() => setAddOpen(false)}>
          <form onSubmit={handleAddCredential}>
            <DialogHeader>
              <DialogTitle>Add Project Credential</DialogTitle>
              <DialogDescription>
                Store third-party keys, passwords, or connection strings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Credential Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stripe Live API Key, OpenAI Production"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Credential Type</label>
                <CustomSelect
                  value={type}
                  onChange={handleTypeChange}
                  options={typeOptions}
                />
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Credential Fields</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] rounded-[4px]"
                    onClick={() =>
                      setFields([...fields, { name: 'field', value: '', type: 'text', isSensitive: true }])
                    }
                  >
                    + Add Field
                  </Button>
                </div>

                {fields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      mono
                      value={field.name}
                      onChange={(e) => {
                        const copy = [...fields];
                        copy[idx].name = e.target.value;
                        setFields(copy);
                      }}
                      placeholder="Field name"
                      className="w-1/3 h-8 text-xs"
                    />
                    <Input
                      mono
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const copy = [...fields];
                        copy[idx].value = e.target.value;
                        setFields(copy);
                      }}
                      placeholder="Value"
                      className="flex-1 h-8 text-xs"
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                        className="text-destructive hover:opacity-80 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Credential
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
