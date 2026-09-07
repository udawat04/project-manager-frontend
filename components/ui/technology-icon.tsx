'use client';

import * as React from 'react';
import {
  SiNextdotjs,
  SiReact,
  SiVuedotjs,
  SiAngular,
  SiSvelte,
  SiAstro,
  SiGatsby,
  SiNodedotjs,
  SiExpress,
  SiNestjs,
  SiFastify,
  SiPython,
  SiDjango,
  SiFastapi,
  SiFlask,
  SiGo,
  SiRust,
  SiPhp,
  SiLaravel,
  SiPostgresql,
  SiMysql,
  SiMariadb,
  SiMongodb,
  SiSqlite,
  SiRedis,
  SiSupabase,
  SiFirebase,
  SiTailwindcss,
  SiTypescript,
  SiJavascript,
  SiWordpress,
  SiShopify,
  SiDocker,
  SiPrisma,
  SiRubyonrails,
  SiSpringboot,
  SiFlutter,
} from '@icons-pack/react-simple-icons';
import { Code2, Database, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<any>> = {
  // Frontend frameworks & UI
  nextjs: SiNextdotjs,
  'next.js': SiNextdotjs,
  react: SiReact,
  'react.js': SiReact,
  vue: SiVuedotjs,
  'vue.js': SiVuedotjs,
  angular: SiAngular,
  svelte: SiSvelte,
  sveltekit: SiSvelte,
  astro: SiAstro,
  gatsby: SiGatsby,
  tailwind: SiTailwindcss,
  tailwindcss: SiTailwindcss,
  'tailwind css': SiTailwindcss,
  typescript: SiTypescript,
  javascript: SiJavascript,
  flutter: SiFlutter,

  // Backend
  nodejs: SiNodedotjs,
  'node.js': SiNodedotjs,
  express: SiExpress,
  'express.js': SiExpress,
  nestjs: SiNestjs,
  fastify: SiFastify,
  python: SiPython,
  django: SiDjango,
  fastapi: SiFastapi,
  flask: SiFlask,
  go: SiGo,
  golang: SiGo,
  rust: SiRust,
  php: SiPhp,
  laravel: SiLaravel,
  rails: SiRubyonrails,
  'ruby on rails': SiRubyonrails,
  springboot: SiSpringboot,
  'spring boot': SiSpringboot,

  // Databases
  postgres: SiPostgresql,
  postgresql: SiPostgresql,
  mysql: SiMysql,
  mariadb: SiMariadb,
  mongo: SiMongodb,
  mongodb: SiMongodb,
  sqlite: SiSqlite,
  redis: SiRedis,
  supabase: SiSupabase,
  firebase: SiFirebase,
  prisma: SiPrisma,

  // CMS & Tools
  wordpress: SiWordpress,
  shopify: SiShopify,
  docker: SiDocker,
};

interface TechnologyIconProps {
  name?: string;
  size?: number;
  className?: string;
}

export function TechnologyIcon({ name, size = 16, className }: TechnologyIconProps) {
  if (!name) {
    return <Code2 size={size} className={cn('text-muted-foreground shrink-0', className)} aria-hidden="true" />;
  }

  const normalized = name.toLowerCase().trim();
  const IconComponent = iconMap[normalized];

  if (IconComponent) {
    return <IconComponent size={size} className={cn('shrink-0 transition-opacity', className)} aria-label={name} />;
  }

  // Smart fallback based on name keywords
  if (normalized.includes('sql') || normalized.includes('db') || normalized.includes('data')) {
    return <Database size={size} className={cn('text-muted-foreground shrink-0', className)} aria-label={name} />;
  }

  return <Layers size={size} className={cn('text-muted-foreground shrink-0', className)} aria-label={name} />;
}
