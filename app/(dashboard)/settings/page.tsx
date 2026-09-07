'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Vault & Security Settings</h1>
        <p className="text-xs text-muted-foreground">
          System encryption status, session policies, and interface preferences.
        </p>
      </div>

      {/* Account Info */}
      <Card className="p-6 space-y-4">
        <CardTitle className="text-base">User Profile</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">Name</span>
            <p className="font-semibold text-foreground text-sm">{user?.name || 'Administrator'}</p>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Email Address</span>
            <p className="font-mono text-foreground text-sm">{user?.email || 'admin@projectvault.io'}</p>
          </div>
        </div>
      </Card>

      {/* Security & Cryptographic Engine */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>Cryptographic Security Architecture</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Zero-plaintext architecture ensuring all sensitive values are encrypted at rest.
            </CardDescription>
          </div>
          <Badge variant="success" className="font-mono text-[10px]">
            ACTIVE & ENCRYPTED
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
            <span className="font-semibold text-foreground block">Encryption Algorithm</span>
            <p className="font-mono text-muted-foreground">AES-256-GCM (Authenticated)</p>
            <p className="text-[11px] text-muted-foreground">Unique 96-bit IV and 128-bit authentication tag per secret.</p>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
            <span className="font-semibold text-foreground block">Master Key Derivation</span>
            <p className="font-mono text-muted-foreground">256-bit SHA-256 Envelope</p>
            <p className="text-[11px] text-muted-foreground">Never stored in database or exposed to client endpoints.</p>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
            <span className="font-semibold text-foreground block">Secret Reveal Auto-Hide</span>
            <p className="font-mono text-emerald-500 font-semibold">30 Seconds</p>
            <p className="text-[11px] text-muted-foreground">Revealed secrets automatically mask themselves to prevent shoulder surfing.</p>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
            <span className="font-semibold text-foreground block">Authentication Lifetimes</span>
            <p className="font-mono text-muted-foreground">Access: 15m • Refresh: 30d</p>
            <p className="text-[11px] text-muted-foreground">Cryptographically hashed refresh token rotation on reuse.</p>
          </div>
        </div>
      </Card>

      {/* Appearance & Themes */}
      <Card className="p-6 space-y-4">
        <div>
          <CardTitle className="text-base">Interface Appearance</CardTitle>
          <CardDescription className="text-xs mt-1">
            Customize the color theme of ProjectVault. Defaults to your system preference.
          </CardDescription>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-sm pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-lg border text-center flex flex-col items-center gap-2 cursor-pointer transition-all ${
              theme === 'light'
                ? 'border-primary bg-primary/5 font-semibold text-foreground'
                : 'border-border hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <Sun className="h-5 w-5" />
            <span className="text-xs">Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-lg border text-center flex flex-col items-center gap-2 cursor-pointer transition-all ${
              theme === 'dark'
                ? 'border-primary bg-primary/5 font-semibold text-foreground'
                : 'border-border hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <Moon className="h-5 w-5" />
            <span className="text-xs">Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-lg border text-center flex flex-col items-center gap-2 cursor-pointer transition-all ${
              theme === 'system'
                ? 'border-primary bg-primary/5 font-semibold text-foreground'
                : 'border-border hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <Laptop className="h-5 w-5" />
            <span className="text-xs">System</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
