'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useChat } from '@/providers/chat-provider';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CreateGroupModal } from './CreateGroupModal';

interface ChatMemberDirectoryProps {
  onSelectMember: (memberId: string, memberName: string, isGroup: boolean, avatarUrl?: string | null) => void;
  activeMemberId: string | null;
}

export function ChatMemberDirectory({ onSelectMember, activeMemberId }: ChatMemberDirectoryProps) {
  const { user } = useAuth();
  const { lastMessages, unreadCounts, markAsRead } = useChat();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const cached = sessionStorage.getItem('chat_directory_items');
        if (cached) {
          setItems(JSON.parse(cached));
          setLoading(false);
        }

        const [usersRes, convRes] = await Promise.all([
          api.getUsers(),
          api.getConversations().catch(() => ({ conversations: [] }))
        ]);

        const others = usersRes.users?.filter((u: any) => u.id !== user?.id).map((u: any) => ({ ...u, itemType: 'user' })) || [];
        const groups = convRes.conversations?.filter((c: any) => c.type === 'group').map((c: any) => ({ ...c, itemType: 'group', id: c.id })) || [];
        
        const combined = [...groups, ...others];
        
        // Sort by recent messages if available
        combined.sort((a, b) => {
          const idA = a.itemType === 'group' ? a.id : [user?.id, a.id].sort().join('_');
          const idB = b.itemType === 'group' ? b.id : [user?.id, b.id].sort().join('_');
          const tA = lastMessages[idA]?.createdAt?.toDate ? lastMessages[idA].createdAt.toDate().getTime() : 0;
          const tB = lastMessages[idB]?.createdAt?.toDate ? lastMessages[idB].createdAt.toDate().getTime() : 0;
          return tB - tA;
        });

        setItems(combined);
        sessionStorage.setItem('chat_directory_items', JSON.stringify(combined));
      } catch (err) {
        console.error('Failed to load chat directory:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user, lastMessages]); // Re-sort when lastMessages change

  if (loading) {
    return (
      <div className="w-64 border-r border-border bg-card flex flex-col p-4 gap-4 animate-pulse">
        <div className="h-6 w-32 bg-muted/50 rounded" />
        <div className="h-10 bg-muted/20 rounded" />
        <div className="h-10 bg-muted/20 rounded" />
        <div className="h-10 bg-muted/20 rounded" />
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
          Messages
          <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {items.length}
          </span>
        </h2>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1 rounded-md" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-3 h-3" />
          <Users className="w-3 h-3" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {items.map((item) => {
          const isGroup = item.itemType === 'group';
          const chatId = isGroup ? item.id : [user?.id, item.id].sort().join('_');
          const lastMsg = lastMessages[chatId];
          const unread = unreadCounts[chatId] || 0;

          return (
          <button
            key={item.id}
            onClick={() => {
              onSelectMember(item.id, item.name, isGroup, item.avatarUrl);
              markAsRead(chatId);
            }}
            className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left relative ${
              activeMemberId === item.id
                ? 'bg-primary/10 text-primary hover:bg-primary/15'
                : 'hover:bg-muted/50'
            }`}
          >
            <div className="relative">
              {isGroup ? (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
              ) : (
                <UserAvatar 
                  name={item.name} 
                  avatarUrl={item.avatarUrl} 
                  size="md" 
                  dotColorClass={!isGroup ? 'bg-green-500' : undefined}
                />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-medium truncate text-foreground">
                  {item.name}
                </p>
                {lastMsg && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 flex-shrink-0">
                    {new Date(lastMsg.createdAt?.toDate ? lastMsg.createdAt.toDate() : Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                {lastMsg ? (
                  <>
                    {lastMsg.senderId === user?.id ? (
                      <span className="text-primary font-medium flex-shrink-0">You: </span>
                    ) : isGroup ? (
                      <span className="text-muted-foreground font-medium flex-shrink-0">{lastMsg.senderName?.split(' ')[0]}: </span>
                    ) : null}
                    <span className="truncate">{lastMsg.content}</span>
                  </>
                ) : (
                  <span className="italic opacity-70">No messages yet</span>
                )}
              </div>
            </div>

            {unread > 0 && (
              <div className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0 ml-1">
                {unread}
              </div>
            )}
          </button>
        )})}
        {items.length === 0 && (
          <div className="text-center py-10 text-xs text-muted-foreground">
            No team members found
          </div>
        )}
      </div>

      <CreateGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        availableUsers={items.filter(i => i.itemType === 'user')}
        onGroupCreated={(newGroup) => {
          setItems([{ ...newGroup, itemType: 'group' }, ...items]);
          onSelectMember(newGroup.id, newGroup.name, true);
        }}
      />
    </div>
  );
}
