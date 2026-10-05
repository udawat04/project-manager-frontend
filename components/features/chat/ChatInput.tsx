import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  sending?: boolean;
}

export function ChatInput({ onSend, sending }: ChatInputProps) {
  const [newMessage, setNewMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    onSend(newMessage);
    setNewMessage('');
  };

  return (
    <div className="p-4 border-t border-border bg-muted/5">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
