'use client';

import * as React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { TaskCard, TaskData } from './TaskCard';
import { cn } from '@/lib/utils';

export interface ColumnConfig {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  dotColor: string;
}

export const TASK_COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do', color: 'text-neutral-300', bgColor: 'bg-neutral-500/15 border-neutral-500/30', dotColor: 'bg-neutral-400' },
  { id: 'in_progress', title: 'In Progress', color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/30', dotColor: 'bg-blue-400' },
  { id: 'in_review', title: 'In Review', color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/30', dotColor: 'bg-amber-400' },
  { id: 'completed', title: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/30', dotColor: 'bg-emerald-400' },
  { id: 'blocked', title: 'Blocked', color: 'text-rose-400', bgColor: 'bg-rose-500/15 border-rose-500/30', dotColor: 'bg-rose-400' },
];

interface TaskColumnProps {
  column: ColumnConfig;
  tasks: TaskData[];
  onTaskClick?: (task: TaskData) => void;
  onAddTask?: () => void;
}

export function TaskColumn({ column, tasks, onTaskClick, onAddTask }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={cn(
        'flex flex-col min-w-[285px] max-w-[320px] w-full shrink-0 rounded-xl',
        'bg-muted/15 border border-border/60 transition-colors',
        isOver && 'ring-2 ring-primary/40 bg-primary/5 border-primary/40',
      )}
    >
      {/* Notion-Style Column Header */}
      <div className="flex items-center justify-between p-3 pb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border',
              column.bgColor,
              column.color,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', column.dotColor)} />
            <span>{column.title}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono font-medium px-1.5 py-0.5 rounded-full bg-muted/50 border border-border/40">
            {tasks.length}
          </span>
        </div>
        {onAddTask && column.id === 'todo' && (
          <button
            onClick={onAddTask}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Add task"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tasks List with Notion styling & sleek scrollbar */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 pt-0 space-y-2 overflow-y-auto min-h-[140px] max-h-[calc(100vh-250px)] custom-scrollbar"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/60 border border-dashed border-border/40 rounded-lg">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

