'use client';

import * as React from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SecretFieldProps {
  value?: string;
  isSensitive?: boolean;
  onReveal?: () => Promise<string | void>;
  onCopy?: () => void;
  className?: string;
  autoHideDuration?: number; // ms, defaults to 30000
}

export function SecretField({
  value,
  isSensitive = true,
  onReveal,
  onCopy,
  className,
  autoHideDuration = 30000,
}: SecretFieldProps) {
  // If value is explicitly provided from a parent reveal-all, reveal immediately!
  const [revealed, setRevealed] = React.useState(!isSensitive || !!value);
  const [revealedValue, setRevealedValue] = React.useState<string | null>(
    value !== undefined ? value : !isSensitive ? '' : null
  );
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Sync when parent provides or clears value (e.g. from Reveal All / Hide All)
  React.useEffect(() => {
    if (value !== undefined && value !== null) {
      setRevealed(true);
      setRevealedValue(value);
    } else if (isSensitive) {
      setRevealed(false);
      setRevealedValue(null);
    }
  }, [value, isSensitive]);

  // Auto-hide timer for individual reveal
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
    let textToCopy = revealedValue || value;

    if (!textToCopy && onReveal) {
      try {
        const fetched = await onReveal();
        if (typeof fetched === 'string') {
          textToCopy = fetched;
        }
      } catch (err) {
        toast.error('Could not fetch secret to copy');
        return;
      }
    }

    if (textToCopy !== undefined && textToCopy !== null) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onCopy?.();
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayValue = revealed
    ? revealedValue !== null
      ? revealedValue
      : value || ''
    : '••••••••••••••••';

  return (
    <div className={`flex items-center gap-1.5 ${className || ''}`}>
      <div
        className={`font-mono text-xs px-2.5 py-1 rounded-[4px] bg-muted/60 border border-border max-w-[240px] sm:max-w-[380px] truncate select-all transition-colors ${
          !revealed ? 'tracking-widest text-muted-foreground font-bold' : 'text-foreground font-medium'
        }`}
        title={revealed ? displayValue : 'Click eye icon to reveal'}
      >
        {displayValue}
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
    </div>
  );
}
