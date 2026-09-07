'use client';

import * as React from 'react';
import { Search, Sun, Moon, Laptop, Menu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/theme-provider';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { MobileNav } from './MobileNav';

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const themeMenuItems = [
    {
      label: 'Light',
      icon: <Sun className="h-3.5 w-3.5" />,
      onClick: () => setTheme('light'),
    },
    {
      label: 'Dark',
      icon: <Moon className="h-3.5 w-3.5" />,
      onClick: () => setTheme('dark'),
    },
    {
      label: 'System',
      icon: <Laptop className="h-3.5 w-3.5" />,
      onClick: () => setTheme('system'),
    },
  ];

  return (
    <>
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        {/* Mobile menu trigger & title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 md:hidden">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">ProjectVault</span>
          </div>

          {title && (
            <h1 className="hidden md:block text-sm font-semibold text-foreground tracking-tight">
              {title}
            </h1>
          )}
        </div>

        {/* Right side: Search trigger + Theme toggle */}
        <div className="flex items-center gap-2">
          {/* Cmd+K trigger button */}
          <button
            type="button"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: true,
                metaKey: true,
              });
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search anything...</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-background px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </button>

          {/* Theme Switcher */}
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                {theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Laptop className="h-4 w-4" />
                )}
              </Button>
            }
            items={themeMenuItems}
            align="right"
          />
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
