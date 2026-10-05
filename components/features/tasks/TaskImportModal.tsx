'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, FileCode } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TaskImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SAMPLE_TASKS_DATA = [
  {
    Title: 'Implement Payment Gateway Webhook',
    Description: 'Build secure Stripe and Razorpay webhook handlers with HMAC signature verification',
    Priority: 'HIGH',
    Status: 'todo',
    AssigneeEmail: 'rcatway1921@gmail.com',
    ProjectName: 'Pg ledger',
    DueDate: '2026-10-15',
    Tags: 'backend, payments, security',
  },
  {
    Title: 'Responsive Mobile Header & Navigation',
    Description: 'Refactor mobile header with slide-over drawer and Notion-style theme toggle',
    Priority: 'MEDIUM',
    Status: 'in_progress',
    AssigneeEmail: 'itzudawat@gmail.com',
    ProjectName: 'Pg ledger',
    DueDate: '2026-10-12',
    Tags: 'frontend, ui, mobile',
  },
  {
    Title: 'Audit Cloudinary Media Uploads',
    Description: 'Configure image optimizations, format auto-conversions, and attachment deletion cleanup',
    Priority: 'HIGH',
    Status: 'in_review',
    AssigneeEmail: 'rcatway1921@gmail.com',
    ProjectName: 'Marnine Plumbing',
    DueDate: '2026-10-18',
    Tags: 'cloudinary, storage',
  },
  {
    Title: 'Setup Database Health Check Cron',
    Description: 'Add automated health checks for Postgres connection pool and Redis cache',
    Priority: 'LOW',
    Status: 'todo',
    AssigneeEmail: 'itzudawat@gmail.com',
    ProjectName: '',
    DueDate: '2026-10-25',
    Tags: 'devops, database',
  },
];

