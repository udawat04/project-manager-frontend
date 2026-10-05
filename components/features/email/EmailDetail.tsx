import * as React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReplyComposer } from './ReplyComposer';

interface EmailDetailProps {
  email: any;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function EmailDetail({ email, onBack, onDelete }: EmailDetailProps) {
  const [replying, setReplying] = React.useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Inbox
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onDelete(email.id)} className="text-destructive hover:bg-destructive/10 border-destructive/20 gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">{email.subject || '(No Subject)'}</h2>
        
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {(email.fromName?.[0] || email.fromAddress?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {email.fromName || email.fromAddress}
                {email.fromName && <span className="text-muted-foreground text-sm font-normal ml-2">&lt;{email.fromAddress}&gt;</span>}
              </p>
              <p className="text-xs text-muted-foreground">To: {email.to}</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {format(new Date(email.date), 'MMM d, yyyy, h:mm a')}
          </span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none mb-8 text-foreground" dangerouslySetInnerHTML={{ __html: email.htmlBody || email.textBody || email.snippet }} />

        {replying ? (
          <ReplyComposer emailId={email.id} onSent={() => setReplying(false)} onCancel={() => setReplying(false)} />
        ) : (
          <Button onClick={() => setReplying(true)} className="mt-4">
            Reply to Message
          </Button>
        )}
      </div>
    </div>
  );
}
