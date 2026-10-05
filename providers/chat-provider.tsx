'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { api } from '@/lib/api';

interface ChatContextType {
  lastMessages: Record<string, any>;
  unreadCounts: Record<string, number>;
  totalUnread: number;
  markAsRead: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType>({
  lastMessages: {},
  unreadCounts: {},
  totalUnread: 0,
  markAsRead: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatIds, setChatIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch all potential conversations for the user
    const fetchChats = async () => {
      try {
        const [usersRes, convRes] = await Promise.all([
          api.getUsers().catch(() => ({ users: [] })),
          api.getConversations().catch(() => ({ conversations: [] }))
        ]);

        const ids: string[] = [];
        
        // Group IDs
        convRes.conversations?.forEach((c: any) => {
          if (c.type === 'group') ids.push(c.id);
        });

        // Direct Message IDs
        usersRes.users?.forEach((u: any) => {
          if (u.id !== user.id) {
            ids.push([user.id, u.id].sort().join('_'));
          }
        });

        setChatIds(ids);
      } catch (err) {
        console.error('Failed to fetch chats for provider:', err);
      }
    };

    fetchChats();
  }, [user]);

  useEffect(() => {
    if (!user || chatIds.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    chatIds.forEach(chatId => {
      try {
        const q = query(
          collection(db, `conversations/${chatId}/messages`),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const unsub = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const msg = snapshot.docs[0].data();
            setLastMessages(prev => ({ ...prev, [chatId]: msg }));
            
            // Basic unread simulation: if we are not the sender, and it's new, count it
            // In a real app we'd track "readBy" array on the message. For this prototype,
            // we'll mark it unread if it's not from us. We'll provide a way to clear it.
            if (msg.senderId !== user.id) {
              setUnreadCounts(prev => {
                // Only mark as unread if we haven't read it yet
                if (prev[chatId] === undefined) {
                  return { ...prev, [chatId]: 1 };
                }
                return prev;
              });
            }
          }
        }, (err) => {
          // Ignore permissions errors to prevent console spam if DB is not fully provisioned
        });
        
        unsubscribes.push(unsub);
      } catch (e) {
        // Ignore initialization errors
      }
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [chatIds, user]);

  const markAsRead = (chatId: string) => {
    setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
  };

  const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

  return (
    <ChatContext.Provider value={{ lastMessages, unreadCounts, totalUnread, markAsRead }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
