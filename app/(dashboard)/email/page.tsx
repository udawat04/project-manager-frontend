'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { EmailList } from '@/components/features/email/EmailList';
import { EmailDetail } from '@/components/features/email/EmailDetail';
import { ConnectGmailButton } from '@/components/features/email/ConnectGmailButton';

export default function EmailPage() {
  const [account, setAccount] = React.useState<any>(null);
  const [emails, setEmails] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [selectedEmail, setSelectedEmail] = React.useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accRes = await api.getGmailAccountStatus();
      setAccount(accRes.account);

      if (accRes.account?.connected) {
        const emailsRes = await api.getGmailEmails();
        setEmails(emailsRes.emails || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account?')) return;
    try {
      await api.disconnectGmail();
      setAccount(null);
      setEmails([]);
      toast.success('Account disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncGmail();
      toast.success('Sync triggered');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteEmail(id);
      setEmails(emails.filter(e => e.id !== id));
      setSelectedEmail(null);
      toast.success('Email deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete email');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!account || !account.connected) {
    return <ConnectGmailButton />;
  }

  if (selectedEmail) {
    return (
      <div className="h-[calc(100vh-6rem)] bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <EmailDetail 
          email={selectedEmail} 
          onBack={() => setSelectedEmail(null)} 
          onDelete={handleDelete} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connected as <span className="font-medium text-foreground">{account.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <EmailList 
          emails={emails.map(email => ({
            ...email,
            onClick: () => setSelectedEmail(email)
          }))} 
        />
      </div>
    </div>
  );
}
