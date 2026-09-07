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
  Mail,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImageUploadPicker } from '@/components/ui/image-upload-picker';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form State
  const [profileName, setProfileName] = React.useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = React.useState('');
  const [profileEmail, setProfileEmail] = React.useState('');
  const [emailOtp, setEmailOtp] = React.useState('');
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [emailOtpSending, setEmailOtpSending] = React.useState(false);
  const [emailOtpCooldown, setEmailOtpCooldown] = React.useState(0);

  const handleDirectAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const res = await api.uploadMyAvatar(file);
      setProfileAvatarUrl(res.avatarUrl);
      await refreshUser();
      toast.success('Profile photo uploaded and saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload profile photo');
      throw err;
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setProfileAvatarUrl('');
    try {
      await api.updateProfile({ avatarUrl: null });
      await refreshUser();
      toast.success('Profile photo removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove photo');
    }
  };

  // Password Change State
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordOtp, setPasswordOtp] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [passwordOtpSending, setPasswordOtpSending] = React.useState(false);
  const [passwordOtpCooldown, setPasswordOtpCooldown] = React.useState(0);

  // Synchronize initial user state
  React.useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileAvatarUrl(user.avatarUrl || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Timers for OTP cooldowns
  React.useEffect(() => {
    if (emailOtpCooldown <= 0) return;
    const timer = setInterval(() => setEmailOtpCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [emailOtpCooldown]);

  React.useEffect(() => {
    if (passwordOtpCooldown <= 0) return;
    const timer = setInterval(() => setPasswordOtpCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [passwordOtpCooldown]);

  const isEmailChanged = user && profileEmail.toLowerCase().trim() !== user.email.toLowerCase().trim();

  // Request OTP for Email Change
  const handleRequestEmailOtp = async () => {
    if (emailOtpCooldown > 0) return;
    setEmailOtpSending(true);
    try {
      const res = await api.sendSecurityOtp('PROFILE_UPDATE');
      toast.success(res.message || `Verification code sent to ${user?.email}`);
      setEmailOtpCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setEmailOtpSending(false);
    }
  };

  // Save Profile Changes
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    if (isEmailChanged && (!emailOtp || emailOtp.length !== 6)) {
      toast.error('Please enter the 6-digit OTP code to verify changing your email');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.updateProfile({
        name: profileName,
        avatarUrl: profileAvatarUrl.trim() ? profileAvatarUrl.trim() : null,
        email: isEmailChanged ? profileEmail : undefined,
        otp: isEmailChanged ? emailOtp : undefined,
      });

      await refreshUser();
      setEmailOtp('');
      toast.success(res.message || 'Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Request OTP for Password Change
  const handleRequestPasswordOtp = async () => {
    if (passwordOtpCooldown > 0) return;
    setPasswordOtpSending(true);
    try {
      const res = await api.sendSecurityOtp('PASSWORD_CHANGE');
      toast.success(res.message || `Security OTP sent to ${user?.email}`);
      setPasswordOtpCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send security code');
    } finally {
      setPasswordOtpSending(false);
    }
  };

  // Submit Password Change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (!passwordOtp || passwordOtp.length !== 6) {
      toast.error('Please enter the 6-digit security OTP sent to your email');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        otp: passwordOtp,
      });

      toast.success(res.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Vault & Security Settings</h1>
        <p className="text-xs text-muted-foreground">
          Account identity, security verification, and interface preferences.
        </p>
      </div>

      {/* 1. User Profile Management */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <span>User Profile</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Update your account details and identity settings.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            ID: {user?.id?.slice(0, 8)}...
          </Badge>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
          {/* Profile Photo Device Upload */}
          <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-2">
            <label className="text-xs font-semibold text-foreground block">Profile Photo</label>
            <ImageUploadPicker
              currentImageUrl={profileAvatarUrl}
              name={profileName || user?.name}
              size="lg"
              isUploading={avatarUploading}
              onDirectUpload={handleDirectAvatarUpload}
              onRemoveImage={handleRemoveAvatar}
              helperText="Upload an avatar image from your device. Optimized and stored securely on Cloudinary."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <Input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Email Address</label>
              {isEmailChanged && (
                <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Email modification requires OTP verification
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-9"
                required
              />
            </div>

            {/* Email OTP Verification Sub-section if user changes email */}
            {isEmailChanged && (
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-3 mt-2 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Verify Email Change
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      We will send an authorization code to your current registered email ({user?.email})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRequestEmailOtp}
                    disabled={emailOtpSending || emailOtpCooldown > 0}
                    className="text-xs shrink-0"
                  >
                    {emailOtpCooldown > 0 ? `Resend code (${emailOtpCooldown}s)` : 'Send OTP to Current Email'}
                  </Button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Enter 6-Digit Code</label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="font-mono tracking-[0.3em] text-center max-w-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={profileLoading} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Profile Changes</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Password & OTP Security Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-500" />
              <span>Password & Authentication Security</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Change your password protected by two-factor email OTP verification.
            </CardDescription>
          </div>
          <Badge variant="success" className="font-mono text-[10px] uppercase">
            OTP Protected
          </Badge>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          {/* OTP Code Input & Dispatch Button */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-emerald-500" />
                  Security Verification OTP
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Click below to receive a 6-digit one-time code at <strong className="text-foreground">{user?.email}</strong>
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRequestPasswordOtp}
                disabled={passwordOtpSending || passwordOtpCooldown > 0}
                className="text-xs shrink-0 gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{passwordOtpCooldown > 0 ? `Resend Code (${passwordOtpCooldown}s)` : 'Send OTP to Email'}</span>
              </Button>
            </div>

            <div className="space-y-1.5 max-w-xs">
              <label className="text-[11px] font-medium text-foreground">Enter 6-Digit OTP</label>
              <Input
                type="text"
                maxLength={6}
                value={passwordOtp}
                onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="font-mono tracking-[0.4em] text-center font-bold text-base"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={passwordLoading} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Update Password</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Security & Cryptographic Engine Specifications */}
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

      {/* 4. Appearance & Themes */}
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
