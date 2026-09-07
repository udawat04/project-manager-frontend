'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            'popover-surface absolute z-[200] mt-1 min-w-[160px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', opacity: 1 }}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer select-none',
                item.destructive
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'hover:bg-accent hover:text-accent-foreground',
                item.disabled && 'opacity-50 pointer-events-none'
              )}
            >
              {item.icon && <span className="h-3.5 w-3.5 flex items-center">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
