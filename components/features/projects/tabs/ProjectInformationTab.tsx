'use client';

import * as React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, ExternalLink } from 'lucide-react';

interface ProjectInformationTabProps {
  project: any;
  onEditClick?: () => void;
}

export function ProjectInformationTab({
  project,
  onEditClick,
}: ProjectInformationTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5 shadow-vercel">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Project Information & Configuration</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Core metadata, technology stack parameters, and operational URLs.
            </p>
          </div>

          {onEditClick && (
            <Button size="sm" onClick={onEditClick} className="gap-1.5 h-8 text-xs rounded-[6px]">
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Project Details</span>
            </Button>
          )}
        </div>

        {/* Core Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-[6px] bg-muted/40 border border-border">
            <span className="text-muted-foreground block text-[11px] mb-1">Project Name</span>
            <p className="font-bold text-foreground text-sm">{project.name}</p>
          </div>

          <div className="p-3 rounded-[6px] bg-muted/40 border border-border">
            <span className="text-muted-foreground block text-[11px] mb-1">Slug</span>
            <p className="font-mono text-foreground">{project.slug}</p>
          </div>

          <div className="p-3 rounded-[6px] bg-muted/40 border border-border">
            <span className="text-muted-foreground block text-[11px] mb-1">Project Type</span>
            <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
              {project.type}
            </Badge>
          </div>

          <div className="p-3 rounded-[6px] bg-muted/40 border border-border">
            <span className="text-muted-foreground block text-[11px] mb-1">Current Status</span>
            <Badge
              variant={
                project.status === 'PRODUCTION'
                  ? 'success'
                  : project.status === 'STAGING'
                  ? 'warning'
                  : 'secondary'
              }
              className="text-[10px] font-mono uppercase mt-0.5"
            >
              {project.status}
            </Badge>
          </div>
        </div>

        {project.description && (
          <div>
            <span className="text-xs font-semibold text-foreground block mb-1">Description</span>
            <p className="text-xs text-muted-foreground leading-relaxed p-3 rounded-[6px] bg-muted/30 border border-border">
              {project.description}
            </p>
          </div>
        )}

        {/* WordPress Details */}
        {project.wpConfig && (
          <div className="space-y-3 pt-3 border-t border-border">
            <h4 className="text-xs font-bold text-foreground">WordPress Infrastructure Configuration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {Object.entries(project.wpConfig).map(([key, val]) => (
                <div key={key} className="p-2.5 rounded-[6px] bg-muted/40 border border-border">
                  <span className="text-muted-foreground text-[10px] block capitalize font-medium">
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className="font-mono text-foreground font-semibold truncate block mt-0.5">
                    {String(val) || 'Not set'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {project.notes && (
          <div className="pt-3 border-t border-border">
            <span className="text-xs font-semibold text-foreground block mb-1">Operational Notes</span>
            <div className="p-3 bg-muted/40 rounded-[6px] border border-border text-xs font-mono leading-relaxed">
              {project.notes}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
