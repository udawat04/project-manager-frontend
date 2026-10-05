import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ReplyComposerProps {
  emailId: string;
  onSent: () => void;
  onCancel: () => void;
}

export function ReplyComposer({ emailId, onSent, onCancel }: ReplyComposerProps) {
  const [content, setContent] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await api.replyToEmail(emailId, { body: content });
      toast.success('Reply sent');
      onSent();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/10 mt-4">
      <textarea
        className="w-full min-h-[120px] bg-transparent border-0 focus:ring-0 resize-none text-sm text-foreground placeholder:text-muted-foreground p-0 mb-4"
        placeholder="Type your reply here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <Paperclip className="w-4 h-4" />
          Attach
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={sending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSend} disabled={sending || !content.trim()} className="gap-2">
            <Send className="w-4 h-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
