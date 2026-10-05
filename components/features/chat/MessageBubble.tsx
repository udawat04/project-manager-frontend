import * as React from 'react';
import { format } from 'date-fns';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';

interface MessageBubbleProps {
  message: any;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="shrink-0 mt-auto">
          <UserAvatar 
            name={message.sender?.name || 'Unknown'} 
            avatarUrl={message.sender?.avatarUrl} 
            size="sm" 
          />
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          {!isMine && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-semibold text-foreground/80">{message.sender?.name || 'Unknown User'}</span>
              {message.sender?.role && (
                <Badge variant="outline" className="text-[9px] uppercase h-4 px-1 py-0 shadow-none border-border/50 text-muted-foreground bg-background">
                  {message.sender.role.replace('_', ' ')}
                </Badge>
              )}
            </div>
          )}
          
          <div className={`rounded-xl px-4 py-2.5 shadow-sm ${
            isMine 
              ? 'bg-primary text-primary-foreground rounded-br-sm' 
              : 'bg-card border border-border text-foreground rounded-bl-sm'
          }`}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          
          <span className={`text-[10px] px-1 text-muted-foreground ${isMine ? 'text-right' : 'text-left'}`}>
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
      </div>
    </div>
  );
}
