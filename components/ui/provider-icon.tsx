'use client';

import * as React from 'react';
import {
  SiVercel,
  SiRender,
  SiCloudflare,
  SiSupabase,
  SiMongodb,
  SiHostinger,
  SiGithub,
  SiGitlab,
  SiDigitalocean,
  SiRailway,
  SiFirebase,
  SiPrisma,
  SiSentry,
  SiResend,
  SiStripe,
  SiCloudinary,
  SiNetlify,
  SiDocker,
  SiBitbucket,
  SiApple,
  SiGooglecloud,
} from '@icons-pack/react-simple-icons';
import { Server, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

function AwsIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-label="AWS">
      <path d="M6.54 13.9a3.62 3.62 0 0 1-1.3-.24 3.7 3.7 0 0 1-1.12-.66 3.1 3.1 0 0 1-.78-1.04 3.32 3.32 0 0 1-.3-1.42c0-.52.1-1 .3-1.43a3.17 3.17 0 0 1 .8-1.06 3.9 3.9 0 0 1 1.18-.7c.46-.17.95-.26 1.48-.26.54 0 1.03.1 1.48.27.45.18.84.42 1.17.72.33.3.59.66.78 1.08.18.42.27.88.27 1.38v4.32h-1.92v-1.1c-.26.37-.58.67-.97.9-.38.22-.84.34-1.38.34zm.28-1.8c.36 0 .68-.07.96-.2.28-.15.5-.34.68-.58v-1.6a2 2 0 0 0-.68-.58 1.94 1.94 0 0 0-.96-.2c-.36 0-.68.08-.94.23a1.44 1.44 0 0 0-.58.6 2.08 2.08 0 0 0-.2.9c0 .35.07.65.2.9.14.24.33.43.58.57.25.14.56.21.94.21zm7.1 1.7-1.84-6.8h2.08l1.04 4.38.98-4.38h1.84l.98 4.38 1.04-4.38h2.06l-1.84 6.8h-2.12l-.98-4.22-1.02 4.22h-2.22zm-8.8 4.32a18.3 18.3 0 0 0 9.8-1.84l-.56-.98a17.3 17.3 0 0 1-9.24 1.74c-2.48 0-4.88-.5-7.14-1.5l-.56 1.06a19.4 19.4 0 0 0 7.7 1.52zm12.38-.88c.3.1.66.16 1.06.18l-.54-1.28a3.7 3.7 0 0 0-.52 1.1zm.98-.38c.4-.1.74-.26 1.04-.48l-1.2-.72c.04.42.1.82.16 1.2z" />
    </svg>
  );
}

function HerokuIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-label="Heroku">
      <path d="M19.4 0H4.6A4.6 4.6 0 0 0 0 4.6v14.8A4.6 4.6 0 0 0 4.6 24h14.8a4.6 4.6 0 0 0 4.6-4.6V4.6A4.6 4.6 0 0 0 19.4 0zM7.5 18H5V6h2.5v12zm5.5 0h-2.5V6H13v4.5a3 3 0 0 1 3-3V10a3 3 0 0 0-3 3V18zm6 0h-2.5v-6.5a2.5 2.5 0 0 1 2.5-2.5V18z" />
    </svg>
  );
}

const providerMap: Record<string, React.ComponentType<any>> = {
  vercel: SiVercel,
  render: SiRender,
  cloudflare: SiCloudflare,
  supabase: SiSupabase,
  mongodb: SiMongodb,
  'mongodb atlas': SiMongodb,
  hostinger: SiHostinger,
  aws: AwsIcon,
  'aws s3': AwsIcon,
  'amazon web services': AwsIcon,
  github: SiGithub,
  gitlab: SiGitlab,
  bitbucket: SiBitbucket,
  digitalocean: SiDigitalocean,
  railway: SiRailway,
  firebase: SiFirebase,
  prisma: SiPrisma,
  sentry: SiSentry,
  resend: SiResend,
  stripe: SiStripe,
  cloudinary: SiCloudinary,
  netlify: SiNetlify,
  heroku: HerokuIcon,
  docker: SiDocker,
  apple: SiApple,
  'apple developer': SiApple,
  gcp: SiGooglecloud,
  'google cloud': SiGooglecloud,
};

interface ProviderIconProps {
  provider?: string;
  name?: string;
  size?: number;
  className?: string;
}

export function ProviderIcon({ provider, name, size = 16, className }: ProviderIconProps) {
  const query = (provider || name || '').toLowerCase().trim();

  if (!query) {
    return <Server size={size} className={cn('text-muted-foreground shrink-0', className)} aria-hidden="true" />;
  }

  // Exact or partial match
  let IconComponent = providerMap[query];

  if (!IconComponent) {
    const matchedKey = Object.keys(providerMap).find((k) => query.includes(k) || k.includes(query));
    if (matchedKey) {
      IconComponent = providerMap[matchedKey];
    }
  }

  if (IconComponent) {
    return <IconComponent size={size} className={cn('shrink-0 transition-opacity', className)} aria-label={query} />;
  }

  return <Cloud size={size} className={cn('text-muted-foreground shrink-0', className)} aria-label={query} />;
}
