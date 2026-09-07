'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { api, setStoredToken } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = React.useState('prince@projectvault.io');
  const [password, setPassword] = React.useState('password123');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email, password });
      login(res.accessToken, res.user, res.refreshToken);
      toast.success(`Welcome back, ${res.user.name}`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ProjectVault</h1>
          <p className="text-xs text-muted-foreground">
            Centralized Project, Environment & Credential Management
          </p>
        </div>

        <Card className="border border-border shadow-md">
          <form onSubmit={handleLogin}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-base">Sign In</CardTitle>
              <CardDescription className="text-xs">
                Enter your credentials to access your secure vault
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">Password</label>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {/* Demo Notice */}
              <div className="p-2.5 rounded bg-muted/50 border border-border/80 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Demo Credentials:</p>
                <p>Email: <span className="font-mono text-foreground">prince@projectvault.io</span></p>
                <p>Password: <span className="font-mono text-foreground">password123</span></p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full gap-1.5" isLoading={loading}>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
