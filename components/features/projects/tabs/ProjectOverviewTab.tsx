'use client';

import * as React from 'react';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Pencil, FolderKanban, Server, KeyRound, Users } from 'lucide-react';

import { TechnologyIcon } from '@/components/ui/technology-icon';
import { ProviderIcon } from '@/components/ui/provider-icon';

interface ProjectOverviewTabProps {
  project: any;
  environmentsCount: number;
  platformsCount: number;
  credentialsCount: number;
  membersCount: number;
  onEditClick?: () => void;
  onTabChange: (tab: string) => void;
}

export function ProjectOverviewTab({
  project,
  environmentsCount,
  platformsCount,
  credentialsCount,
  membersCount,
  onEditClick,
  onTabChange,
}: ProjectOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          onClick={() => onTabChange('environments')}
          className="p-4 cursor-pointer hover:border-primary/40 transition-colors shadow-vercel"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Environments</span>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-2">{environmentsCount}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">Click to view variables</span>
        </Card>

        <Card
          onClick={() => onTabChange('platforms')}
          className="p-4 cursor-pointer hover:border-primary/40 transition-colors shadow-vercel"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Connected Platforms</span>
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-2">{platformsCount}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">Click to view accounts</span>
        </Card>

        <Card
          onClick={() => onTabChange('credentials')}
          className="p-4 cursor-pointer hover:border-primary/40 transition-colors shadow-vercel"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Project Credentials</span>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-2">{credentialsCount}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">Click to view vault</span>
        </Card>

        <Card
          onClick={() => onTabChange('members')}
          className="p-4 cursor-pointer hover:border-primary/40 transition-colors shadow-vercel"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Assigned Members</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-2">{membersCount}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">Click to view team</span>
        </Card>
      </div>

      {/* Tech Stack & Links Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 shadow-vercel">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Technology Stack</CardTitle>
            {onEditClick && (
              <Button variant="ghost" size="sm" onClick={onEditClick} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </Button>
            )}
          </div>

          {project.type === 'WORDPRESS' ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-canvas-soft border border-hairline font-mono text-xs text-foreground">
                  <TechnologyIcon name="WordPress" className="h-4 w-4 shrink-0" />
                  <span>WordPress</span>
                </span>
                {project.wpConfig?.hostingProvider && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-canvas-soft border border-hairline font-mono text-xs text-foreground">
                    <ProviderIcon provider={project.wpConfig.hostingProvider} className="h-4 w-4 shrink-0" />
                    <span>{project.wpConfig.hostingProvider}</span>
                  </span>
                )}
              </div>
              {project.wpConfig && (
                <div className="space-y-2 pt-2 border-t border-hairline">
                  {project.wpConfig.websiteUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Website:</span>
                      <a href={project.wpConfig.websiteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">
                        {project.wpConfig.websiteUrl}
                      </a>
                    </div>
                  )}
                  {project.wpConfig.adminUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Admin URL:</span>
                      <a href={project.wpConfig.adminUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">
                        {project.wpConfig.adminUrl}
                      </a>
                    </div>
                  )}
                  {project.wpConfig.domainProvider && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Domain Provider:</span>
                      <span className="font-mono text-foreground">{project.wpConfig.domainProvider}</span>
                    </div>
                  )}
                </div>
              )}

              {project.techStack?.frontend?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block mb-1 font-medium">Theme & Builders:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.frontend.map((t: string) => (
                      <Badge key={t} variant="secondary" className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5">
                        <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                        <span>{t}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {project.techStack?.backend?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block mb-1 font-medium">Plugins & E-commerce:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.backend.map((t: string) => (
                      <Badge key={t} variant="secondary" className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5">
                        <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                        <span>{t}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {project.techStack?.database?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block mb-1 font-medium">Server, DB & Cache:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.database.map((t: string) => (
                      <Badge key={t} variant="secondary" className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5">
                        <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                        <span>{t}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : project.techStack ? (
            <div className="space-y-3 text-xs">
              {project.techStack.frontend?.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1.5 font-medium">Frontend:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.frontend.map((t: string) => (
                      <Badge key={t} variant="secondary" className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-1">
                        <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                        <span>{t}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.techStack.backend?.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1.5 font-medium">Backend:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.backend.map((t: string) => (
                      <Badge key={t} variant="secondary" className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-1">
                        <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                        <span>{t}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.techStack.database?.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1.5 font-medium">Database:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.database.map((t: string) => (
                      <Badge key={t} variant="secondary" className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-1">
                        <TechnologyIcon name={t} className="h-3 w-3 shrink-0" />
                        <span>{t}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No technology stack specified.</p>
          )}
        </Card>

        <Card className="p-6 space-y-4 shadow-vercel">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Project URLs & Deployments</CardTitle>
            {onEditClick && (
              <Button variant="ghost" size="sm" onClick={onEditClick} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </Button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {project.productionUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-muted/40 border border-border">
                <span className="text-muted-foreground font-medium">Production URL:</span>
                <a
                  href={project.productionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-primary hover:underline flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{project.productionUrl}</span>
                </a>
              </div>
            )}

            {project.stagingUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-muted/40 border border-border">
                <span className="text-muted-foreground font-medium">Staging URL:</span>
                <a
                  href={project.stagingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-primary hover:underline flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{project.stagingUrl}</span>
                </a>
              </div>
            )}

            {project.repositoryUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-muted/40 border border-border">
                <span className="text-muted-foreground font-medium">Repository:</span>
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-primary hover:underline flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{project.repositoryUrl}</span>
                </a>
              </div>
            )}

            {!project.productionUrl && !project.stagingUrl && !project.repositoryUrl && (
              <p className="text-xs text-muted-foreground italic">No URLs configured yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
