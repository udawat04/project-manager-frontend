'use client';

import * as React from 'react';
import { SecretField } from './SecretField';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Copy, Eye, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface EnvVarItem {
  id: string;
  environmentId: string;
  key: string;
  isSensitive: boolean;
  description?: string | null;
  value?: string; // If revealed in parent
}

interface EnvVariableRowProps {
  item: EnvVarItem;
  revealedValue?: string;
  onEdit: (item: EnvVarItem) => void;
  onDelete: (item: EnvVarItem) => void;
}

export function EnvVariableRow({
  item,
  revealedValue,
  onEdit,
  onDelete,
}: EnvVariableRowProps) {
  const [localRevealed, setLocalRevealed] = React.useState<string | null>(
    revealedValue || null
  );

  React.useEffect(() => {
    if (revealedValue !== undefined) {
      setLocalRevealed(revealedValue);
    }
  }, [revealedValue]);

  const handleReveal = async (): Promise<string> => {
    if (localRevealed) return localRevealed;
    const res = await api.revealVariable(item.id);
    setLocalRevealed(res.value);
    return res.value;
  };

  const handleCopyValue = async () => {
    try {
      const val = localRevealed || (await handleReveal());
      await navigator.clipboard.writeText(val);
      await api.logCopyAction(item.id, 'VALUE');
      toast.success(`Copied ${item.key} value`);
    } catch (e: any) {
      toast.error('Failed to copy value');
    }
  };

  const handleCopyKeyValue = async () => {
    try {
      const val = localRevealed || (await handleReveal());
      const text = `${item.key}=${val}`;
      await navigator.clipboard.writeText(text);
      await api.logCopyAction(item.id, 'KEY_VALUE');
      toast.success(`Copied ${item.key}=${val.length > 8 ? val.substring(0, 8) + '...' : val}`);
    } catch (e: any) {
      toast.error('Failed to copy KEY=VALUE');
    }
  };

  const menuItems = [
    {
      label: 'Copy Value',
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: handleCopyValue,
    },
    {
      label: 'Copy KEY=VALUE',
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: handleCopyKeyValue,
    },
    {
      label: 'Edit',
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: () => onEdit(item),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: () => onDelete(item),
      destructive: true,
    },
  ];

  return (
    <>
      {/* Desktop View (Table Row) */}
      <tr className="hidden sm:table-row border-b border-border/50 hover:bg-muted/30 transition-colors group">
        <td className="py-3 px-4 align-middle">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-foreground tracking-tight select-all">
                {item.key}
              </span>
              {item.isSensitive ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  Secret
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
                  Public
                </Badge>
              )}
            </div>
            {item.description && (
              <span className="text-[11px] text-muted-foreground line-clamp-1">
                {item.description}
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 align-middle">
          <SecretField
            value={localRevealed || undefined}
            isSensitive={item.isSensitive}
            onReveal={handleReveal}
            onCopy={() => api.logCopyAction(item.id, 'VALUE')}
          />
        </td>
        <td className="py-3 px-4 align-middle text-right">
          <DropdownMenu
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            items={menuItems}
          />
        </td>
      </tr>

      {/* Mobile View (Stacked Card) */}
      <div className="sm:hidden p-3 rounded-lg border border-border bg-card flex flex-col gap-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold select-all text-foreground">
              {item.key}
            </span>
            {item.isSensitive && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-3.5">
                Secret
              </Badge>
            )}
          </div>
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            }
            items={menuItems}
          />
        </div>

        {item.description && (
          <p className="text-[11px] text-muted-foreground">{item.description}</p>
        )}

        <div className="pt-1">
          <SecretField
            value={localRevealed || undefined}
            isSensitive={item.isSensitive}
            onReveal={handleReveal}
            onCopy={() => api.logCopyAction(item.id, 'VALUE')}
          />
        </div>
      </div>
    </>
  );
}
