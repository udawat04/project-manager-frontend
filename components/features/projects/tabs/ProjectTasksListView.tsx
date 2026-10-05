'use client';

import * as React from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  CheckSquare,
  Lock,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { GlobalCreateTaskModal } from '@/components/features/tasks/GlobalCreateTaskModal';
import { TaskDetailModal } from '@/components/features/tasks/TaskDetailModal';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

interface ProjectTasksListViewProps {
  projectId: string;
  projectMembers?: any[];
}

export function ProjectTasksListView({ projectId, projectMembers = [] }: ProjectTasksListViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');

  const fetchTasks = async () => {
    try {
      const res = await api.getProjectTasks(projectId);
      setTasks(res.tasks || []);
    } catch (err: any) {
      toast.error('Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();

    const handleSync = () => fetchTasks();
    window.addEventListener('tasks_updated', handleSync);
    return () => window.removeEventListener('tasks_updated', handleSync);
  }, [projectId]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await api.exportTasksExcel(projectId);
      toast.success('Tasks exported to Excel (.xlsx)');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export tasks to Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      await api.exportTasksJson(projectId);
      toast.success('Tasks exported to JSON (.json)');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export tasks to JSON');
    } finally {
      setExporting(false);
    }
  };

  // User permission check: Regular members only see tasks assigned to them
  const visibleTasks = React.useMemo(() => {
    if (isMasterAdmin) return tasks;
    return tasks.filter((t) => t.assigneeId === user?.id || t.assignee?.id === user?.id);
  }, [tasks, isMasterAdmin, user?.id]);

  // Status metrics
  const todoCount = visibleTasks.filter((t) => t.status === 'todo' || t.status === 'TODO').length;
  const inProgressCount = visibleTasks.filter((t) => t.status === 'in_progress' || t.status === 'IN_PROGRESS').length;
  const inReviewCount = visibleTasks.filter((t) => t.status === 'in_review' || t.status === 'IN_REVIEW').length;
  const completedCount = visibleTasks.filter((t) => t.status === 'completed' || t.status === 'DONE').length;

  const filteredTasks = visibleTasks.filter((t) => {
    // Status filter
    if (statusFilter !== 'all') {
      const s = (t.status || '').toLowerCase();
      if (statusFilter === 'todo' && s !== 'todo') return false;
      if (statusFilter === 'in_progress' && s !== 'in_progress') return false;
      if (statusFilter === 'in_review' && s !== 'in_review') return false;
      if (statusFilter === 'completed' && s !== 'completed' && s !== 'done') return false;
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      if ((t.priority || '').toUpperCase() !== priorityFilter.toUpperCase()) return false;
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssignee = (t.assignee?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Lock className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> In Progress
          </span>
        );
      case 'todo':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            To Do
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || '').toUpperCase();
    switch (p) {
      case 'URGENT':
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
            {p}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
            LOW
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted/40 rounded-lg" />
        <div className="h-64 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter(statusFilter === 'todo' ? 'all' : 'todo')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'todo'
              ? 'border-primary bg-primary/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="text-xs text-muted-foreground font-medium">To Do</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{todoCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'in_progress'
              ? 'border-blue-500 bg-blue-500/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="text-xs text-blue-600 font-medium">In Progress</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{inProgressCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'in_review' ? 'all' : 'in_review')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'in_review'
              ? 'border-amber-500 bg-amber-500/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="text-xs text-amber-600 font-medium">In Review</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{inReviewCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" /> Completed
          </div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{completedCount}</div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or assignee..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/60">
            {['all', 'todo', 'in_progress', 'in_review', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'all'
                  ? 'All'
                  : st === 'in_progress'
                  ? 'In Progress'
                  : st === 'in_review'
                  ? 'In Review'
                  : st === 'completed'
                  ? 'Completed'
                  : 'To Do'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMasterAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={exporting}
                className="h-9 text-xs gap-1.5"
                title="Export tasks to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export Excel</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                disabled={exporting}
                className="h-9 text-xs gap-1.5"
                title="Export tasks to JSON (.json)"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                <span>Export JSON</span>
              </Button>
            </>
          )}

          {isMasterAdmin && (
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tasks Table / Status View */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border text-[11px]">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Subtasks</th>
                <th className="py-3 px-4">Attachments</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-medium text-sm">No tasks found</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {search || statusFilter !== 'all'
                        ? 'Try clearing the search or status filters'
                        : 'Create your first task for this project above'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const subtaskCount = task.subTasks?.length || 0;
                  const completedSubtasks =
                    task.subTasks?.filter((s: any) => s.status === 'DONE' || s.status === 'completed').length || 0;
                  const attachmentsCount = Array.isArray(task.attachments) ? task.attachments.length : 0;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setDetailModalOpen(true);
                      }}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Title & Description */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getPriorityBadge(task.priority)}</td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={task.assignee.name}
                              avatarUrl={task.assignee.avatarUrl}
                              size="xs"
                            />
                            <div className="truncate">
                              <span className="font-medium text-foreground block truncate">
                                {task.assignee.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {task.assignee.role || 'Member'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Subtasks */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {subtaskCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded">
                            <CheckSquare className="w-3 h-3 text-primary" />
                            {completedSubtasks}/{subtaskCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Attachments */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {attachmentsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded">
                            <Paperclip className="w-3 h-3 text-muted-foreground" />
                            {attachmentsCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                        {task.dueDate ? (
                          <span
                            className={
                              new Date(task.dueDate) < new Date() && task.status !== 'completed'
                                ? 'text-red-500 font-semibold'
                                : ''
                            }
                          >
                            {new Date(task.dueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <GlobalCreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultProjectId={projectId}
        lockProject={true}
        onSuccess={fetchTasks}
      />

      {selectedTask && (
        <TaskDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          task={selectedTask}
          projectMembers={projectMembers}
          onUpdate={fetchTasks}
          onDelete={fetchTasks}
        />
      )}
    </div>
  );
}
