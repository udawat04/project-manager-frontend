'use client';

import * as React from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CopyAllCredentialsButtonProps {
  projectId?: string;
  platformAccountId?: string;
  credentialsCount?: number;
}

export function CopyAllCredentialsButton({
  projectId,
  platformAccountId,
  credentialsCount = 0,
}: CopyAllCredentialsButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopyAll = async () => {
    if (credentialsCount === 0) {
      toast.info('No credentials to copy');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch credentials list
      const res = await api.getCredentials({
        projectId,
        platformAccountId,
      });

      if (!res.credentials || res.credentials.length === 0) {
        toast.info('No credentials found');
        return;
      }

      // 2. Decrypt all credentials in memory
      const decryptedResults = await Promise.all(
        res.credentials.map((c: any) => api.revealCredential(c.id))
      );

      // 3. Format into a clean text block
      const lines: string[] = [];
      decryptedResults.forEach((cred: any) => {
        lines.push(`### ${cred.name} (${cred.type}) ###`);
        cred.fields.forEach((f: any) => {
          lines.push(`${f.name}=${f.value}`);
        });
        lines.push('');
      });

      const formatted = lines.join('\n').trim();
      await navigator.clipboard.writeText(formatted);

      setCopied(true);
      toast.success(`Copied all ${res.credentials.length} credentials to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to copy credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
      onClick={handleCopyAll}
      disabled={loading || credentialsCount === 0}
      title="Copy all credentials in this project"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span>{copied ? 'Copied All' : 'Copy All Credentials'}</span>
    </Button>
  );
}
