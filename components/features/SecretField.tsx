'use client';

import * as React from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SecretFieldProps {
  value?: string | null;
  isSensitive?: boolean;
  onReveal?: () => Promise<string | void>;
  onCopy?: () => void;
  className?: string;
  autoHideDuration?: number; // ms, defaults to 30000
  allowReveal?: boolean;
  allowCopy?: boolean;
}

export function SecretField({
  value,
  isSensitive = true,
  onReveal,
  onCopy,
  className,
  autoHideDuration = 30000,
  allowReveal = true,
  allowCopy = true,
}: SecretFieldProps) {
  // If value is explicitly provided or not sensitive, reveal immediately
  const [revealed, setRevealed] = React.useState(!isSensitive || !!value);
  const [revealedValue, setRevealedValue] = React.useState<string | null>(
    value !== undefined && value !== null ? value : null
  );
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Sync when parent provides or updates value
  React.useEffect(() => {
    if (value !== undefined && value !== null) {
      setRevealed(true);
      setRevealedValue(value);
    } else if (isSensitive) {
      setRevealed(false);
      setRevealedValue(null);
    }
  }, [value, isSensitive]);

  // If field is not sensitive but value hasn't arrived yet, auto-fetch from onReveal
  React.useEffect(() => {
    if (!isSensitive && !value && !revealedValue && onReveal) {
      setLoading(true);
      onReveal()
        .then((fetched) => {
          if (typeof fetched === 'string') {
            setRevealedValue(fetched);
            setRevealed(true);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isSensitive, value, onReveal]);

  // Auto-hide timer for individual reveal of sensitive values
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (revealed && isSensitive && !value) {
      timer = setTimeout(() => {
        setRevealed(false);
        setRevealedValue(null);
      }, autoHideDuration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [revealed, isSensitive, value, autoHideDuration]);

  const handleToggleReveal = async () => {
    if (!allowReveal) {
      toast.error('You do not have permission to reveal this secret.');
      return;
    }

    if (revealed) {
      setRevealed(false);
      setRevealedValue(null);
      return;
    }

    if (value) {
      setRevealed(true);
      setRevealedValue(value);
      return;
    }

    if (onReveal) {
      setLoading(true);
      try {
        const fetched = await onReveal();
        if (typeof fetched === 'string') {
          setRevealedValue(fetched);
        }
        setRevealed(true);
      } catch (err: any) {
        toast.error(err.message || 'Failed to decrypt secret');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!allowCopy) {
      toast.error('You do not have permission to copy this secret.');
      return;
    }

    let textToCopy = revealedValue !== null && revealedValue !== undefined ? revealedValue : value;

    if ((!textToCopy || textToCopy === '') && onReveal) {
      try {
        setLoading(true);
        const fetched = await onReveal();
        if (typeof fetched === 'string') {
          textToCopy = fetched;
          setRevealedValue(fetched);
          setRevealed(true);
        }
      } catch {
        toast.error('Failed to copy secret');
        return;
      } finally {
        setLoading(false);
      }
    }

    if (textToCopy !== null && textToCopy !== undefined) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onCopy?.();
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayValue = revealed
    ? revealedValue !== null && revealedValue !== undefined
      ? revealedValue
      : value || ''
    : '••••••••••••••••';

  return (
    <div className={`flex items-center gap-1.5 ${className || ''}`}>
      <div
        className={`font-mono text-xs px-2.5 py-1 rounded-[4px] bg-muted/60 border border-border min-w-[70px] max-w-[240px] sm:max-w-[380px] truncate select-all transition-colors ${
          !revealed ? 'tracking-widest text-muted-foreground font-bold' : 'text-foreground font-medium'
        }`}
        title={revealed ? displayValue : 'Click eye icon to reveal'}
      >
        {loading ? (
          <span className="text-muted-foreground animate-pulse text-[11px]">decrypting...</span>
        ) : (
          displayValue || <span className="text-muted-foreground/60 italic text-[11px]">empty</span>
        )}
      </div>

      {isSensitive && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleToggleReveal}
          isLoading={loading}
          title={revealed ? 'Hide secret' : 'Reveal secret'}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
      )}

      {allowCopy && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          title="Copy value"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </div>
  );
}
