'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import * as Popover from '@radix-ui/react-popover';
import { NotificationDropdown } from './NotificationDropdown';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/sound';
import { api, getStoredToken } from '@/lib/api';

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  const isInitialLoadRef = React.useRef(true);
  const seenNotifIdsRef = React.useRef<Set<string>>(new Set());

  // Function to process incoming notification lists and trigger sound/toast on new unread items
  const processIncomingNotifications = React.useCallback((incoming: any[]) => {
    let unread = 0;
    const newItems: any[] = [];

    incoming.forEach((n) => {
      if (!n.read) unread++;
      if (!isInitialLoadRef.current && !seenNotifIdsRef.current.has(n.id) && !n.read) {
        newItems.push(n);
      }
      seenNotifIdsRef.current.add(n.id);
    });

    if (newItems.length > 0) {
      // Play audio chime
      playNotificationSound();
      // Show toast
      newItems.forEach((item) => {
        toast.info(item.title || 'New Task Notification', {
          description: item.message,
        });
      });
      // Synchronize task boards and tables
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    }

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }

    setNotifications(incoming);
    setUnreadCount(unread);
  }, []);

  // 1. Initial load of notifications on mount (NO polling loop)
  React.useEffect(() => {
    if (!user) return;

    let isMounted = true;
    api
      .getNotifications()
      .then((res) => {
        if (isMounted && res?.notifications) {
          processIncomingNotifications(res.notifications);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user, processIncomingNotifications]);

  // 2. Real-time Push via Server-Sent Events (SSE)
  React.useEffect(() => {
    if (!user) return;

    const token = getStoredToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const streamUrl = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token || '')}`;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isDisposed = false;

    const connectStream = () => {
      if (isDisposed) return;
      try {
        eventSource = new EventSource(streamUrl, { withCredentials: true });

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NOTIFICATION' && data.notification) {
              const notif = data.notification;

              // Play real-time notification chime
              playNotificationSound();

              // Trigger real-time toast alert
              toast.info(notif.title || 'New Task Notification', {
                description: notif.message,
              });

              // Add notification to state
              setNotifications((prev) => {
                if (prev.some((item) => item.id === notif.id)) return prev;
                return [notif, ...prev];
              });
              setUnreadCount((prev) => prev + 1);

              // Instantly update task boards and lists
              window.dispatchEvent(new CustomEvent('tasks_updated'));
            }
          } catch {
            // Ignore keep-alive or ping parse errors
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connectStream, 4000);
          }
        };
      } catch (err) {
        console.warn('[NotificationBell] SSE connection failed:', err);
      }
    };

    connectStream();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [user]);

  // Firestore real-time listener if available
  React.useEffect(() => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.id)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifs: any[] = [];
          snapshot.forEach((doc) => {
            notifs.push({ id: doc.id, ...doc.data() });
          });
          if (notifs.length > 0) {
            notifs.sort((a, b) => {
              const tA = new Date(a.createdAt || 0).getTime();
              const tB = new Date(b.createdAt || 0).getTime();
              return tB - tA;
            });
            processIncomingNotifications(notifs);
          }
        },
        () => {
          // Handled by SSE stream & initial load
        }
      );

      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, [user, processIncomingNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Also try Firestore
      try {
        const docRef = doc(db, 'notifications', id);
        await updateDoc(docRef, { read: true });
      } catch {}
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      // Also try Firestore
      try {
        const batch = writeBatch(db);
        notifications.forEach((n) => {
          if (!n.read) {
            const docRef = doc(db, 'notifications', n.id);
            batch.update(docRef, { read: true });
          }
        });
        await batch.commit();
      } catch {}
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const deleted = notifications.find((n) => n.id === id);
        return deleted && !deleted.read ? Math.max(0, prev - 1) : prev;
      });

      // Also try Firestore
      try {
        const docRef = doc(db, 'notifications', id);
        await deleteDoc(docRef);
      } catch {}
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button className="relative flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 rounded-lg border border-border bg-card p-0 shadow-lg animate-in slide-in-from-top-2"
          align="end"
          sideOffset={8}
        >
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onClose={() => setIsOpen(false)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
