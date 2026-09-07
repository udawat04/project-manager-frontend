'use client';

import * as React from 'react';
import { SecretField } from '@/components/features/SecretField';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Copy, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface EnvVarItem {
  id: string;
  environmentId: string;
  key: string;
  isSensitive: boolean;
  description?: string | null;
  value?: string;
}

interface EnvVariableTableProps {
  variables: EnvVarItem[];
  revealedAllMap: Record<string, string>;
  onEdit: (item: EnvVarItem) => void;
  onDelete: (item: EnvVarItem) => void;
}

export function EnvVariableTable({
  variables,
  revealedAllMap,
  onEdit,
  onDelete,
}: EnvVariableTableProps) {
  return (
    <div className="w-full">
      {/* Desktop Table View - Valid HTML Table Structure */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              <th className="py-2.5 px-4 font-medium">Key</th>
              <th className="py-2.5 px-4 font-medium">Value</th>
              <th className="py-2.5 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {variables.map((item) => (
              <EnvTableRow
                key={item.id}
                item={item}
                revealedValue={revealedAllMap[item.id]}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="sm:hidden p-3 space-y-2.5">
        {variables.map((item) => (
          <EnvMobileCard
            key={item.id}
            item={item}
            revealedValue={revealedAllMap[item.id]}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function EnvTableRow({
  item,
  revealedValue,
  onEdit,
  onDelete,
}: {
  item: EnvVarItem;
  revealedValue?: string;
  onEdit: (item: EnvVarItem) => void;
  onDelete: (item: EnvVarItem) => void;
}) {
  const [localValue, setLocalValue] = React.useState<string | undefined>(revealedValue);

  React.useEffect(() => {
    setLocalValue(revealedValue);
  }, [revealedValue]);

  const handleReveal = async (): Promise<string> => {
    if (localValue) return localValue;
    const res = await api.revealVariable(item.id);
    setLocalValue(res.value);
    return res.value;
  };

  const handleCopyValue = async () => {
    try {
      const val = localValue || (await handleReveal());
      await navigator.clipboard.writeText(val);
      await api.logCopyAction(item.id, 'VALUE');
      toast.success(`Copied ${item.key} value`);
    } catch {
      toast.error('Failed to copy value');
    }
  };

  const handleCopyKeyValue = async () => {
    try {
      const val = localValue || (await handleReveal());
      await navigator.clipboard.writeText(`${item.key}=${val}`);
      await api.logCopyAction(item.id, 'KEY_VALUE');
      toast.success(`Copied ${item.key}=${val.length > 8 ? val.substring(0, 8) + '...' : val}`);
    } catch {
      toast.error('Failed to copy KEY=VALUE');
    }
  };

  const menuItems = [
    { label: 'Copy Value', icon: <Copy className="h-3.5 w-3.5" />, onClick: handleCopyValue },
    { label: 'Copy KEY=VALUE', icon: <Copy className="h-3.5 w-3.5" />, onClick: handleCopyKeyValue },
    { label: 'Edit', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onEdit(item) },
    { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => onDelete(item), destructive: true },
  ];

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground tracking-tight select-all">
              {item.key}
            </span>
            {item.isSensitive ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                Secret
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono text-muted-foreground">
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
          value={localValue}
          isSensitive={item.isSensitive}
          onReveal={handleReveal}
          onCopy={() => api.logCopyAction(item.id, 'VALUE')}
        />
      </td>
      <td className="py-3 px-4 align-middle text-right">
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          items={menuItems}
        />
      </td>
    </tr>
  );
}

function EnvMobileCard({
  item,
  revealedValue,
  onEdit,
  onDelete,
}: {
  item: EnvVarItem;
  revealedValue?: string;
  onEdit: (item: EnvVarItem) => void;
  onDelete: (item: EnvVarItem) => void;
}) {
  const [localValue, setLocalValue] = React.useState<string | undefined>(revealedValue);

  React.useEffect(() => {
    setLocalValue(revealedValue);
  }, [revealedValue]);

  const handleReveal = async (): Promise<string> => {
    if (localValue) return localValue;
    const res = await api.revealVariable(item.id);
    setLocalValue(res.value);
    return res.value;
  };

  const handleCopyValue = async () => {
    try {
      const val = localValue || (await handleReveal());
      await navigator.clipboard.writeText(val);
      await api.logCopyAction(item.id, 'VALUE');
      toast.success(`Copied ${item.key} value`);
    } catch {
      toast.error('Failed to copy value');
    }
  };

  const handleCopyKeyValue = async () => {
    try {
      const val = localValue || (await handleReveal());
      await navigator.clipboard.writeText(`${item.key}=${val}`);
      await api.logCopyAction(item.id, 'KEY_VALUE');
      toast.success(`Copied ${item.key}=${val.length > 8 ? val.substring(0, 8) + '...' : val}`);
    } catch {
      toast.error('Failed to copy KEY=VALUE');
    }
  };

  const menuItems = [
    { label: 'Copy Value', icon: <Copy className="h-3.5 w-3.5" />, onClick: handleCopyValue },
    { label: 'Copy KEY=VALUE', icon: <Copy className="h-3.5 w-3.5" />, onClick: handleCopyKeyValue },
    { label: 'Edit', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onEdit(item) },
    { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => onDelete(item), destructive: true },
  ];

  return (
    <div className="p-3.5 rounded-[8px] border border-border bg-card flex flex-col gap-2 shadow-vercel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground select-all">
            {item.key}
          </span>
          {item.isSensitive ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              Secret
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
              Public
            </Badge>
          )}
        </div>
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
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
          value={localValue}
          isSensitive={item.isSensitive}
          onReveal={handleReveal}
          onCopy={() => api.logCopyAction(item.id, 'VALUE')}
        />
      </div>
    </div>
  );
}
