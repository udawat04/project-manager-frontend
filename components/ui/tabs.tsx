'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = React.createContext<TabsContextType>({
  activeTab: '',
  setActiveTab: () => {},
});

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [tab, setTab] = React.useState(defaultValue || '');
  const activeTab = value !== undefined ? value : tab;

  const setActiveTab = (val: string) => {
    if (value === undefined) {
      setTab(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-start rounded-[8px] border border-border bg-muted/70 p-1 text-muted-foreground overflow-x-auto max-w-full gap-1 shadow-xs',
        className
      )}
      style={{ backgroundColor: 'var(--muted)' }}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  badge,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
  badge?: number | string;
}) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[6px] px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer gap-1.5 select-none',
        isActive
          ? 'bg-card text-foreground font-semibold shadow-sm border border-border/90'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/90',
        className
      )}
      style={
        isActive
          ? {
              backgroundColor: 'var(--card)',
              color: 'var(--card-foreground)',
            }
          : undefined
      }
    >
      {/* Active indicator dot */}
      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block shrink-0" />
      )}
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
            isActive
              ? 'bg-primary/15 text-primary border border-primary/20 font-bold'
              : 'bg-muted-foreground/15 text-muted-foreground'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { activeTab } = React.useContext(TabsContext);
  if (activeTab !== value) return null;

  return (
    <div
      className={cn(
        'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
}
