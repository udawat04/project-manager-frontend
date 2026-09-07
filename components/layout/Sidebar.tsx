'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Server,
  KeyRound,
  Users,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Platforms', href: '/platforms', icon: Server },
  { name: 'Credentials', href: '/credentials', icon: KeyRound },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card text-card-foreground shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-6 border-b border-border/80 gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
          <Shield className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground">ProjectVault</span>
          <span className="text-[10px] text-muted-foreground font-mono">v1.0 • Enterprise</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border/80 bg-muted/20">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-foreground">{user?.name || 'Project Admin'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'admin@vault.io'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
