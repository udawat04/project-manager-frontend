'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X, Crown, Briefcase, Shield, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';

export interface MemberOption {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  isMasterAdmin?: boolean;
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

function getRoleBadgeMeta(role?: string, isMasterAdmin?: boolean) {
  if (isMasterAdmin || role === 'MASTER_ADMIN') {
    return {
      label: 'Master Admin',
      badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      dotClass: 'bg-amber-500',
      icon: Crown,
    };
  }
  if (role === 'PROJECT_MANAGER') {
    return {
      label: 'Project Manager',
      badgeClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      dotClass: 'bg-blue-500',
      icon: Briefcase,
    };
  }
  if (role === 'TEAM_LEAD') {
    return {
      label: 'Team Lead',
      badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      icon: Shield,
    };
  }
  return {
    label: 'Developer',
    badgeClass: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
    dotClass: 'bg-purple-500',
    icon: Code,
  };
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
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
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
      <div className="flex items-center justify-between">
        {label && <label className="text-xs font-semibold text-foreground">{label}</label>}
        {selectedUsers.length > 0 && (
          <span className="text-[11px] text-muted-foreground font-mono">
            {selectedUsers.length} selected
          </span>
        )}
      </div>

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
        {selectedUsers.map((u) => {
          const roleMeta = getRoleBadgeMeta(u.role, u.isMasterAdmin);
          const Icon = roleMeta.icon;
          return (
            <Badge
              key={u.id}
              variant="secondary"
              className="gap-1.5 pl-1.5 pr-1 py-0.5 text-xs font-medium bg-muted text-foreground border border-border/80 hover:bg-muted/90 rounded-[4px] flex items-center"
            >
              <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" dotColorClass={roleMeta.dotClass} />
              <span className="truncate max-w-[100px] font-medium">{u.name}</span>
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold rounded-full border shrink-0',
                  roleMeta.badgeClass
                )}
              >
                <Icon className="h-2.5 w-2.5 mr-0.5" />
                {roleMeta.label}
              </span>
              <button
                type="button"
                onClick={(e) => removeUser(u.id, e)}
                className="p-0.5 hover:bg-foreground/10 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                title={`Remove ${u.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}

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
            className="popover-surface absolute top-1 left-0 z-[200] w-full max-h-64 overflow-y-auto rounded-[6px] border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl animate-in fade-in-80 zoom-in-95"
            style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', opacity: 1 }}
          >
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No members found matching &quot;{search}&quot;.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const roleMeta = getRoleBadgeMeta(u.role, u.isMasterAdmin);
                  const Icon = roleMeta.icon;
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-[6px] text-xs cursor-pointer transition-colors group',
                        isSelected
                          ? 'bg-primary/10 text-foreground font-medium'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" dotColorClass={roleMeta.dotClass} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs truncate leading-tight">{u.name}</span>
                            <span
                              className={cn(
                                'inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold rounded-full border shrink-0',
                                roleMeta.badgeClass
                              )}
                            >
                              <Icon className="h-2.5 w-2.5 mr-1" />
                              {roleMeta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        {isSelected ? (
                          <div className="h-4 w-4 rounded bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded border border-muted-foreground/40 group-hover:border-primary/60 transition-colors" />
                        )}
                      </div>
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
