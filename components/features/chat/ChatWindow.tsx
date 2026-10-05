'use client';

import * as React from 'react';
import { Send, Users } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserAvatar } from '@/components/ui/user-avatar';

interface ChatWindowProps {
  chatId: string;
  chatName: string;
  chatAvatarUrl?: string | null;
  isGroup?: boolean;
}

export function ChatWindow({ chatId, chatName, chatAvatarUrl, isGroup }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, `conversations/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: any[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);
        setError(null);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError('Real-time chat is disabled. Please enable Firestore API in your Google Cloud Console.');
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await addDoc(collection(db, `conversations/${chatId}/messages`), {
        content,
        senderId: user.id,
        senderName: user.name,
        senderAvatarUrl: user.avatarUrl || null,
        createdAt: serverTimestamp(),
      });
      setError(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Firestore API might be disabled.');
    } finally {
      setSending(false);
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
        <MessageSquareIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground font-medium">Select a team member to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] dark:bg-[#0B141A] relative overflow-hidden">
      {/* Optional Chat Background Pattern could go here */}
      <div className="p-3 border-b border-border bg-card flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          ) : (
            <UserAvatar name={chatName} avatarUrl={chatAvatarUrl} size="md" dotColorClass="bg-green-500" />
          )}
          <div>
            <h2 className="font-medium text-foreground text-sm tracking-tight">{chatName}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{isGroup ? 'Group Conversation' : 'Direct Message'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs font-medium text-red-600 flex items-center justify-center">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 flex flex-col">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          const showName = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="flex max-w-[85%] md:max-w-[70%] flex-col">
                <div
                  className={`relative px-2.5 py-1.5 rounded-lg shadow-sm ${
                    isMe
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground rounded-tr-none'
                      : 'bg-white dark:bg-[#202c33] text-foreground rounded-tl-none'
                  }`}
                >
                  {/* Triangle tail for bubbles (Simulated with CSS) */}
                  <div
                    className={`absolute top-0 w-0 h-0 border-[8px] border-transparent ${
                      isMe
                        ? 'right-[-8px] border-l-[#d9fdd3] dark:border-l-[#005c4b] border-t-[#d9fdd3] dark:border-t-[#005c4b]'
                        : 'left-[-8px] border-r-white dark:border-r-[#202c33] border-t-white dark:border-t-[#202c33]'
                    }`}
                  />

                  {showName && (
                    <span className="text-[11px] font-medium text-blue-500 mb-0.5 block">{msg.senderName}</span>
                  )}
                  <div className="flex flex-wrap items-end gap-2">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed pb-2.5 pr-1">{msg.content}</p>
                    {msg.createdAt && (
                      <span className="text-[10px] text-muted-foreground/80 float-right -mt-4 ml-auto inline-block relative bottom-[-4px]">
                        {msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] z-10">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg px-4 py-2 flex items-center">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
