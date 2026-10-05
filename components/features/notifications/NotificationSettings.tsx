import * as React from 'react';
import { Bell, Mail, MessageSquare, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export function NotificationSettings() {
  const [loading, setLoading] = React.useState(false);
  const [prefs, setPrefs] = React.useState({
    email: true,
    message: true,
    task: true,
    access: true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateNotificationPreferences(prefs);
      toast.success('Notification preferences updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        Notification Preferences
      </h3>
      
      <div className="space-y-4 mb-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Email Alerts</span>
          </div>
          <input 
            type="checkbox" 
            checked={prefs.email} 
            onChange={(e) => setPrefs(prev => ({ ...prev, email: e.target.checked }))} 
            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
          />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Chat Messages</span>
          </div>
          <input 
            type="checkbox" 
            checked={prefs.message} 
            onChange={(e) => setPrefs(prev => ({ ...prev, message: e.target.checked }))} 
            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
          />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Task Assignments</span>
          </div>
          <input 
            type="checkbox" 
            checked={prefs.task} 
            onChange={(e) => setPrefs(prev => ({ ...prev, task: e.target.checked }))} 
            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
          />
        </label>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        Save Preferences
      </Button>
    </div>
  );
}
