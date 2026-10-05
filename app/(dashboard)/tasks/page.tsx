'use client';

import * as React from 'react';
import { KanbanBoard } from '@/components/features/tasks/KanbanBoard';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [viewScope, setViewScope] = React.useState<'my_tasks' | 'all_tasks'>('my_tasks');

  return (
    <div className="space-y-5 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Global Kanban Board
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage and track all tasks across projects
          </p>
        </div>

        {user?.isMasterAdmin && (
          <div className="bg-muted p-1 rounded-md flex items-center border border-border">
            <Button
              variant={viewScope === 'my_tasks' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setViewScope('my_tasks')}
            >
              My Tasks
            </Button>
            <Button
              variant={viewScope === 'all_tasks' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setViewScope('all_tasks')}
            >
              All Company Tasks
            </Button>
          </div>
        )}
      </div>

      {/* Full height Kanban Board */}
      <div className="flex-1 min-h-0">
        <KanbanBoard 
          projectId="all" 
          filterByAssignee={viewScope === 'my_tasks' ? user?.id : undefined} 
        />
      </div>
    </div>
  );
}
