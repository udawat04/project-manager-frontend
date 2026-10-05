'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Calendar,
  MessageSquare,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckSquare,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

export interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId?: string;
  project?: { name: string };
  tags: string[];
  attachments?: any[];
  subTasks?: any[];
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  creator?: { id: string; name: string; avatarUrl?: string | null } | null;
  _count?: { comments: number; subTasks?: number };
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

const priorityConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  high: { label: 'High', icon: ArrowUp, color: 'text-red-500' },
  medium: { label: 'Medium', icon: Minus, color: 'text-yellow-500' },
  low: { label: 'Low', icon: ArrowDown, color: 'text-blue-500' },
};

function formatDueDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days}d left`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isDueDateOverdue(date: string): boolean {
  return new Date(date) < new Date();
}

interface TaskCardProps {
  task: TaskData;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const PriorityIcon = priority.icon;
  const commentCount = task._count?.comments || 0;
  const completedSubtasks = (task.subTasks || []).filter(
    (st: any) => st.status === 'DONE' || st.status === 'completed'
  ).length;
  const totalSubtasks = task.subTasks?.length || task._count?.subTasks || 0;
  const isOverdue = task.dueDate && isDueDateOverdue(task.dueDate) && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-card border border-border/70 rounded-lg p-3 cursor-pointer shadow-xs',
        'hover:border-border hover:shadow-sm transition-all duration-150',
        isDragging && 'opacity-50 shadow-lg rotate-2 z-50',
      )}
      onClick={onClick}
    >
      {/* Notion Top Row: Project Badge & Priority */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="p-0.5 -ml-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          {task.project?.name ? (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 border border-border/40 px-1.5 py-0.5 rounded truncate max-w-[130px]">
              {task.project.name}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic font-mono">
              Standalone
            </span>
          )}
        </div>

        <div className={cn('flex items-center gap-1 text-[10px] font-medium shrink-0', priority.color)}>
          <PriorityIcon className="h-3 w-3" />
          <span>{priority.label}</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>

      {/* Notion Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-muted text-muted-foreground border border-border/50"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground/80">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Due date, subtasks progress, comments, assignee */}
      <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border/30">
        <div className="flex items-center gap-2 flex-wrap">
          {task.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px]',
                isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              <span>{formatDueDate(task.dueDate)}</span>
            </div>
          )}

          {totalSubtasks > 0 && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-mono',
                completedSubtasks === totalSubtasks && totalSubtasks > 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-muted/40 text-muted-foreground border-border/40'
              )}
              title={`${completedSubtasks} of ${totalSubtasks} subtasks completed`}
            >
              <CheckSquare className="h-2.5 w-2.5" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}

          {commentCount > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{commentCount}</span>
            </div>
          )}
        </div>

        {task.assignee && (
          <UserAvatar
            name={task.assignee.name}
            avatarUrl={task.assignee.avatarUrl}
            size="xs"
          />
        )}
      </div>
    </div>
  );
}

