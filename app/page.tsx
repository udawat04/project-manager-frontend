'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Server,
  KeyRound,
  Layers,
  CheckCircle2,
  ArrowRight,
  Lock,
  Copy,
  Terminal,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Code2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';

export default function LandingPage() {
  const { user } = useAuth();

  // Interactive demo states in hero
  const [demoRevealed, setDemoRevealed] = React.useState(false);
  const [demoCopied, setDemoCopied] = React.useState(false);

  const handleCopyDemo = () => {
    navigator.clipboard.writeText('postgresql://vault_user:masked_secret@db.internal:5432/production_db');
    setDemoCopied(true);
    setTimeout(() => setDemoCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-canvas-soft text-ink selection:bg-ink selection:text-canvas">
      {/* 1. STICKY TOP NAV BAR (Vercel Spec: height 64px, canvas, hairline bottom) */}
      <header className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-canvas/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-7 w-7 rounded-[6px] bg-ink flex items-center justify-center text-on-primary font-bold text-sm shadow-vercel">
                ▲
              </div>
              <span className="font-semibold text-base tracking-tight text-ink">
                ProjectVault
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <a
                href="#features"
                className="px-3 py-1.5 text-xs text-body hover:text-ink transition-colors rounded-full"
              >
                Features
              </a>
              <a
                href="#architecture"
                className="px-3 py-1.5 text-xs text-body hover:text-ink transition-colors rounded-full"
              >
                Security
              </a>
              <a
                href="#platforms"
                className="px-3 py-1.5 text-xs text-body hover:text-ink transition-colors rounded-full"
              >
                Platforms
              </a>
              <a
                href="#pricing"
                className="px-3 py-1.5 text-xs text-body hover:text-ink transition-colors rounded-full"
              >
                Pricing
              </a>
            </nav>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link href="/dashboard">
                <Button className="h-8 px-3 text-xs font-medium rounded-[6px] bg-ink hover:bg-ink/90 text-on-primary shadow-vercel">
                  Go to Dashboard →
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="h-8 px-3 text-xs font-medium rounded-[6px] bg-ink hover:bg-ink/90 text-on-primary shadow-vercel">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO BAND WITH SIGNATURE VERCEL MESH GRADIENT */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32">
        {/* The Signature Mesh Gradient Atmospheric Backdrop (cyan, blue, magenta, amber) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 pointer-events-none opacity-40 blur-3xl -z-10">
          <div className="w-full h-full bg-gradient-to-tr from-cyan/30 via-highlight-pink/20 to-warning/30 rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Announcement Pill Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-hairline bg-canvas shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            <span className="text-xs font-mono text-body">
              ProjectVault v1.0 is now live
            </span>
            <span className="text-[10px] font-mono text-mute">|</span>
            <span className="text-xs font-medium text-ink hover:underline cursor-pointer">
              Read announcement →
            </span>
          </div>

          {/* Headline - Sentence-case, period-terminated, aggressive negative tracking (-2.4px) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.04em] text-ink leading-[1.05] max-w-4xl mx-auto">
            Every project, platform, and environment secret. Unified.
          </h1>

          {/* Lead body */}
          <p className="text-base sm:text-lg md:text-xl text-body max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate fragmented credentials in spreadsheets, Slack, and local .env files.
            Manage multi-account platforms, zero-plaintext encrypted vaults, and developer permissions from a single command surface.
          </p>

          {/* 100px Pill CTAs (Marketing Scale) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={user ? '/dashboard' : '/login'}>
              <button className="h-12 px-7 rounded-full bg-ink hover:bg-ink/90 text-on-primary text-sm font-medium shadow-vercel-float hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2">
                <span>{user ? 'Open Dashboard' : 'Access Vault'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="#features">
              <button className="h-12 px-7 rounded-full bg-canvas hover:bg-canvas-soft border border-hairline text-ink text-sm font-medium shadow-vercel hover:scale-[1.01] active:scale-[0.99] transition-all">
                Explore Architecture
              </button>
            </a>
          </div>

          {/* 3. HERO INTERACTIVE VAULT MOCKUP */}
          <div className="pt-12 max-w-3xl mx-auto text-left">
            <div className="rounded-xl border border-hairline bg-canvas shadow-vercel-float overflow-hidden">
              {/* Terminal Window Header */}
              <div className="h-10 bg-canvas-soft border-b border-hairline px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  <span className="font-mono text-xs text-mute ml-2">
                    projectvault // PG Ledger (Production)
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-mute">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span>AES-256-GCM SECURED</span>
                </div>
              </div>

              {/* Terminal / Variable Table Mockup */}
              <div className="p-4 sm:p-5 space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-canvas-soft border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-mute block text-[10px] font-sans">KEY</span>
                    <span className="font-bold text-ink">DATABASE_URL</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-body font-mono text-xs truncate max-w-[240px] sm:max-w-xs">
                      {demoRevealed
                        ? 'postgresql://vault_user:masked_secret@db.internal:5432/production_db'
                        : '••••••••••••••••••••••••••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setDemoRevealed(!demoRevealed)}
                        className="p-1.5 rounded hover:bg-canvas border border-hairline text-mute hover:text-ink transition-colors"
                        title={demoRevealed ? 'Mask secret' : 'Reveal secret'}
                      >
                        {demoRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={handleCopyDemo}
                        className="p-1.5 rounded hover:bg-canvas border border-hairline text-mute hover:text-ink transition-colors"
                        title="Copy to clipboard"
                      >
                        {demoCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-canvas-soft border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-mute block text-[10px] font-sans">KEY</span>
                    <span className="font-bold text-ink">STRIPE_SECRET_KEY</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-body font-mono text-xs">
                      {demoRevealed ? 'mock_sec_demo_stripe_key_unmasked' : '••••••••••••••••••••••••••••••••'}
                    </span>
                    <Badge variant="success" className="text-[9px] font-mono uppercase">
                      Encrypted
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-mute">
                  <span>30-second auto-mask timer enabled</span>
                  <span className="text-emerald-600 font-sans font-medium">● 0 Plaintext Leaks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LOGO STRIP / SUPPORTED ECOSYSTEMS */}
      <section className="py-12 border-y border-hairline bg-canvas">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <p className="font-mono text-xs text-mute uppercase tracking-wider">
            Seamless multi-account decoupling for modern cloud stacks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all font-mono text-xs font-semibold">
            <span>▲ VERCEL</span>
            <span>⚡ SUPABASE</span>
            <span>☁️ CLOUDFLARE</span>
            <span>📦 AWS S3</span>
            <span>🐘 POSTGRESQL</span>
            <span>🐙 GITHUB</span>
            <span>🌐 WORDPRESS</span>
          </div>
        </div>
      </section>

      {/* 5. 3-PAIR DEVELOP / PREVIEW / SHIP FEATURE SECTION */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="font-mono text-xs border-hairline">
            SYSTEM ARCHITECTURE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Engineered for developers who manage multiple platforms.
          </h2>
          <p className="text-body text-sm sm:text-base leading-relaxed">
            One clean interface that handles platform account decoupling, encrypted environment variables, and credential rotation across all client and company initiatives.
          </p>
        </div>

        {/* 3-Up Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Develop Rhythm */}
          <div className="p-6 rounded-xl border border-hairline bg-canvas shadow-vercel space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-canvas-soft border border-hairline flex items-center justify-center">
                <Lock className="h-5 w-5 text-ink" />
              </div>
              <h3 className="text-lg font-semibold text-ink">Zero-Plaintext Security.</h3>
              <p className="text-xs text-body leading-relaxed">
                All sensitive values are encrypted via authenticated AES-256-GCM before entering the database. Secrets are masked by default with automatic 30-second memory-clearing timers.
              </p>
            </div>
            <div className="pt-4 border-t border-hairline font-mono text-[11px] text-mute">
              AES-256-GCM + IV AUTH TAGS
            </div>
          </div>

          {/* Card 2: Preview Rhythm */}
          <div className="p-6 rounded-xl border border-hairline bg-canvas shadow-vercel space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-canvas-soft border border-hairline flex items-center justify-center">
                <Server className="h-5 w-5 text-ink" />
              </div>
              <h3 className="text-lg font-semibold text-ink">Platform Decoupling.</h3>
              <p className="text-xs text-body leading-relaxed">
                Never confuse personal, client, and company accounts again. Decouple platforms (AWS, Vercel, Cloudflare, Supabase) into multiple accounts and bind them directly to individual projects.
              </p>
            </div>
            <div className="pt-4 border-t border-hairline font-mono text-[11px] text-mute">
              MULTI-ACCOUNT ORCHESTRATION
            </div>
          </div>

          {/* Card 3: Ship Rhythm */}
          <div className="p-6 rounded-xl border border-hairline bg-canvas shadow-vercel space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-canvas-soft border border-hairline flex items-center justify-center">
                <Code2 className="h-5 w-5 text-ink" />
              </div>
              <h3 className="text-lg font-semibold text-ink">Dotenv Import & Export.</h3>
              <p className="text-xs text-body leading-relaxed">
                Bulk paste or upload existing .env files with auto-detection of comments, quotes, and multiline values. Export or copy in 1-click for rapid local bootstrap.
              </p>
            </div>
            <div className="pt-4 border-t border-hairline font-mono text-[11px] text-mute">
              1-CLICK .ENV SYNC & COPY
            </div>
          </div>
        </div>
      </section>

      {/* 6. POLARITY-FLIPPED DARK BAND (Vercel Spec: #171717 canvas, white typography) */}
      <section id="architecture" className="py-24 bg-[#171717] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <Badge variant="outline" className="font-mono text-xs border-white/20 text-white/80">
              AUDIT TRAILS & GOVERNANCE
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Complete accountability for every secret accessed.
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Every decryption, copy, reveal, and variable mutation is cryptographically logged with IP addresses, member IDs, and exact millisecond timestamps.
            </p>
          </div>

          {/* Code Mockup Flush with Band */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 font-mono text-xs space-y-3 text-white/80 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] text-white/40">
              <span>projectvault-audit.log</span>
              <span className="text-emerald-400 font-sans">LIVE STREAMING</span>
            </div>
            <p><span className="text-cyan">[2026-09-06 23:05:12 UTC]</span> <span className="text-amber-400">AUDIT_LOG:</span> User &quot;Lead Admin&quot; (audit@internal.company) revealed DATABASE_URL in Core Backend (Production)</p>
            <p><span className="text-cyan">[2026-09-06 23:05:42 UTC]</span> <span className="text-blue-400">AUTO_MASK:</span> 30-second TTL expired. Decrypted memory cleared from client state.</p>
            <p><span className="text-cyan">[2026-09-06 23:06:01 UTC]</span> <span className="text-purple-400">PLATFORM_CONNECT:</span> Connected Cloudflare Account (ID: acc_client_01) to Apex Dental Care</p>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION WITH PRO TIER POLARITY-FLIPPED */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="font-mono text-xs border-hairline">
            TRANSPARENT PRICING
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Simple plans that scale with your projects.
          </h2>
          <p className="text-body text-sm sm:text-base">
            Start free for your solo ventures. Upgrade when managing client accounts and collaborative teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Free Tier */}
          <div className="p-8 rounded-xl border border-hairline bg-canvas shadow-vercel flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-ink">Hobby</h3>
              <p className="text-xs text-body">For freelancers and solo engineers managing personal projects.</p>
              <div className="pt-2">
                <span className="text-4xl font-bold font-mono text-ink">$0</span>
                <span className="text-xs text-mute font-mono"> / month</span>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-hairline text-xs text-body font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Up to 5 Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Environment Variables</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>AES-256-GCM Encryption</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>3 Platform Accounts</span>
                </li>
              </ul>
            </div>
            <Link href="/register">
              <button className="w-full h-10 rounded-full bg-canvas hover:bg-canvas-soft border border-hairline text-ink text-xs font-medium transition-all">
                Get Started
              </button>
            </Link>
          </div>

          {/* Pro Tier (Polarity-Flipped Featured) */}
          <div className="p-8 rounded-xl bg-ink text-on-primary shadow-vercel-float flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-cyan text-ink text-[10px] font-mono font-bold uppercase tracking-wider">
              MOST POPULAR
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-on-primary">Pro Team</h3>
              <p className="text-xs text-white/70">For growing startups, agencies, and teams handling multiple clients.</p>
              <div className="pt-2">
                <span className="text-4xl font-bold font-mono text-on-primary">$29</span>
                <span className="text-xs text-white/60 font-mono"> / month</span>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-white/80 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Unlimited Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Unlimited Platform Accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Role-Based Access & Members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>Permanent Audit Log Retention</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan shrink-0" />
                  <span>1-Click Dotenv Decrypt & Export</span>
                </li>
              </ul>
            </div>
            <Link href="/register">
              <button className="w-full h-10 rounded-full bg-canvas text-ink hover:bg-canvas-soft text-xs font-medium shadow-sm transition-all">
                Start Pro Trial
              </button>
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="p-8 rounded-xl border border-hairline bg-canvas shadow-vercel flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-ink">Enterprise</h3>
              <p className="text-xs text-body">For organizations requiring custom compliance, SSO, and dedicated support.</p>
              <div className="pt-2">
                <span className="text-4xl font-bold font-mono text-ink">Custom</span>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-hairline text-xs text-body font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>SAML / Okta SSO</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Custom KMS Key Ingestion</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>99.99% Guaranteed SLA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Dedicated Solutions Engineer</span>
                </li>
              </ul>
            </div>
            <Link href="/register">
              <button className="w-full h-10 rounded-full bg-canvas hover:bg-canvas-soft border border-hairline text-ink text-xs font-medium transition-all">
                Contact Sales
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER (4-Column Vercel Layout) */}
      <footer className="border-t border-hairline bg-canvas py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">Product</p>
            <ul className="space-y-2 text-xs text-body">
              <li><a href="#features" className="hover:text-ink">Secret Vault</a></li>
              <li><a href="#platforms" className="hover:text-ink">Platforms</a></li>
              <li><a href="#architecture" className="hover:text-ink">Security Architecture</a></li>
              <li><a href="#pricing" className="hover:text-ink">Pricing</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">Platforms</p>
            <ul className="space-y-2 text-xs text-body">
              <li><span className="hover:text-ink">Vercel & Next.js</span></li>
              <li><span className="hover:text-ink">Supabase & PostgreSQL</span></li>
              <li><span className="hover:text-ink">Cloudflare DNS & CDN</span></li>
              <li><span className="hover:text-ink">AWS Cloud Infrastructure</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">Resources</p>
            <ul className="space-y-2 text-xs text-body">
              <li><span className="hover:text-ink">Documentation</span></li>
              <li><span className="hover:text-ink">CLI Tooling</span></li>
              <li><span className="hover:text-ink">Changelog</span></li>
              <li><span className="hover:text-ink">Status</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">Legal</p>
            <ul className="space-y-2 text-xs text-body">
              <li><span className="hover:text-ink">Privacy Policy</span></li>
              <li><span className="hover:text-ink">Terms of Service</span></li>
              <li><span className="hover:text-ink">Security Disclosures</span></li>
              <li><span className="hover:text-ink">Compliance (SOC2)</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mute font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>All systems operational</span>
          </div>
          <span>© 2026 ProjectVault Inc. Built with Vercel design language.</span>
        </div>
      </footer>
    </div>
  );
}
