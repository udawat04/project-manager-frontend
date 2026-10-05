'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProjectTasksListView } from '@/components/features/projects/tabs/ProjectTasksListView';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [projRes, membersRes] = await Promise.all([
          api.getProject(projectId),
          api.getProjectMembers(projectId),
        ]);
        setProject(projRes.project);
        setMembers(membersRes.members || []);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted/20 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {project?.name || 'Project'}</span>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Tasks — {project?.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View and manage all tasks, subtasks, and attachments for this project
        </p>
      </div>

      {/* Project Tasks List View */}
      <ProjectTasksListView projectId={projectId} projectMembers={members} />
    </div>
  );
}
