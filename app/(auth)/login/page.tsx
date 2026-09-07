'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, KeyRound, Mail, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Forgot / Reset Password Dialog State
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [resetStep, setResetStep] = React.useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetOtp, setResetOtp] = React.useState('');
  const [resetNewPassword, setResetNewPassword] = React.useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = React.useState('');
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(0);

  const router = useRouter();
  const { login } = useAuth();

  // Cooldown countdown timer effect
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

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

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.forgotPassword(resetEmail);
      toast.success(res.message || 'Verification code sent to your email');
      setResetStep(2);
      setResendCountdown(60);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || !resetEmail) return;

    setResetLoading(true);
    try {
      const res = await api.forgotPassword(resetEmail);
      toast.success(res.message || 'New verification code sent');
      setResendCountdown(60);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePerformReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.resetPassword({
        email: resetEmail,
        otp: resetOtp,
        newPassword: resetNewPassword,
      });
      toast.success(res.message || 'Password reset successfully! Please sign in.');
      setForgotOpen(false);
      setEmail(resetEmail);
      setPassword('');
      setResetStep(1);
      setResetOtp('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
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
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetStep(1);
                      setForgotOpen(true);
                    }}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full gap-1.5" isLoading={loading}>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Access is restricted. Accounts are provisioned by administrator.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Forgot / Reset Password OTP Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
              <KeyRound className="h-5 w-5" />
            </div>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              {resetStep === 1
                ? 'Enter your registered email address to receive a secure 6-digit verification code.'
                : `Enter the 6-digit verification code sent to ${resetEmail} and your new password.`}
            </DialogDescription>
          </DialogHeader>

          {resetStep === 1 ? (
            <form onSubmit={handleRequestResetOtp} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Registered Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-9"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotOpen(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={resetLoading} className="gap-1.5">
                  <span>Send OTP Code</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handlePerformReset} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">6-Digit Verification Code</label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || resetLoading}
                    className="text-[11px] text-primary hover:underline disabled:text-muted-foreground disabled:no-underline font-medium"
                  >
                    {resendCountdown > 0 ? `Resend code (${resendCountdown}s)` : 'Resend code'}
                  </button>
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="font-mono text-center tracking-[0.4em] text-lg font-bold"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">New Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Confirm New Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResetStep(1)}
                  disabled={resetLoading}
                  className="text-xs"
                >
                  Change Email
                </Button>
                <Button type="submit" isLoading={resetLoading} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Update Password</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
