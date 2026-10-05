'use client';

import * as React from 'react';
import { ProjectTasksListView } from './ProjectTasksListView';

interface ProjectTasksTabProps {
  projectId: string;
  projectMembers?: any[];
}

export function ProjectTasksTab({ projectId, projectMembers = [] }: ProjectTasksTabProps) {
  return <ProjectTasksListView projectId={projectId} projectMembers={projectMembers} />;
}
