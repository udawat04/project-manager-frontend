'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  ExternalLink,
  Sparkles,
  Inbox,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { playNotificationSound } from '@/lib/sound';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [clearing, setClearing] = React.useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);

  // Load initial notifications from database
  const loadNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user, loadNotifications]);

  // Real-time Firestore sync on notifications page
  React.useEffect(() => {
    if (!user) return;

    try {
      // Query without composite index requirement
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.id)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const remoteNotifs: any[] = [];
          snapshot.forEach((doc) => {
            remoteNotifs.push({ id: doc.id, ...doc.data() });
          });

          if (remoteNotifs.length > 0) {
            // Sort by createdAt descending in memory
            remoteNotifs.sort((a, b) => {
              const tA = new Date(a.createdAt || 0).getTime();
              const tB = new Date(b.createdAt || 0).getTime();
              return tB - tA;
            });
            setNotifications(remoteNotifs);
          }
        },
        () => {
          // Fallback handled by loadNotifications & global listener
        }
      );

      return () => unsubscribe();
    } catch {
      // Optional firestore
    }
  }, [user]);

  // Listen to tasks_updated or external notification events
  React.useEffect(() => {
    const handleUpdate = () => {
      loadNotifications();
    };
    window.addEventListener('tasks_updated', handleUpdate);
    return () => window.removeEventListener('tasks_updated', handleUpdate);
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      toast.success('Marked as read');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      setConfirmClearOpen(false);
      toast.success('All notifications cleared');
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear notifications');
    } finally {
      setClearing(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'read') return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-mono">
            Task Assigned
          </Badge>
        );
      case 'SUBTASK_ADDED':
        return (
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] font-mono">
            Subtask
          </Badge>
        );
      case 'TASK_UPDATED':
      case 'STATUS_CHANGED':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-mono">
            Updated
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-border text-[10px] font-mono">
            Activity
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 text-xs px-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time alerts for assigned tasks, subtasks, project updates, and team activity.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear all</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted">
              {notifications.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              filter === 'read'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Read</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted">
              {readCount}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/20 animate-pulse border border-border" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-card/50">
          <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No notifications found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have caught up with all your alerts! No unread notifications.'
              : filter === 'read'
              ? 'No read notifications recorded.'
              : 'You do not have any notifications yet. Alerts for assigned tasks and updates will appear here in real time.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.read;
            const timeAgo = notif.createdAt
              ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
              : 'Recently';

            return (
              <div
                key={notif.id}
                className={`group p-4 rounded-lg border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isUnread
                    ? 'bg-primary/[0.03] border-primary/30 shadow-xs'
                    : 'bg-card/70 border-border hover:bg-muted/20'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Status Indicator Dot */}
                  <div className="mt-1.5 shrink-0">
                    {isUnread ? (
                      <span className="block h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm tracking-tight ${isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/90'}`}>
                        {notif.title}
                      </h4>
                      {getTypeBadge(notif.type)}
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <div className="pt-1">
                        <Link
                          href={notif.link}
                          onClick={() => {
                            if (isUnread) handleMarkAsRead(notif.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <span>Open related view</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-primary gap-1"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Mark read</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear all notifications?"
        description="Are you sure you want to permanently clear all notifications? This action cannot be undone."
        confirmLabel="Clear All"
        variant="destructive"
        onConfirm={handleClearAll}
        isLoading={clearing}
      />
    </div>
  );
}
