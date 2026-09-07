'use client';

import * as React from 'react';
import { Search, X, Check, ChevronsUpDown } from 'lucide-react';
import { TechnologyIcon } from './technology-icon';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export interface TechOption {
  name: string;
  category?: string;
}

interface TechnologyComboboxProps {
  label?: string;
  placeholder?: string;
  options?: TechOption[];
  availableTechnologies?: TechOption[];
  selected?: string[];
  selectedTechnologies?: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export function TechnologyCombobox({
  label,
  placeholder = 'Search technologies...',
  options: propOptions,
  availableTechnologies,
  selected: propSelected,
  selectedTechnologies,
  onChange,
  disabled = false,
}: TechnologyComboboxProps) {
  const options = propOptions || availableTechnologies || [];
  const selected = propSelected || selectedTechnologies || [];
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  const filteredOptions = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.category && opt.category.toLowerCase().includes(q))
    );
  }, [options, search]);

  const toggleSelect = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((item) => item !== name));
    } else {
      onChange([...selected, name]);
    }
    setSearch('');
  };

  const removeSelected = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== name));
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && <label className="text-xs font-semibold text-foreground">{label}</label>}

      {/* Selected Chips Row + Trigger Input */}
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
        {selected.map((item) => (
          <Badge
            key={item}
            variant="secondary"
            className="gap-1.5 pl-2 pr-1 py-0.5 text-xs font-medium bg-muted text-foreground border border-border/80 hover:bg-muted/80 rounded-[4px]"
          >
            <TechnologyIcon name={item} size={13} />
            <span>{item}</span>
            <button
              type="button"
              onClick={(e) => removeSelected(item, e)}
              className="p-0.5 hover:bg-foreground/10 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title={`Remove ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <div className="flex-1 min-w-[120px] flex items-center justify-between px-1">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : 'Add more...'}
            disabled={disabled}
            className="w-full text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-60" />
        </div>
      </div>

      {/* Dropdown Options Menu */}
      {open && (
        <div className="relative">
          <div
            className="popover-surface absolute top-1 left-0 z-[200] w-full max-h-56 overflow-y-auto rounded-[6px] border border-border bg-popover p-1 text-popover-foreground shadow-2xl animate-in fade-in-80 zoom-in-95"
            style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', opacity: 1 }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No technology found for &quot;{search}&quot;.
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => toggleSelect(search.trim())}
                    className="mt-1 block mx-auto text-primary text-xs font-medium hover:underline cursor-pointer"
                  >
                    + Add custom &quot;{search.trim()}&quot;
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredOptions.map((opt) => {
                  const isSelected = selected.includes(opt.name);
                  return (
                    <div
                      key={opt.name}
                      onClick={() => toggleSelect(opt.name)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-[4px] text-xs cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <TechnologyIcon name={opt.name} size={15} />
                        <span>{opt.name}</span>
                        {opt.category && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {opt.category}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
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
