'use client';

import * as React from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Paperclip,
  CheckSquare,
  Lock,
  BarChart3,
  Layers,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { GlobalCreateTaskModal } from '@/components/features/tasks/GlobalCreateTaskModal';
import { TaskImportModal } from '@/components/features/tasks/TaskImportModal';
import { TaskDetailModal } from '@/components/features/tasks/TaskDetailModal';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

export function AdminTeamWorkloadView() {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState('');
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('all');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
  const [selectedProject, setSelectedProject] = React.useState<string>('all');

  // Expanded subtasks map
  const [expandedTaskIds, setExpandedTaskIds] = React.useState<Record<string, boolean>>({});
  const [quickSubtaskTitle, setQuickSubtaskTitle] = React.useState<Record<string, string>>({});
  const [addingSubtask, setAddingSubtask] = React.useState<Record<string, boolean>>({});

  // Modals
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [activeTask, setActiveTask] = React.useState<any | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const loadData = async () => {
    try {
      const [tasksRes, usersRes, projectsRes] = await Promise.all([
        api.getAllTasks(),
        api.getUsers().catch(() => ({ users: [] })),
        api.getProjects().catch(() => ({ projects: [] })),
      ]);
      setTasks(tasksRes.tasks || []);
      setUsers(usersRes.users || []);
      setProjects(projectsRes.projects || []);
    } catch (err: any) {
      toast.error('Failed to load team workload data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('tasks_updated', handleSync);
    return () => window.removeEventListener('tasks_updated', handleSync);
  }, []);

  const toggleExpand = (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleAddSubtask = async (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = (quickSubtaskTitle[taskId] || '').trim();
    if (!title) return;

    setAddingSubtask((prev) => ({ ...prev, [taskId]: true }));
    try {
      await api.addSubtask(taskId, { title });
      setQuickSubtaskTitle((prev) => ({ ...prev, [taskId]: '' }));
      toast.success('Subtask added');
      loadData();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to add subtask');
    } finally {
      setAddingSubtask((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isDone = currentStatus === 'DONE' || currentStatus === 'completed';
    const newStatus = isDone ? 'todo' : 'DONE';
    try {
      await api.updateTask(subtaskId, { status: newStatus });
      loadData();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCompleted = (s: string) => s === 'completed' || s === 'DONE';

    if (isCompleted(currentStatus) && !isCompleted(newStatus)) {
      toast.error('Completed tasks are locked and cannot be moved back.');
      return;
    }

    try {
      await api.updateTask(taskId, { status: newStatus });
      toast.success(`Task status updated to ${newStatus}`);
      loadData();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await api.exportTasksExcel(selectedProject !== 'all' ? selectedProject : undefined);
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
      await api.exportTasksJson(selectedProject !== 'all' ? selectedProject : undefined);
      toast.success('Tasks exported to JSON (.json)');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export tasks to JSON');
    } finally {
      setExporting(false);
    }
  };

  // Workload calculations
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'IN_PROGRESS').length;
  const inReviewTasks = tasks.filter((t) => t.status === 'in_review' || t.status === 'IN_REVIEW').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'DONE').length;
  const unassignedTasks = tasks.filter((t) => !t.assigneeId).length;

  // Member workload breakdown
  const memberWorkload = users.map((u) => {
    const memberTasks = tasks.filter((t) => t.assigneeId === u.id);
    const active = memberTasks.filter(
      (t) => t.status === 'in_progress' || t.status === 'todo' || t.status === 'in_review'
    ).length;
    const completed = memberTasks.filter((t) => t.status === 'completed' || t.status === 'DONE').length;
    const total = memberTasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      user: u,
      total,
      active,
      completed,
      percent,
    };
  });

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedAssignee !== 'all') {
      if (selectedAssignee === 'unassigned' && t.assigneeId) return false;
      if (selectedAssignee !== 'unassigned' && t.assigneeId !== selectedAssignee) return false;
    }

    if (selectedStatus !== 'all') {
      const s = (t.status || '').toLowerCase();
      if (selectedStatus === 'todo' && s !== 'todo') return false;
      if (selectedStatus === 'in_progress' && s !== 'in_progress') return false;
      if (selectedStatus === 'in_review' && s !== 'in_review') return false;
      if (selectedStatus === 'completed' && s !== 'completed' && s !== 'done') return false;
    }

    if (selectedProject !== 'all') {
      if (selectedProject === 'standalone' && t.projectId) return false;
      if (selectedProject !== 'standalone' && t.projectId !== selectedProject) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssignee = (t.assignee?.name || '').toLowerCase().includes(q);
      const matchProject = (t.project?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee && !matchProject) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Lock className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> In Progress
          </span>
        );
      case 'todo':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            To Do
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted/30 rounded-xl" />
          ))}
        </div>
        <div className="h-44 bg-muted/20 rounded-xl" />
        <div className="h-96 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Workload Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setSelectedStatus('all');
            setSelectedAssignee('all');
          }}
          className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-all cursor-pointer"
        >
          <div className="text-xs text-muted-foreground font-medium">Total Tasks</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{totalTasks}</div>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'in_progress' ? 'all' : 'in_progress')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'in_progress'
              ? 'border-blue-500 bg-blue-500/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/20'
          }`}
        >
          <div className="text-xs text-blue-600 font-medium">In Progress</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{inProgressTasks}</div>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'in_review' ? 'all' : 'in_review')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'in_review'
              ? 'border-amber-500 bg-amber-500/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/20'
          }`}
        >
          <div className="text-xs text-amber-600 font-medium">In Review</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{inReviewTasks}</div>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'completed'
              ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/20'
          }`}
        >
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" /> Completed
          </div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{completedTasks}</div>
        </div>

        <div
          onClick={() => setSelectedAssignee(selectedAssignee === 'unassigned' ? 'all' : 'unassigned')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedAssignee === 'unassigned'
              ? 'border-purple-500 bg-purple-500/5 shadow-xs'
              : 'border-border bg-card hover:bg-muted/20'
          }`}
        >
          <div className="text-xs text-purple-600 font-medium">Unassigned</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{unassignedTasks}</div>
        </div>
      </div>

      {/* Team Member Workload Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Team Capacity & Workload
          </h2>
          {selectedAssignee !== 'all' && (
            <button
              onClick={() => setSelectedAssignee('all')}
              className="text-xs text-primary font-medium hover:underline"
            >
              Clear Member Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {memberWorkload.map((m) => {
            const isSelected = selectedAssignee === m.user.id;
            return (
              <div
                key={m.user.id}
                onClick={() => setSelectedAssignee(isSelected ? 'all' : m.user.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <UserAvatar name={m.user.name} avatarUrl={m.user.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate text-foreground">{m.user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{m.user.role || 'Member'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{m.active} active tasks</span>
                  <span className="font-semibold text-foreground">{m.percent}% completed</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned tasks..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-md border border-border bg-background text-foreground cursor-pointer"
          >
            <option value="all">All Projects</option>
            <option value="standalone">Standalone (No Project)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-md border border-border bg-background text-foreground cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="h-9 text-xs gap-1.5"
            title="Import tasks via Excel or JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Tasks</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-9 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task</span>
          </Button>
        </div>
      </div>

      {/* Main Assigned Tasks Management Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border text-[11px]">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Subtasks</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Master Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-medium text-sm">No tasks match the filter criteria</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Try clearing filters or assign a new task above
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isExpanded = Boolean(expandedTaskIds[task.id]);
                  const subtasks = task.subTasks || [];
                  const completedSubtasks = subtasks.filter(
                    (s: any) => s.status === 'DONE' || s.status === 'completed'
                  ).length;
                  const isCompleted = task.status === 'completed' || task.status === 'DONE';
                  const isInReview = task.status === 'in_review' || task.status === 'IN_REVIEW';

                  return (
                    <React.Fragment key={task.id}>
                      <tr
                        onClick={() => {
                          setActiveTask(task);
                          setDetailModalOpen(true);
                        }}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        {/* Expand arrow */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(task.id, e)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* Title & Description */}
                        <td className="py-3.5 px-4 max-w-[260px]">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {task.description}
                            </div>
                          )}
                        </td>

                        {/* Project */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {task.project ? (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {task.project.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/70 italic text-[11px]">
                              Standalone
                            </span>
                          )}
                        </td>

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
                                  {task.assignee.email}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>

                        {/* Subtasks Count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            onClick={(e) => toggleExpand(task.id, e)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/40 hover:bg-muted px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            <CheckSquare className="w-3 h-3 text-primary" />
                            {completedSubtasks}/{subtasks.length}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                          {task.dueDate ? (
                            <span
                              className={
                                new Date(task.dueDate) < new Date() && !isCompleted
                                  ? 'text-red-500 font-semibold'
                                  : ''
                              }
                            >
                              {new Date(task.dueDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>

                        {/* Master Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isCompleted ? (
                            <span className="text-[11px] font-medium text-emerald-600 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : isInReview ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) =>
                                handleQuickStatusChange(task.id, 'completed', task.status, e)
                              }
                              className="h-7 text-xs px-2.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 gap-1"
                              title="Master Admin approval to completed"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve to Done
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) =>
                                handleQuickStatusChange(task.id, 'completed', task.status, e)
                              }
                              className="h-7 text-xs px-2.5 gap-1 hover:border-emerald-500 hover:text-emerald-600"
                            >
                              Mark Completed
                            </Button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Subtasks Drawer */}
                      {isExpanded && (
                        <tr className="bg-muted/15 border-b border-border/80">
                          <td colSpan={8} className="py-3 px-6 pl-12">
                            <div className="space-y-2.5 max-w-2xl">
                              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                                  Subtasks for: "{task.title}"
                                </span>
                              </div>

                              {subtasks.length === 0 ? (
                                <div className="text-xs text-muted-foreground/70 italic py-1">
                                  No subtasks yet. Add one below.
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {subtasks.map((st: any) => {
                                    const stDone = st.status === 'DONE' || st.status === 'completed';
                                    return (
                                      <div
                                        key={st.id}
                                        className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-1.5 text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={stDone}
                                            onChange={(e) => handleToggleSubtask(st.id, st.status, e as any)}
                                            className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer"
                                          />
                                          <span
                                            className={
                                              stDone
                                                ? 'line-through text-muted-foreground'
                                                : 'text-foreground font-medium'
                                            }
                                          >
                                            {st.title}
                                          </span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] uppercase">
                                          {st.status}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Inline add subtask form */}
                              <form
                                onSubmit={(e) => handleAddSubtask(task.id, e)}
                                className="flex gap-2 pt-1"
                              >
                                <input
                                  type="text"
                                  value={quickSubtaskTitle[task.id] || ''}
                                  onChange={(e) =>
                                    setQuickSubtaskTitle((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add a new subtask..."
                                  className="h-7 text-xs flex-1 px-2.5 rounded-md border border-border bg-background text-foreground"
                                  disabled={addingSubtask[task.id]}
                                />
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                  disabled={addingSubtask[task.id] || !quickSubtaskTitle[task.id]?.trim()}
                                  className="h-7 text-xs px-2.5 gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Subtask
                                </Button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
        onSuccess={loadData}
      />

      <TaskImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={loadData}
      />

      {activeTask && (
        <TaskDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          task={activeTask}
          onUpdate={loadData}
          onDelete={loadData}
        />
      )}
    </div>
  );
}
