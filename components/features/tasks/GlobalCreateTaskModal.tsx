'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { UserAvatar } from '@/components/ui/user-avatar';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Paperclip,
  Calendar,
  Layers,
  FileText,
  X,
  Upload,
} from 'lucide-react';

interface GlobalCreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultProjectId?: string;
  lockProject?: boolean;
}

export function GlobalCreateTaskModal({
  open,
  onOpenChange,
  onSuccess,
  defaultProjectId,
  lockProject = false,
}: GlobalCreateTaskModalProps) {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);

  const [projectId, setProjectId] = React.useState<string>('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState('MEDIUM');
  const [status, setStatus] = React.useState('todo');
  const [assigneeId, setAssigneeId] = React.useState<string>('');
  const [dueDate, setDueDate] = React.useState('');
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);

  // Subtasks list
  const [subtasks, setSubtasks] = React.useState<string[]>([]);
  const [newSubtask, setNewSubtask] = React.useState('');

  // Attachments to upload after task creation
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const [submitting, setSubmitting] = React.useState(false);
  const [loadingInitial, setLoadingInitial] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      loadInitialData();
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('todo');
      setAssigneeId('');
      setDueDate('');
      setTags([]);
      setTagInput('');
      setSubtasks([]);
      setNewSubtask('');
      setSelectedFiles([]);
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      } else {
        setProjectId('');
      }
    }
  }, [open, defaultProjectId]);

  const loadInitialData = async () => {
    setLoadingInitial(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        api.getProjects().catch(() => ({ projects: [] })),
        api.getUsers().catch(() => ({ users: [] })),
      ]);
      setProjects(projRes.projects || []);
      setAllUsers(usersRes.users || []);
    } catch (err: any) {
      toast.error('Failed to load projects and members');
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [...prev, newSubtask.trim()]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags((prev) => [...prev, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setSubmitting(true);
    try {
      const createdRes = await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeId: assigneeId || null,
        projectId: projectId && projectId !== 'none' ? projectId : null,
        tags,
        subtasks: subtasks.map((st) => ({ title: st })),
      });

      const newTask = createdRes.task;

      // Upload any selected attachments
      if (selectedFiles.length > 0 && newTask?.id) {
        for (const file of selectedFiles) {
          try {
            await api.uploadTaskAttachment(newTask.id, file);
          } catch (uploadErr) {
            console.error('Failed to upload file:', file.name, uploadErr);
          }
        }
      }

      toast.success('Task created successfully');
      window.dispatchEvent(new CustomEvent('tasks_updated'));
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = [
    { value: '', label: 'No Project (Standalone Task)' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...allUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role || 'Member'})` })),
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden flex flex-col gap-0 max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <DialogHeader className="border-b border-border p-4 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold text-foreground">
                {lockProject && defaultProjectId ? 'Add Project Task' : 'Assign New Task'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
            {/* Title */}
            <div>
              <textarea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="What needs to be done?"
                rows={1}
                className="w-full text-2xl font-bold text-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 overflow-hidden min-h-[38px]"
                autoFocus
                required
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-[130px_1fr] gap-y-3.5 gap-x-4 items-center bg-muted/20 p-4 rounded-xl border border-border/60">
              {/* Project */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</div>
              <div>
                {loadingInitial ? (
                  <div className="text-xs text-muted-foreground py-1">Loading projects...</div>
                ) : lockProject ? (
                  <div className="text-xs font-medium text-foreground bg-card border border-border px-3 py-1.5 rounded-md inline-block">
                    {projects.find((p) => p.id === defaultProjectId)?.name || 'Current Project'}
                  </div>
                ) : (
                  <CustomSelect
                    value={projectId}
                    onChange={setProjectId}
                    options={projectOptions}
                  />
                )}
              </div>

              {/* Assignee */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignee</div>
              <div>
                <CustomSelect
                  value={assigneeId}
                  onChange={setAssigneeId}
                  options={assigneeOptions}
                />
              </div>

              {/* Priority */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</div>
              <div>
                <CustomSelect
                  value={priority}
                  onChange={setPriority}
                  options={priorityOptions}
                />
              </div>

              {/* Status */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Initial Status</div>
              <div>
                <CustomSelect
                  value={status}
                  onChange={setStatus}
                  options={statusOptions}
                />
              </div>

              {/* Due Date */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</div>
              <div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground"
                />
              </div>

              {/* Tags */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</div>
              <div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag and press Enter"
                  className="h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground w-full max-w-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Description & Instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide task details, acceptance criteria, or relevant context..."
                rows={3}
                className="w-full text-sm bg-muted/10 text-foreground border border-border rounded-lg p-3 outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Subtasks Builder */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Subtasks ({subtasks.length})</span>
              </label>
              <div className="space-y-1.5">
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-1.5 text-xs"
                  >
                    <span className="text-foreground">{st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add a subtask..."
                    className="h-8 flex-1 px-3 text-xs rounded-md border border-border bg-background text-foreground"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={handleAddSubtask}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Attachments Upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Attachments (DOC, PDF, Images, HTML)
              </label>
              <div className="border border-dashed border-border rounded-lg p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Click to select files to attach to this task
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Stored securely in Cloudinary
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.svg,.html,.htm,.txt"
                  />
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-1 mt-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate text-foreground font-medium">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-muted-foreground hover:text-destructive ml-2 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-card">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" isLoading={submitting}>
              Assign Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
