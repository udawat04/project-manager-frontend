'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface MemberOption {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface MemberComboboxProps {
  users: MemberOption[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
}

export function MemberCombobox({
  users,
  selectedUserIds,
  onChange,
  label,
  placeholder = 'Search & select members...',
  disabled = false,
  multiple = true,
  className,
}: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const selectedUsers = React.useMemo(() => {
    return users.filter((u) => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  const toggleUser = (userId: string) => {
    if (multiple) {
      if (selectedUserIds.includes(userId)) {
        onChange(selectedUserIds.filter((id) => id !== userId));
      } else {
        onChange([...selectedUserIds, userId]);
      }
    } else {
      onChange([userId]);
      setOpen(false);
    }
    setSearch('');
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  return (
    <div className={cn('space-y-1.5 w-full text-left', className)} ref={containerRef}>
      {label && <label className="text-xs font-semibold text-foreground">{label}</label>}

      {/* Trigger & Selected Chips Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={cn(
          'min-h-10 w-full rounded-[6px] border border-border bg-card p-1.5 transition-colors cursor-pointer flex flex-wrap items-center gap-1.5 shadow-xs focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ backgroundColor: 'var(--card)' }}
      >
        {selectedUsers.map((u) => (
          <Badge
            key={u.id}
            variant="secondary"
            className="gap-1.5 pl-1.5 pr-1 py-0.5 text-xs font-medium bg-muted text-foreground border border-border/80 hover:bg-muted/90 rounded-[4px]"
          >
            <div className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold uppercase shrink-0">
              {u.name.charAt(0)}
            </div>
            <span className="truncate max-w-[120px]">{u.name}</span>
            <button
              type="button"
              onClick={(e) => removeUser(u.id, e)}
              className="p-0.5 hover:bg-foreground/10 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title={`Remove ${u.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <div className="flex-1 min-w-[140px] flex items-center justify-between px-1">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selectedUsers.length === 0 ? placeholder : 'Add more members...'}
            disabled={disabled}
            className="w-full text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-60 ml-1" />
        </div>
      </div>

      {/* Dropdown Options Popup */}
      {open && (
        <div className="relative">
          <div
            className="popover-surface absolute top-1 left-0 z-[200] w-full max-h-60 overflow-y-auto rounded-[6px] border border-border bg-popover p-1 text-popover-foreground shadow-2xl animate-in fade-in-80 zoom-in-95"
            style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', opacity: 1 }}
          >
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No members found matching &quot;{search}&quot;.
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-[4px] text-xs cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold uppercase text-foreground shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate leading-tight">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
