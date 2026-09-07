'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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
    <div className={cn('relative w-full text-left', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-[6px] border border-border bg-card px-3 py-1 text-xs text-foreground shadow-xs transition-colors hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          open && 'ring-1 ring-ring border-ring'
        )}
        style={{ backgroundColor: 'var(--card)' }}
      >
        <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {/* Options Popup */}
      {open && (
        <div
          className="popover-surface absolute z-[200] mt-1 max-h-60 w-full overflow-y-auto rounded-[6px] border border-border bg-popover p-1 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95"
          style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', opacity: 1 }}
        >
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-[4px] px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer select-none',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted hover:text-foreground text-foreground'
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className={cn('text-[10px] truncate', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
