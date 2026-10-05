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
  CheckSquare,
  Mail,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/providers/auth-provider';
import { useChat } from '@/providers/chat-provider';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export const getNavigationItems = (isMasterAdmin?: boolean) => {
  if (isMasterAdmin) {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'Team Workload', href: '/admin/workload', icon: CheckSquare },
      { name: 'Chat', href: '/chat', icon: MessageSquare },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Email', href: '/email', icon: Mail },
      { name: 'Platforms', href: '/platforms', icon: Server },
      { name: 'Credentials', href: '/credentials', icon: KeyRound },
      { name: 'Members', href: '/members', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];
  }

  return [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Kanban Board', href: '/tasks', icon: CheckSquare },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Credentials', href: '/credentials', icon: KeyRound },
  ];
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalUnread } = useChat();
  const [unreadNotifs, setUnreadNotifs] = React.useState(0);

  const isMasterAdmin = user?.isMasterAdmin || user?.role === 'MASTER_ADMIN';
  const navItems = getNavigationItems(isMasterAdmin);

  React.useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      api.getUnreadNotificationCount()
        .then((res) => setUnreadNotifs(res.count || 0))
        .catch(() => {});
    };
    fetchCount();
    window.addEventListener('tasks_updated', fetchCount);
    return () => window.removeEventListener('tasks_updated', fetchCount);
  }, [user]);

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
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
              <span>{item.name}</span>
              {item.name === 'Chat' && totalUnread > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                  {totalUnread}
                </div>
              )}
              {item.name === 'Notifications' && unreadNotifs > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </div>
              )}
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
