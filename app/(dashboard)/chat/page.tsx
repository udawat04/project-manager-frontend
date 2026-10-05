'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMemberDirectory } from '@/components/features/chat/ChatMemberDirectory';
import { ChatWindow } from '@/components/features/chat/ChatWindow';
import { useAuth } from '@/providers/auth-provider';

export default function ChatPage() {
  const { user } = useAuth();
  const [activeMemberId, setActiveMemberId] = React.useState<string | null>(null);
  const [activeMemberName, setActiveMemberName] = React.useState<string | null>(null);
  const [activeAvatarUrl, setActiveAvatarUrl] = React.useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = React.useState(false);

  const getChatId = (memberId: string) => {
    if (!user) return null;
    if (isGroupChat) return memberId;
    return [user.id, memberId].sort().join('_');
  };

  const handleSelectMember = (memberId: string, memberName: string, isGroup: boolean, avatarUrl?: string | null) => {
    setActiveMemberId(memberId);
    setActiveMemberName(memberName);
    setIsGroupChat(isGroup);
    setActiveAvatarUrl(avatarUrl || null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Team Chat
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Communicate in real-time with your team members directly
        </p>
      </div>

      <div className="flex flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <ChatMemberDirectory 
          onSelectMember={handleSelectMember}
          activeMemberId={activeMemberId}
        />
        
        {activeMemberId && activeMemberName ? (
          <ChatWindow 
            chatId={getChatId(activeMemberId) || ''}
            chatName={activeMemberName}
            chatAvatarUrl={activeAvatarUrl}
            isGroup={isGroupChat}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Select a team member to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
