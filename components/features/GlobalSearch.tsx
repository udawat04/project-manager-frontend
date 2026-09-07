'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderKanban, Server, Key, User, Variable, X, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<{
    projects: any[];
    platforms: any[];
    platformAccounts: any[];
    credentials: any[];
    members: any[];
    variables: any[];
  }>({
    projects: [],
    platforms: [],
    platformAccounts: [],
    credentials: [],
    members: [],
    variables: [],
  });

  const router = useRouter();

  // Keyboard shortcut ⌘K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults({
        projects: [],
        platforms: [],
        platformAccounts: [],
        credentials: [],
        members: [],
        variables: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery('');
    router.push(url);
  };

  const hasAnyResults =
    results.projects.length > 0 ||
    results.platforms.length > 0 ||
    results.platformAccounts.length > 0 ||
    results.credentials.length > 0 ||
    results.members.length > 0 ||
    results.variables.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative z-50 w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-muted/20">
          <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, platforms, accounts, credentials, env variables... (ESC to close)"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-2 space-y-4 text-xs">
          {loading && (
            <div className="p-6 text-center text-muted-foreground animate-pulse">
              Searching across ProjectVault...
            </div>
          )}

          {!loading && query && !hasAnyResults && (
            <div className="p-8 text-center text-muted-foreground">
              No results found for <span className="text-foreground font-semibold">"{query}"</span>
            </div>
          )}

          {!loading && !query && (
            <div className="p-6 text-center text-muted-foreground">
              Type anything to search across all your projects, credentials, and platforms.
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                Projects
              </div>
              <div className="space-y-0.5 mt-1">
                {results.projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleSelect(`/projects/${proj.id}`)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{proj.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {proj.type}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platforms & Platform Accounts */}
          {(results.platforms.length > 0 || results.platformAccounts.length > 0) && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" />
                Platforms & Accounts
              </div>
              <div className="space-y-0.5 mt-1">
                {results.platforms.map((plat) => (
                  <div
                    key={plat.id}
                    onClick={() => handleSelect(`/platforms/${plat.id}`)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-foreground">{plat.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {plat.category}
                    </Badge>
                  </div>
                ))}
                {results.platformAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => handleSelect(`/platforms/${acc.platformId}`)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{acc.name}</span>
                      <span className="text-muted-foreground">({acc.platform?.name})</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {acc.loginIdentifier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credentials */}
          {results.credentials.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                Credentials
              </div>
              <div className="space-y-0.5 mt-1">
                {results.credentials.map((cred) => (
                  <div
                    key={cred.id}
                    onClick={() =>
                      cred.project
                        ? handleSelect(`/projects/${cred.project.id}?tab=credentials`)
                        : handleSelect('/credentials')
                    }
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{cred.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {cred.type}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {cred.project?.name || cred.platformAccount?.platform?.name || 'Platform'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environment Variables */}
          {results.variables.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Variable className="h-3.5 w-3.5" />
                Environment Variables
              </div>
              <div className="space-y-0.5 mt-1">
                {results.variables.map((v) => (
                  <div
                    key={v.id}
                    onClick={() =>
                      handleSelect(`/projects/${v.project.id}?tab=environments`)
                    }
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">{v.key}</span>
                      <span className="text-[11px] text-muted-foreground">
                        in {v.project?.name} ({v.environment})
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {v.isSensitive ? 'Secret' : 'Public'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          {results.members.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Members
              </div>
              <div className="space-y-0.5 mt-1">
                {results.members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelect('/members')}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-muted-foreground">{m.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Navigate with click or arrow keys</span>
          <span className="font-mono">ProjectVault ⌘K</span>
        </div>
      </div>
    </div>
  );
}
