'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  Activity,
  ArrowUpRight,
  Code,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { KanbanBoard } from '@/components/features/tasks/KanbanBoard';
import { api } from '@/lib/api';

interface DeveloperDashboardProps {
  data: any;
}

export function DeveloperDashboard({ data }: DeveloperDashboardProps) {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    // Left empty since KanbanBoard handles its own fetching now
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const recentProjects = data?.recentProjects || [];

  return (
    <div className="space-y-8">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span>{getGreeting()}, {user?.name}</span>
            <Code className="h-5 w-5 text-emerald-500" />
          </h1>
          <p className="text-xs text-body mt-1">
            Ready to build? Here's what's on your plate today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/tasks">
            <Button size="sm" className="gap-1.5 h-9 px-4 rounded-[6px] bg-ink hover:bg-ink/90 text-on-primary shadow-vercel">
              <CheckSquare className="h-4 w-4" />
              <span>Go to My Tasks</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Kanban Board Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-ink">My Task Board</h2>
          </div>
          
          <div className="h-[600px] border border-border rounded-xl bg-card overflow-hidden">
            {user && <KanbanBoard projectId="all" filterByAssignee={user.id} />}
          </div>
        </div>

        {/* Recent Projects Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-ink">Recent Projects</h2>
            <Link href="/projects" className="text-xs font-medium text-ink hover:underline font-mono">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="border-hairline bg-canvas shadow-vercel hover:border-hairline-strong transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-5 w-5 text-mute" />
                      <div>
                        <p className="text-sm font-semibold text-ink">{project.name}</p>
                        <p className="text-xs text-body line-clamp-1">{project.description}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-mute" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
