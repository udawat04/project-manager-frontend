'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Filter, Search, LayoutGrid, List, CheckCircle2, Circle, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskColumn, TASK_COLUMNS } from './TaskColumn';
import { TaskCard, TaskData } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { GlobalCreateTaskModal } from './GlobalCreateTaskModal';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

interface KanbanBoardProps {
  projectId?: string;
  projectMembers?: any[];
  filterByAssignee?: string;
  isAdminWorkload?: boolean;
}

export function KanbanBoard({ projectId = 'all', projectMembers = [], filterByAssignee, isAdminWorkload = false }: KanbanBoardProps) {
  const [tasks, setTasks] = React.useState<TaskData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTask, setActiveTask] = React.useState<TaskData | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<TaskData | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterPriority, setFilterPriority] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'board' | 'list'>('board');
  const { user } = useAuth();
  
  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const canCreateTask = isMasterAdmin;

  const [createModalOpen, setCreateModalOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const fetchTasks = async () => {
    try {
      let res;
      if (projectId === 'all') {
        res = await api.getAllTasks();
      } else {
        res = await api.getProjectTasks(projectId);
      }
      
      let fetchedTasks = res.tasks || [];
      if (filterByAssignee) {
        fetchedTasks = fetchedTasks.filter((t: any) => t.assignee?.id === filterByAssignee);
      }
      setTasks(fetchedTasks);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tasks');
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

  // Group tasks by status
  const getTasksByStatus = (statusId: string): TaskData[] => {
    let filtered = tasks.filter((t) => t.status === statusId);

    // Rule 5: On member dashboard/Kanban board, remove completed tasks older than 24 hours (1 day)
    if (!isMasterAdmin && (statusId === 'completed' || statusId === 'DONE')) {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      filtered = filtered.filter((t) => {
        const completedTime = t.completedAt
          ? new Date(t.completedAt).getTime()
          : new Date((t as any).updatedAt || (t as any).createdAt).getTime();
        return completedTime >= oneDayAgo;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (filterPriority) {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }
    return filtered;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // handled at dragEnd
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the target column: either the column directly, or the column of the task we're dropping onto
    let targetColumn = TASK_COLUMNS.find((c) => c.id === overId);
    if (!targetColumn) {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetColumn = TASK_COLUMNS.find((c) => c.id === overTask.status);
      }
    }

    if (!targetColumn) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetColumn.id) return;

    const isTaskCompleted = task.status === 'completed' || task.status === 'DONE';
    const isTargetCompleted = targetColumn.id === 'completed' || targetColumn.id === 'DONE';
    const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');

    // Rule: Completed tasks cannot be moved back
    if (isTaskCompleted && !isTargetCompleted) {
      toast.error('Completed tasks are locked and cannot be moved back to In Progress, In Review, or To Do.');
      return;
    }

    // Rule: Only Master Admin can drag into Completed
    if (isTargetCompleted && !isTaskCompleted) {
      if (!isMasterAdmin) {
        toast.error('Only Master Admin has permission to mark tasks as completed.');
        return;
      }
    }

    // Rule: In Progress cannot move back to To Do
    if ((task.status === 'in_progress' || task.status === 'IN_PROGRESS') && targetColumn.id === 'todo') {
      toast.error('Cannot move tasks from In Progress back to To Do.');
      return;
    }

    // Rule: In Review cannot move back to To Do
    if ((task.status === 'in_review' || task.status === 'IN_REVIEW') && targetColumn.id === 'todo') {
      toast.error('Cannot move tasks from In Review back to To Do.');
      return;
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: targetColumn!.id } : t
      )
    );

    try {
      await api.updateTask(taskId, { status: targetColumn.id });
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task status');
      fetchTasks(); // Revert on error
    }
  };


  const handleTaskClick = (task: TaskData) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_COLUMNS.slice(0, 4).map((col) => (
          <div
            key={col.id}
            className="min-w-[280px] max-w-[320px] w-full rounded-xl bg-muted/30 border border-border/50 p-3 animate-pulse"
          >
            <div className="h-4 w-24 bg-muted rounded mb-3" />
            <div className="space-y-2">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 h-8 text-xs"
          />
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground cursor-pointer"
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <div className="flex bg-muted/50 p-1 rounded-md border border-border">
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-1.5 rounded-sm transition-colors', viewMode === 'list' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground')}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={cn('p-1.5 rounded-sm transition-colors', viewMode === 'board' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground')}
            title="Board View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {canCreateTask && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Button>
        )}
      </div>

      {viewMode === 'board' ? (
        /* Kanban Columns */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 custom-scrollbar">
            {TASK_COLUMNS.map((column) => (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onTaskClick={handleTaskClick}
                onAddTask={isMasterAdmin ? () => setCreateModalOpen(true) : undefined}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 opacity-90">
                <TaskCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No tasks found.</div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="flex items-center gap-4 p-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-sm font-medium text-foreground truncate", task.status === 'done' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={cn("text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border",
                        task.status === 'done' ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" :
                        task.status === 'in_progress' ? "border-blue-500/30 text-blue-600 bg-blue-500/10" :
                        task.status === 'in_review' ? "border-amber-500/30 text-amber-600 bg-amber-500/10" :
                        "border-muted text-muted-foreground bg-muted"
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.priority && (
                        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {task.priority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.assignee && (
                    <div className="shrink-0 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:inline-block w-24 truncate">{task.assignee.name}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
        projectMembers={projectMembers}
        onUpdate={() => {
          fetchTasks();
        }}
        onDelete={() => {
          fetchTasks();
        }}
      />

      {/* Create Task Modal */}
      <GlobalCreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultProjectId={projectId !== 'all' ? projectId : undefined}
        onSuccess={fetchTasks}
      />
    </div>
  );
}