export function TaskImportModal({ open, onOpenChange, onSuccess }: TaskImportModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedTasks, setParsedTasks] = React.useState<any[]>([]);
  const [parsingError, setParsingError] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setParsedTasks([]);
      setParsingError(null);
    }
  }, [open]);

  const handleDownloadExcelTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_TASKS_DATA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, 'sample_tasks_template.xlsx');
    toast.success('Downloaded sample Excel template (.xlsx)');
  };

  const handleDownloadJsonTemplate = () => {
    const jsonFormatted = SAMPLE_TASKS_DATA.map((item) => ({
      title: item.Title,
      description: item.Description,
      priority: item.Priority,
      status: item.Status,
      assigneeEmail: item.AssigneeEmail,
      projectName: item.ProjectName,
      dueDate: item.DueDate,
      tags: item.Tags.split(',').map((t) => t.trim()),
    }));

    const blob = new Blob([JSON.stringify(jsonFormatted, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_tasks_template.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded sample JSON template (.json)');
  };

  const normalizeRow = (raw: Record<string, any>): any | null => {
    const keys = Object.keys(raw);
    const findVal = (predicate: (k: string) => boolean) => {
      const foundKey = keys.find((k) => predicate(k.toLowerCase().replace(/[^a-z0-9]/g, '')));
      return foundKey ? raw[foundKey] : undefined;
    };

    // Title: support 'title', 'task', 'taskname', 'name', 'subject', 'summary'
    const title = findVal((k) =>
      k.includes('title') || k === 'task' || k === 'taskname' || k === 'name' || k.includes('subject') || k.includes('summary')
    );
    if (!title || !String(title).trim()) return null;

    const desc = findVal((k) => k.includes('desc') || k.includes('detail') || k.includes('note'));
    const priority = findVal((k) => k.includes('prior') || k.includes('urgency') || k.includes('severity'));
    const status = findVal((k) => k.includes('status') || k.includes('state') || k.includes('stage'));

    // Separate email and assignee name cleanly
    const emailVal = findVal((k) => k.includes('email') || k === 'assigneeemail');
    const assigneeVal = findVal(
      (k) => (k.includes('assign') || k.includes('member') || k.includes('owner') || k === 'user') && !k.includes('email')
    );

    let assigneeEmail: string | undefined = undefined;
    let assigneeName: string | undefined = undefined;

    if (emailVal && String(emailVal).trim()) {
      const str = String(emailVal).trim();
      if (str.includes('@')) {
        assigneeEmail = str;
      } else {
        assigneeName = str;
      }
    }
    if (assigneeVal && String(assigneeVal).trim()) {
      const str = String(assigneeVal).trim();
      if (str.includes('@')) {
        assigneeEmail = str;
      } else if (!assigneeName) {
        assigneeName = str;
      }
    }

    const project = findVal((k) => k.includes('proj'));
    const dueDate = findVal((k) => k.includes('due') || k.includes('date') || k.includes('dead'));
    const tags = findVal((k) => k.includes('tag') || k.includes('label'));

    let tagList: string[] = [];
    if (Array.isArray(tags)) {
      tagList = tags.map(String);
    } else if (typeof tags === 'string' && tags.trim()) {
      tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    return {
      title: String(title).trim(),
      description: desc ? String(desc).trim() : undefined,
      priority: priority ? String(priority).toUpperCase().trim() : 'MEDIUM',
      status: status ? String(status).toLowerCase().trim() : 'todo',
      assigneeEmail,
      assigneeName,
      projectName: project ? String(project).trim() : undefined,
      dueDate: dueDate !== undefined && dueDate !== null && String(dueDate).trim() ? String(dueDate).trim() : undefined,
      tags: tagList,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    const fileName = uploadedFile.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      setFile(null);
      setParsedTasks([]);
      setParsingError('CSV files are not supported. Please upload an Excel (.xlsx, .xls) or JSON (.json) file.');
      return;
    }

    setFile(uploadedFile);
    setParsingError(null);

    const reader = new FileReader();

    if (fileName.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const rawList = Array.isArray(parsed) ? parsed : parsed.tasks;
          if (!Array.isArray(rawList)) {
            throw new Error('JSON file must be an array of tasks or an object with a "tasks" array.');
          }

          const items = rawList
            .map((item) => normalizeRow(item))
            .filter((item): item is NonNullable<typeof item> => item !== null);

          if (items.length === 0) {
            throw new Error('No valid task entries with a "title" found in JSON.');
          }

          setParsedTasks(items);
        } catch (err: any) {
          setParsingError(err.message || 'Failed to parse JSON file.');
          setParsedTasks([]);
        }
      };
      reader.readAsText(uploadedFile);
    } else {
      // Excel (.xlsx, .xls)
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('The uploaded Excel workbook contains no sheets.');
          }

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd',
            defval: '',
          });

          if (!Array.isArray(rawRows) || rawRows.length === 0) {
            throw new Error('Excel sheet contains no data rows.');
          }

          const items = rawRows
            .map((row) => normalizeRow(row))
            .filter((item): item is NonNullable<typeof item> => item !== null);

          if (items.length === 0) {
            throw new Error('No valid tasks with a "Title" column found in Excel sheet.');
          }

          setParsedTasks(items);
        } catch (err: any) {
          setParsingError(err.message || 'Failed to read Excel file.');
          setParsedTasks([]);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleImport = async () => {
    if (parsedTasks.length === 0) {
      toast.error('No valid tasks to import.');
      return;
    }

    setImporting(true);
    setParsingError(null);
    try {
      const res = await api.importTasks(parsedTasks);
      if (res.importedCount > 0) {
        toast.success(`Successfully imported ${res.importedCount} tasks.`);
        if (res.errors && res.errors.length > 0) {
          toast.warning(`${res.errors.length} tasks had errors and were skipped.`);
        }
        window.dispatchEvent(new CustomEvent('tasks_updated'));
        onOpenChange(false);
        onSuccess?.();
      } else {
        const errDetail = res.errors?.[0]?.error || 'Failed to import any tasks. Please check data format.';
        setParsingError(`Import failed: ${errDetail}`);
        toast.error(`Import failed: ${errDetail}`);
      }
    } catch (err: any) {
      setParsingError(err.message || 'Failed to import tasks');
      toast.error(err.message || 'Failed to import tasks');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <span>Bulk Task Import (Excel & JSON)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Master Admin bulk task creator. Import tasks with project mappings, assignee emails, priorities, and dates from Excel or JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Download Template Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Need a sample format?</p>
              <p className="text-[11px] text-muted-foreground">Download the official Excel or JSON template</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadExcelTemplate}
                className="text-xs gap-1.5 h-8 bg-card"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Excel (.xlsx)</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadJsonTemplate}
                className="text-xs gap-1.5 h-8 bg-card"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                <span>JSON (.json)</span>
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/10 transition-colors">
            <label className="cursor-pointer flex flex-col items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm font-semibold text-foreground">
                {file ? file.name : 'Select Excel (.xlsx, .xls) or JSON (.json) file'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Supports Excel (.xlsx, .xls) and JSON (.json) files only. CSV is not supported.
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Error notice */}
          {parsingError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-500/10 text-red-600 border border-red-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Found {parsedTasks.length} tasks ready to import
                </span>
              </div>

              <div className="border border-border rounded-lg max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border sticky top-0">
                    <tr>
                      <th className="p-2">Title</th>
                      <th className="p-2">Priority</th>
                      <th className="p-2">Project</th>
                      <th className="p-2">Assignee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedTasks.slice(0, 15).map((t, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="p-2 font-medium truncate max-w-[200px]">{t.title}</td>
                        <td className="p-2 uppercase text-[10px]">{t.priority || 'MEDIUM'}</td>
                        <td className="p-2 text-muted-foreground">{t.projectName || 'Standalone'}</td>
                        <td className="p-2 text-muted-foreground">{t.assigneeEmail || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedTasks.length > 15 && (
                  <div className="p-2 text-center text-xs text-muted-foreground bg-muted/10">
                    ...and {parsedTasks.length - 15} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border bg-card">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={parsedTasks.length === 0 || importing}
            isLoading={importing}
          >
            Import {parsedTasks.length} Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
