'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Users,
  Server,
  KeyRound,
  Plus,
  ArrowUpRight,
  ExternalLink,
  Activity,
  Sparkles,
  Clock,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TechnologyIcon } from '@/components/ui/technology-icon';
import { formatTimeAgo } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { GlobalCreateTaskModal } from '@/components/features/tasks/GlobalCreateTaskModal';
import { useRouter } from 'next/navigation';
import { NewMemberModal } from './NewMemberModal';

interface AdminDashboardProps {
  data: any;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [taskModalOpen, setTaskModalOpen] = React.useState(false);
  const [memberModalOpen, setMemberModalOpen] = React.useState(false);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = data?.stats || {
    totalProjects: 0,
    productionProjects: 0,
    totalMembers: 0,
    totalPlatforms: 0,
    totalAccounts: 0,
    totalCredentials: 0,
    totalVariables: 0,
  };

  const recentProjects = data?.recentProjects || [];
  const recentActivities = data?.recentActivities || [];
  const recentTasks = data?.recentTasks || [];

  return (
    <div className="space-y-8">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span>{getGreeting()}, {user?.name || 'Admin'}</span>
            <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-xs text-body mt-1">
            All your projects, platforms, accounts, and credentials synchronized in one secure vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1.5 h-9 px-4 rounded-[6px] bg-canvas hover:bg-canvas-soft border-hairline shadow-sm text-ink"
            onClick={() => setTaskModalOpen(true)}
          >
            <CheckSquare className="h-4 w-4" />
            <span>New Task</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1.5 h-9 px-4 rounded-[6px] bg-canvas hover:bg-canvas-soft border-hairline shadow-sm text-ink"
            onClick={() => setMemberModalOpen(true)}
          >
            <Users className="h-4 w-4" />
            <span>New Member</span>
          </Button>
          <Link href="/projects">
            <Button size="sm" className="gap-1.5 h-9 px-4 rounded-[6px] bg-ink hover:bg-ink/90 text-on-primary shadow-vercel">
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* High-Level Metric Cards with Direct Click Redirection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/projects">
          <Card className="border-hairline bg-canvas shadow-vercel hover:border-hairline-strong hover:shadow-vercel-float transition-all cursor-pointer group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-medium text-body group-hover:text-ink transition-colors">
                Total Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-mute group-hover:text-ink transition-colors" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight text-ink">
                {stats.totalProjects}
              </div>
              <p className="text-[11px] text-body mt-1">
                <span className="text-emerald-600 font-semibold">{stats.productionProjects}</span> in production →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/members">
          <Card className="border-hairline bg-canvas shadow-vercel hover:border-hairline-strong hover:shadow-vercel-float transition-all cursor-pointer group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-medium text-body group-hover:text-ink transition-colors">
                Team Members
              </CardTitle>
              <Users className="h-4 w-4 text-mute group-hover:text-ink transition-colors" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight text-ink">
                {stats.totalMembers}
              </div>
              <p className="text-[11px] text-body mt-1">
                Assigned across projects →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/platforms">
          <Card className="border-hairline bg-canvas shadow-vercel hover:border-hairline-strong hover:shadow-vercel-float transition-all cursor-pointer group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-medium text-body group-hover:text-ink transition-colors">
                Platforms & Accounts
              </CardTitle>
              <Server className="h-4 w-4 text-mute group-hover:text-ink transition-colors" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight text-ink">
                {stats.totalAccounts}
              </div>
              <p className="text-[11px] text-body mt-1">
                Across <span className="font-semibold text-ink">{stats.totalPlatforms}</span> platforms →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/credentials">
          <Card className="border-hairline bg-canvas shadow-vercel hover:border-hairline-strong hover:shadow-vercel-float transition-all cursor-pointer group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-medium text-body group-hover:text-ink transition-colors">
                Vaulted Secrets
              </CardTitle>
              <KeyRound className="h-4 w-4 text-mute group-hover:text-ink transition-colors" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight text-ink">
                {stats.totalCredentials + stats.totalVariables}
              </div>
              <p className="text-[11px] text-body mt-1">
                <span className="text-emerald-600 font-medium">{stats.totalVariables}</span> envs •{' '}
                <span className="text-emerald-600 font-medium">{stats.totalCredentials}</span> creds →
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Admin Tasks Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">Recent Tasks</h2>
            <p className="text-xs text-body">Latest tasks assigned across projects</p>
          </div>
          <Link href="/tasks" className="text-xs font-medium text-ink hover:underline flex items-center gap-1 font-mono">
            <span>View all</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Card className="border-hairline bg-canvas shadow-vercel">
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-body">
              No tasks created yet.
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {recentTasks.map((task: any) => (
                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-canvas-soft transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-canvas-soft border border-hairline shrink-0">
                      <CheckSquare className="h-4 w-4 text-ink" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink">{task.title}</h4>
                      <p className="text-xs text-body">
                        {task.project?.name} • Assigned to <span className="font-medium text-ink">{task.assignee?.name || 'Unassigned'}</span>
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-mono ${
                      task.status === 'DONE' ? 'border-emerald-500/50 text-emerald-600' :
                      task.status === 'IN_PROGRESS' ? 'border-blue-500/50 text-blue-600' :
                      task.status === 'IN_REVIEW' ? 'border-amber-500/50 text-amber-600' : ''
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">Recent Projects</h2>
            <p className="text-xs text-body">Active software initiatives and client deployments</p>
          </div>
          <Link href="/projects" className="text-xs font-medium text-ink hover:underline flex items-center gap-1 font-mono">
            <span>View all</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentProjects.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="border-hairline bg-canvas shadow-vercel hover:border-hairline-strong hover:shadow-vercel-float transition-all cursor-pointer h-full flex flex-col justify-between group">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold text-ink group-hover:text-link transition-colors flex items-center gap-2">
                        <span>{project.name}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-mute" />
                      </CardTitle>
                      <p className="text-xs text-body line-clamp-1 mt-1">
                        {project.description || 'No description provided'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        project.status === 'PRODUCTION'
                          ? 'production'
                          : project.status === 'STAGING'
                          ? 'staging'
                          : project.status === 'DEVELOPMENT'
                          ? 'development'
                          : 'secondary'
                      }
                      className="text-[10px] uppercase font-mono"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-body flex-wrap">
                    <Badge variant="outline" className="text-[10px] border-hairline font-mono">
                      {project.type}
                    </Badge>
                    {project.productionUrl && (
                      <span className="font-mono text-[11px] text-mute flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {project.productionUrl.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                  </div>

                  {project.techStack?.frontend && project.techStack.frontend.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {project.techStack.frontend.slice(0, 3).map((t: string) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-canvas-soft border border-hairline text-[10px] font-mono text-body"
                        >
                          <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs text-body font-mono">
                    <span>
                      {project._count?.environments || 0} envs • {project._count?.platforms || 0} platforms
                    </span>
                    <span>
                      {project._count?.members || 0} members
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">Recent Audit Activity</h2>
            <p className="text-xs text-body">Security audit trail of encrypted secrets and environment actions</p>
          </div>
        </div>

        <Card className="border-hairline bg-canvas shadow-vercel divide-y divide-hairline">
          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-body">
              No recent audit activity.
            </div>
          ) : (
            recentActivities.map((act: any) => (
              <div key={act.id} className="p-4 flex items-center justify-between text-xs hover:bg-canvas-soft transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-canvas-soft border border-hairline shrink-0">
                    <Activity className="h-3.5 w-3.5 text-ink" />
                  </div>
                  <div>
                    <p className="text-ink">
                      <span className="font-semibold">{act.user?.name || 'User'}</span>{' '}
                      <span className="text-body">{act.action.toLowerCase().replace(/_/g, ' ')}</span>
                      {act.metadata?.key && (
                        <span className="font-mono font-semibold ml-1.5 px-1 py-0.5 rounded bg-canvas-soft border border-hairline text-ink">
                          {act.metadata.key}
                        </span>
                      )}
                      {act.project && (
                        <span className="text-body ml-1.5">
                          in <strong className="text-ink">{act.project.name}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-mute shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(act.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <GlobalCreateTaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <NewMemberModal
        open={memberModalOpen}
        onOpenChange={setMemberModalOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
