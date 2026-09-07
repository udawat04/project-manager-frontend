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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environmentId: string;
  environmentName: string;
  onSuccess: () => void;
  defaultMode?: 'paste' | 'upload';
}

interface PreviewVariable {
  key: string;
  isSensitive: boolean;
  hasConflict: boolean;
  valuePreview: string;
  fullValue: string;
  conflictResolution?: 'REPLACE' | 'SKIP';
}

export function EnvImportDialog({
  open,
  onOpenChange,
  environmentId,
  environmentName,
  onSuccess,
  defaultMode = 'paste',
}: EnvImportDialogProps) {
  const [mode, setMode] = React.useState<'paste' | 'upload'>(defaultMode);
  const [rawContent, setRawContent] = React.useState('');
  const [step, setStep] = React.useState<'input' | 'preview'>('input');
  const [loading, setLoading] = React.useState(false);
  const [previewList, setPreviewList] = React.useState<PreviewVariable[]>([]);
  const [parseErrors, setParseErrors] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setStep('input');
      setRawContent('');
      setPreviewList([]);
      setParseErrors([]);
    }
  }, [open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawContent(content);
    };
    reader.readAsText(file);
  };

  const handleParse = async () => {
    if (!rawContent.trim()) {
      toast.error('Please paste or upload environment content first');
      return;
    }

    setLoading(true);
    try {
      const res = await api.previewImport(environmentId, rawContent);
      setPreviewList(
        res.variables.map((v) => ({
          ...v,
          conflictResolution: 'REPLACE',
        }))
      );
      setParseErrors(res.parseErrors || []);
      setStep('preview');
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse environment file');
    } finally {
      setLoading(false);
    }
  };

  const handleResolutionToggle = (key: string, res: 'REPLACE' | 'SKIP') => {
    setPreviewList((prev) =>
      prev.map((item) => (item.key === key ? { ...item, conflictResolution: res } : item))
    );
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const payload = previewList.map((p) => ({
        key: p.key,
        value: p.fullValue,
        isSensitive: p.isSensitive,
        conflictResolution: p.conflictResolution || 'REPLACE',
      }));

      const res = await api.importVariables(environmentId, payload);
      toast.success(res.message);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to import variables');
    } finally {
      setLoading(false);
    }
  };

  const conflictCount = previewList.filter((p) => p.hasConflict).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClose={() => onOpenChange(false)}>
        {step === 'input' ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Environment Variables</DialogTitle>
              <DialogDescription>
                Import and encrypt variables into the <span className="font-semibold text-ink">{environmentName}</span> environment.
              </DialogDescription>
            </DialogHeader>

            {/* Vercel Segmented Tab Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-canvas-soft border border-hairline w-fit mb-4">
              <button
                type="button"
                onClick={() => setMode('paste')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5',
                  mode === 'paste'
                    ? 'bg-ink text-on-primary shadow-xs'
                    : 'text-body hover:text-ink'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Paste .env</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5',
                  mode === 'upload'
                    ? 'bg-ink text-on-primary shadow-xs'
                    : 'text-body hover:text-ink'
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload File</span>
              </button>
            </div>

            {mode === 'paste' ? (
              <div className="space-y-2">
                <Textarea
                  mono
                  placeholder={`DATABASE_URL="postgresql://user:pass@host:5432/db"\nJWT_SECRET=supersecret123\nPORT=5000\nCLOUDINARY_KEY=xyz # image storage`}
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className="min-h-[220px] font-mono text-xs bg-canvas-soft border-hairline focus:bg-canvas focus:border-hairline-strong rounded-[6px]"
                />
                <p className="text-[11px] text-mute font-mono">
                  Supports standard dotenv syntax, quotes, and multiline values. Comments (#) and blank lines are ignored.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-hairline-strong/60 hover:border-ink/60 rounded-[8px] p-8 text-center cursor-pointer transition-all bg-canvas-soft hover:bg-canvas-soft-2 group"
                >
                  <Upload className="h-7 w-7 mx-auto text-mute group-hover:text-ink mb-2 transition-colors stroke-1" />
                  <p className="text-xs font-medium text-ink">Click to select a .env file</p>
                  <p className="text-[11px] text-mute mt-1 font-mono">.env, .env.production, .env.local, .txt</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".env,.env.*,.txt"
                    onChange={handleFileUpload}
                  />
                </div>
                {rawContent && (
                  <div className="p-3 bg-canvas-soft rounded-[6px] border border-hairline text-xs font-mono text-body max-h-32 overflow-y-auto">
                    {rawContent.substring(0, 300)}...
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs rounded-[6px] border-hairline font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleParse}
                isLoading={loading}
                className="h-8 text-xs rounded-[6px] bg-ink text-on-primary hover:bg-ink/90 font-medium shadow-vercel"
              >
                Parse & Preview
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Import Preview</DialogTitle>
              <DialogDescription>
                {previewList.length} variable{previewList.length === 1 ? '' : 's'} detected in{' '}
                <span className="font-semibold text-ink">{environmentName}</span>.
              </DialogDescription>
            </DialogHeader>

            {conflictCount > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-[6px] bg-warning-soft border border-warning/30 text-warning-deep text-xs mb-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    {conflictCount} conflict{conflictCount === 1 ? '' : 's'} detected.
                  </span>{' '}
                  Choose whether to replace existing values or skip them below.
                </div>
              </div>
            )}

            {parseErrors.length > 0 && (
              <div className="p-3 rounded-[6px] bg-error-soft border border-error/20 text-error-deep text-xs mb-3">
                <p className="font-semibold mb-1">Warnings during parsing:</p>
                <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                  {parseErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto border border-hairline rounded-[6px] divide-y divide-hairline bg-canvas">
              {previewList.map((item) => (
                <div
                  key={item.key}
                  className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-canvas-soft transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <CheckCircle2 className="h-3.5 w-3.5 text-link shrink-0" />
                    <span className="font-mono font-semibold text-ink">{item.key}</span>
                    <span className="font-mono text-mute">{item.valuePreview}</span>
                    {item.isSensitive ? (
                      <Badge variant="default" className="text-[9px] px-1 py-0 h-4 font-mono uppercase">
                        Secret
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono text-mute border-hairline">
                        Public
                      </Badge>
                    )}
                  </div>

                  {item.hasConflict && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <span className="text-[10px] text-warning-deep font-medium mr-1 font-mono">Conflict:</span>
                      <button
                        type="button"
                        onClick={() => handleResolutionToggle(item.key, 'REPLACE')}
                        className={cn(
                          'px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium transition-all cursor-pointer',
                          item.conflictResolution === 'REPLACE'
                            ? 'bg-ink text-on-primary'
                            : 'bg-canvas-soft border border-hairline text-body hover:text-ink'
                        )}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolutionToggle(item.key, 'SKIP')}
                        className={cn(
                          'px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium transition-all cursor-pointer',
                          item.conflictResolution === 'SKIP'
                            ? 'bg-ink text-on-primary'
                            : 'bg-canvas-soft border border-hairline text-body hover:text-ink'
                        )}
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('input')}
                className="h-8 text-xs rounded-[6px] border-hairline font-medium"
              >
                Back to Edit
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                isLoading={loading}
                className="h-8 text-xs rounded-[6px] bg-ink text-on-primary hover:bg-ink/90 font-medium shadow-vercel"
              >
                Import {previewList.length} Variables
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
