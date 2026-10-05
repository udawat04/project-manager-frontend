'use client';

import * as React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  FolderKanban,
  Server,
  KeyRound,
  Users,
  Info,
  Activity,
  Layers,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProjectOverviewTab } from '@/components/features/projects/tabs/ProjectOverviewTab';
import { ProjectEnvironmentsTab } from '@/components/features/projects/tabs/ProjectEnvironmentsTab';
import { ProjectPlatformsTab } from '@/components/features/projects/tabs/ProjectPlatformsTab';
import { ProjectCredentialsTab } from '@/components/features/projects/tabs/ProjectCredentialsTab';
import { ProjectMembersTab } from '@/components/features/projects/tabs/ProjectMembersTab';
import { ProjectInformationTab } from '@/components/features/projects/tabs/ProjectInformationTab';
import { ProjectActivityTab } from '@/components/features/projects/tabs/ProjectActivityTab';
import { ProjectTasksTab } from '@/components/features/projects/tabs/ProjectTasksTab';
import { ProjectEditModal } from '@/components/features/projects/ProjectEditModal';
import { ProjectSkeleton } from '@/components/loading';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = params.projectId as string;
  const initialTab = searchParams.get('tab') || 'overview';

  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  // Sync tab with URL query parameter
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newUrl = `/projects/${projectId}?tab=${newTab}`;
    window.history.replaceState(null, '', newUrl);
  };

  const fetchProject = async () => {
    try {
      const res = await api.getProject(projectId);
      setProject(res.project);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await api.getAuditLogs({ projectId, limit: 50 });
      setAuditLogs(res.logs || []);
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    fetchProject();
    fetchActivity();
  }, [projectId]);

  // Loading Skeleton state
  if (loading) {
    return <ProjectSkeleton />;
  }

  if (!project) {
    return (
      <div className="p-12 text-center border border-hairline rounded-lg bg-canvas">
        <p className="text-body font-medium">Project not found</p>
        <Link
          href="/projects"
          className="text-link text-xs mt-3 inline-flex items-center gap-1.5 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const environments = project.environments || [];
  const platforms = project.platforms || [];
  const credentials = project.credentials || [];
  const members = project.members || [];
  
  // Find current user's role in this project
  const userMember = members.find((m: any) => m.userId === user?.id);
  // Master Admins get EDITOR implicitly unless assigned another role (or maybe just default EDITOR)
  const isMasterAdmin = user?.role === 'MASTER_ADMIN' || user?.isMasterAdmin;
  const projectRole = userMember?.role || (isMasterAdmin ? 'EDITOR' : 'GUEST');
  
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Link & Project Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
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
                className="font-mono text-[10px] uppercase"
              >
                {project.status}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {project.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {project.description || 'No description provided'}
            </p>
            
            {/* Task Progress Rollup */}
            <div className="mt-4 max-w-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-body">
                <span className="font-medium text-ink flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" />
                  Task Progress
                </span>
                <span>{completedTasks} / {totalTasks} ({progress}%)</span>
              </div>
              <div className="w-full bg-canvas-soft rounded-full h-1.5 border border-hairline overflow-hidden">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {project.productionUrl && (
              <a
                href={project.productionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-hairline bg-canvas hover:bg-canvas-soft text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Live site</span>
              </a>
            )}

            {projectRole === 'EDITOR' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="gap-1.5 h-8 text-xs rounded-[6px] border-hairline"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Details</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted border border-border p-1.5 rounded-[8px] h-auto flex flex-wrap gap-1.5 shadow-xs">
          <TabsTrigger value="overview">
            <Layers className="h-3.5 w-3.5" />
            <span>Overview</span>
          </TabsTrigger>

          {projectRole !== 'GUEST' && (
            <TabsTrigger value="environments" badge={environments.length}>
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Environments</span>
            </TabsTrigger>
          )}

          <TabsTrigger value="tasks">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Tasks</span>
          </TabsTrigger>

          <TabsTrigger value="platforms" badge={platforms.length}>
            <Server className="h-3.5 w-3.5" />
            <span>Platforms</span>
          </TabsTrigger>

          {projectRole !== 'GUEST' && (
            <TabsTrigger value="credentials" badge={credentials.length}>
              <KeyRound className="h-3.5 w-3.5" />
              <span>Credentials</span>
            </TabsTrigger>
          )}

          <TabsTrigger value="members" badge={members.length}>
            <Users className="h-3.5 w-3.5" />
            <span>Members</span>
          </TabsTrigger>

          <TabsTrigger value="information">
            <Info className="h-3.5 w-3.5" />
            <span>Information</span>
          </TabsTrigger>

          <TabsTrigger value="activity">
            <Activity className="h-3.5 w-3.5" />
            <span>Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <ProjectOverviewTab
            project={project}
            environmentsCount={environments.length}
            platformsCount={platforms.length}
            credentialsCount={credentials.length}
            membersCount={members.length}
            onEditClick={projectRole === 'EDITOR' ? () => setEditModalOpen(true) : undefined}
            onTabChange={handleTabChange}
          />
        </TabsContent>

        {/* Tab 2: Environments */}
        {projectRole !== 'GUEST' && (
          <TabsContent value="environments">
            <ProjectEnvironmentsTab
              projectId={projectId}
              environments={environments}
              onEnvironmentCreated={fetchProject}
              onActivityRefresh={fetchActivity}
              projectRole={projectRole}
            />
          </TabsContent>
        )}

        {/* Tab: Tasks */}
        <TabsContent value="tasks">
          <ProjectTasksTab
            projectId={projectId}
            projectMembers={members}
          />
        </TabsContent>

        {/* Tab 3: Platforms */}
        <TabsContent value="platforms">
          <ProjectPlatformsTab
            projectId={projectId}
            connectedPlatforms={platforms}
            onRefresh={fetchProject}
            onActivityRefresh={fetchActivity}
            projectRole={projectRole}
            isMasterAdmin={isMasterAdmin}
          />
        </TabsContent>

        {/* Tab 4: Credentials */}
        {projectRole !== 'GUEST' && (
          <TabsContent value="credentials" className="m-0 focus-visible:outline-none">
            <ProjectCredentialsTab
              projectId={projectId}
              credentials={credentials}
              onRefresh={fetchProject}
              onActivityRefresh={fetchActivity}
              projectRole={projectRole}
              isMasterAdmin={isMasterAdmin}
            />
          </TabsContent>
        )}

        {/* Tab 5: Members */}
        <TabsContent value="members">
          <ProjectMembersTab
            projectId={projectId}
            members={members}
            onRefresh={fetchProject}
            onActivityRefresh={fetchActivity}
          />
        </TabsContent>

        {/* Tab 6: Information */}
        <TabsContent value="information">
          <ProjectInformationTab
            project={project}
            onEditClick={projectRole === 'EDITOR' ? () => setEditModalOpen(true) : undefined}
          />
        </TabsContent>

        {/* Tab 7: Activity */}
        <TabsContent value="activity">
          <ProjectActivityTab auditLogs={auditLogs} />
        </TabsContent>
      </Tabs>

      {/* Edit Project Modal */}
      <ProjectEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        project={project}
        onSuccess={() => {
          fetchProject();
          fetchActivity();
        }}
      />
    </div>
  );
}
