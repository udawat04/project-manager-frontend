import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function ConnectGmailButton() {
  const [connecting, setConnecting] = React.useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await api.getGmailAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get auth URL');
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] space-y-6">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight">Connect your Gmail</h2>
        <p className="text-muted-foreground text-sm">
          Sync your emails, view them directly in ProjectVault, and respond without ever leaving your dashboard.
        </p>
      </div>
      <Button onClick={handleConnect} disabled={connecting} className="gap-2">
        <Mail className="w-4 h-4" />
        {connecting ? 'Connecting...' : 'Connect with Google'}
      </Button>
    </div>
  );
}
