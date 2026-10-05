import * as React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationDropdownProps {
  notifications: any[];
  unreadCount: number;
  onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}: NotificationDropdownProps) {
  return (
    <>
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
        <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-[10px] text-primary hover:underline font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs">
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <Link
                key={notif.id}
                href={notif.link || '#'}
                onClick={() => {
                  if (!notif.read) onMarkAsRead(notif.id);
                  onClose();
                }}
                className={cn(
                  "block p-3 hover:bg-muted/30 transition-colors",
                  !notif.read ? "bg-primary/5" : ""
                )}
              >
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-xs font-semibold text-foreground truncate", !notif.read && "text-primary")}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  {!notif.read && (
                    <button
                      onClick={(e) => onMarkAsRead(notif.id, e)}
                      className="text-muted-foreground hover:text-primary p-1 rounded-sm transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => onDelete(notif.id, e)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-sm transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="p-2.5 border-t border-border bg-muted/20 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <span>View All Notifications</span>
        </Link>
      </div>
    </>
  );
}
