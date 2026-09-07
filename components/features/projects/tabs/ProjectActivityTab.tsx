'use client';

import * as React from 'react';
import { Activity, Clock, Calendar, ShieldAlert, KeyRound, Server, Users, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/lib/utils';

interface ProjectActivityTabProps {
  auditLogs: any[];
}

export function ProjectActivityTab({ auditLogs }: ProjectActivityTabProps) {
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return <Badge variant="destructive" className="text-[10px] uppercase font-mono">DELETE</Badge>;
    }
    if (act.includes('CREATE') || act.includes('ASSIGN') || act.includes('CONNECT')) {
      return <Badge variant="success" className="text-[10px] uppercase font-mono">CREATE</Badge>;
    }
    if (act.includes('REVEAL') || act.includes('EXPORT')) {
      return <Badge variant="warning" className="text-[10px] uppercase font-mono">ACCESS</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] uppercase font-mono">UPDATE</Badge>;
  };

  const getActionIcon = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('VAR') || act.includes('SECRET')) return <KeyRound className="h-4 w-4 text-primary" />;
    if (act.includes('PLATFORM')) return <Server className="h-4 w-4 text-primary" />;
    if (act.includes('MEMBER') || act.includes('USER')) return <Users className="h-4 w-4 text-primary" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const formatExactDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        full: d.toLocaleString(),
      };
    } catch {
      return { date: dateStr, time: '', full: dateStr };
    }
  };

  return (
    <div className="space-y-4">
      <Card className="divide-y divide-border overflow-hidden border-border/80 shadow-vercel">
        {auditLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 stroke-1" />
            <p className="font-medium text-foreground">No activity recorded yet</p>
            <p className="text-[11px] text-muted-foreground mt-1">Actions performed on environment variables, platforms, or members will appear here.</p>
          </div>
        ) : (
          auditLogs.map((log) => {
            const timeObj = formatExactDate(log.createdAt);
            return (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-canvas-soft transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded-md bg-canvas-soft border border-hairline shrink-0">
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="font-semibold text-xs text-foreground">
                        {log.user?.name || log.user?.email || 'System'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.action.toLowerCase().replace(/_/g, ' ')}
                      </span>
                      {log.metadata?.key && (
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline text-foreground">
                          {log.metadata.key}
                        </span>
                      )}
                      {log.metadata?.name && (
                        <span className="font-medium text-xs px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline text-foreground">
                          {log.metadata.name}
                        </span>
                      )}
                    </div>
                    {log.ipAddress && (
                      <p className="text-[11px] font-mono text-muted-foreground/70 mt-1">
                        IP: {log.ipAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Precise timestamp display */}
                <div className="flex sm:flex-col items-end gap-1 text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-hairline/60">
                  <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-foreground">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{timeObj.time}</span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-muted-foreground">{timeObj.date}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTimeAgo(log.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
