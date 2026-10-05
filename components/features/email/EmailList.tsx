import * as React from 'react';
import { format } from 'date-fns';

interface EmailListProps {
  emails: any[];
}

export function EmailList({ emails }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground text-sm">
        No emails found. Click sync to fetch your latest messages.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={email.onClick}
          className="p-4 hover:bg-muted/40 transition-colors cursor-pointer group flex flex-col sm:flex-row gap-2 sm:items-center"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground truncate">
                {email.fromName || email.fromAddress}
              </span>
              {!email.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
            <h4 className={`text-sm truncate ${email.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
              {email.subject || '(No Subject)'}
            </h4>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {email.snippet}
            </p>
          </div>
          <div className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(email.date), 'MMM d, h:mm a')}
          </div>
        </div>
      ))}
    </div>
  );
}
