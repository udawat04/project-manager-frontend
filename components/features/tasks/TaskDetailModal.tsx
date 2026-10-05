'use client';

import * as React from 'react';
import {
  X,
  Calendar,
  Tag,
  User,
  MessageSquare,
  Trash2,
  Send,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckSquare,
  Paperclip,
  Upload,
  FileText,
  ExternalLink,
  Lock,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CustomSelect } from '@/components/ui/custom-select';
import { TaskData } from './TaskCard';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  projectMembers?: any[];
  onUpdate: () => void;
  onDelete: () => void;
}

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
  projectMembers = [],
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [priority, setPriority] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [assigneeId, setAssigneeId] = React.useState('');
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  // Full task data
  const [fullTask, setFullTask] = React.useState<any>(null);
  const [loadingFull, setLoadingFull] = React.useState(false);

  // Subtasks
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [creatingSubtask, setCreatingSubtask] = React.useState(false);

  // Attachments
  const [uploadingAttachment, setUploadingAttachment] = React.useState(false);

  // Comments
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [sendingComment, setSendingComment] = React.useState(false);

  // All team members
  const [allUsers, setAllUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (open) {
      api.getUsers().then((res) => setAllUsers(res.users || [])).catch(() => {});
    }
  }, [open]);

  React.useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setAssigneeId(task.assignee?.id || '');
      setTags(task.tags || []);
      fetchFullTask();
      fetchComments();
    }
  }, [task, open]);

  const isMasterAdmin = Boolean(user?.isMasterAdmin || user?.role === 'MASTER_ADMIN');
  const isCreator = task?.creator?.id === user?.id;
  const isAssignee = task?.assignee?.id === user?.id;

  const canEditAll = isMasterAdmin || isCreator;
  const canEditStatus = canEditAll || isAssignee;
  const canEditDueDate = isMasterAdmin; // Rule: Only Master Admin can set or change due date
  const canCheckSubtasks = canEditAll || isAssignee;

  const isCompleted = status === 'completed' || status === 'DONE';

  const fetchFullTask = async () => {
    if (!task) return;
    setLoadingFull(true);
    try {
      const res = await api.getTask(task.id);
      setFullTask(res.task);
      if (res.task) {
        setTitle(res.task.title);
        setDescription(res.task.description || '');
        setStatus(res.task.status);
        setPriority(res.task.priority);
        setDueDate(res.task.dueDate ? new Date(res.task.dueDate).toISOString().split('T')[0] : '');
        setAssigneeId(res.task.assigneeId || '');
        setTags(res.task.tags || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingFull(false);
    }
  };

  const fetchComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    try {
      const res = await api.getTaskComments(task.id);
      setComments(res.comments || []);
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSave = async (field: string, value: any) => {
    if (!task) return;

    // Rule: Completed tasks cannot be moved back
    if (field === 'status') {
      if (isCompleted && value !== 'completed' && value !== 'DONE') {
        toast.error('Completed tasks are locked and cannot be moved back to todo or review.');
        return;
      }
      if ((value === 'completed' || value === 'DONE') && !isCompleted && !isMasterAdmin) {
        toast.error('Only Master Admin has permission to mark tasks as completed.');
        return;
      }
    }

    // Rule: Members cannot set or change due dates
    if (field === 'dueDate' && !isMasterAdmin) {
      toast.error('Only Master Admin has permission to set or edit task due dates.');
      return;
    }

    try {
      await api.updateTask(task.id, { [field]: value });
      toast.success('Task updated');
      fetchFullTask();
      onUpdate();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
      fetchFullTask(); // revert on error
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await api.deleteTask(task.id);
      onDelete();
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent('tasks_updated'));
      toast.success('Task deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete task');
    }
  };

  const handleCreateSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;
    setCreatingSubtask(true);
    try {
      await api.addSubtask(task.id, {
        title: newSubtaskTitle.trim(),
      });
      setNewSubtaskTitle('');
      fetchFullTask();
      onUpdate();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
      toast.success('Subtask added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add subtask');
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleToggleSubtaskStatus = async (subtaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' || currentStatus === 'completed' ? 'todo' : 'DONE';
    try {
      await api.updateTask(subtaskId, { status: newStatus });
      fetchFullTask();
      onUpdate();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingAttachment(true);
    try {
      await api.uploadTaskAttachment(task.id, file);
      toast.success(`Attached "${file.name}" to task`);
      fetchFullTask();
      onUpdate();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (publicId: string) => {
    if (!task) return;
    if (!isMasterAdmin) {
      toast.error('Only Master Admin can delete task attachments.');
      return;
    }
    try {
      await api.deleteTaskAttachment(task.id, publicId);
      toast.success('Attachment deleted');
      fetchFullTask();
      onUpdate();
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete attachment');
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    setSendingComment(true);
    try {
      await api.addTaskComment(task.id, newComment.trim());
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    try {
      await api.deleteTaskComment(task.id, commentId);
      fetchComments();
      toast.success('Comment deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setTagInput('');
      handleSave('tags', newTags);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    handleSave('tags', newTags);
  };

  if (!open || !task) return null;

  const currentAttachments = fullTask?.attachments || task.attachments || [];

  const availableUsers = allUsers.length > 0 ? allUsers : projectMembers.map((m: any) => m.user || m);
  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...availableUsers.map((m: any) => ({
      value: m.id,
      label: `${m.name} (${m.role || 'Member'})`,
    })),
  ];

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    ...(isMasterAdmin || isCompleted ? [{ value: 'completed', label: 'Completed' }] : []),
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh]">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal */}
        <div className="relative z-50 w-full max-w-2xl max-h-[92vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/15">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-background">
                {task.project?.name || fullTask?.project?.name || 'Standalone Task'}
              </Badge>

              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Lock className="w-2.5 h-2.5" /> Completed (Fixed)
                </span>
              )}

              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded"
                >
                  #{tag}
                  {canEditAll && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5 ml-3">
              {canEditAll && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-background custom-scrollbar">
            {/* Title */}
            <div>
              <textarea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onBlur={() => {
                  if (title.trim() && title !== task.title) {
                    handleSave('title', title.trim());
                  }
                }}
                placeholder={canEditAll ? 'Task Title' : ''}
                rows={1}
                readOnly={!canEditAll}
                className="w-full text-2xl font-bold text-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/30 overflow-hidden min-h-[36px]"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-[130px_1fr] gap-y-3 gap-x-4 items-center bg-muted/15 p-3.5 rounded-xl border border-border/60">
              {/* Status */}
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" /> Status
              </div>
              <div>
                {isCompleted ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <Lock className="w-3 h-3" /> Completed (Fixed & Locked)
                  </div>
                ) : (
                  <div className="w-fit">
                    <CustomSelect
                      value={status}
                      onChange={(newVal) => {
                        setStatus(newVal);
                        handleSave('status', newVal);
                      }}
                      options={statusOptions}
                      disabled={!canEditStatus}
                    />
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Assignee
              </div>
              <div className="w-fit">
                <CustomSelect
                  value={assigneeId}
                  onChange={(newVal) => {
                    setAssigneeId(newVal);
                    handleSave('assigneeId', newVal || null);
                  }}
                  options={assigneeOptions}
                  disabled={!canEditAll}
                />
              </div>

              {/* Due Date */}
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Due Date
              </div>
              <div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleSave('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null);
                  }}
                  disabled={!canEditDueDate}
                  title={!canEditDueDate ? 'Only Master Admin can set due dates' : undefined}
                  className={cn(
                    'h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground',
                    !canEditDueDate && 'opacity-60 cursor-not-allowed bg-muted/40'
                  )}
                />
              </div>

              {/* Priority */}
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUp className="h-3.5 w-3.5" /> Priority
              </div>
              <div className="w-fit">
                <CustomSelect
                  value={priority}
                  onChange={(newVal) => {
                    setPriority(newVal);
                    handleSave('priority', newVal);
                  }}
                  options={priorityOptions}
                  disabled={!canEditAll}
                />
              </div>

              {/* Tags Input */}
              {canEditAll && (
                <>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Add Tag
                  </div>
                  <div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Type tag and press Enter..."
                      className="h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground w-48"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description !== (task.description || '')) {
                    handleSave('description', description);
                  }
                }}
                placeholder={canEditAll ? 'Add task details or notes...' : 'No description.'}
                rows={3}
                readOnly={!canEditAll}
                className="w-full text-sm bg-muted/10 text-foreground border border-border rounded-lg p-3 outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Subtasks Section */}
            <div className="pt-2 border-t border-border/50">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" /> Subtasks ({fullTask?.subTasks?.length || 0})
                </span>
              </label>

              <div className="space-y-1.5 mb-3">
                {loadingFull ? (
                  <div className="text-xs text-muted-foreground">Loading subtasks...</div>
                ) : !fullTask?.subTasks || fullTask.subTasks.length === 0 ? (
                  <div className="text-xs text-muted-foreground/60 italic">No subtasks yet.</div>
                ) : (
                  fullTask.subTasks.map((sub: any) => {
                    const isDone = sub.status === 'DONE' || sub.status === 'completed';
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleSubtaskStatus(sub.id, sub.status)}
                            disabled={!canCheckSubtasks}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                          />
                          <span
                            className={`text-xs ${
                              isDone ? 'line-through text-muted-foreground' : 'text-foreground font-medium'
                            }`}
                          >
                            {sub.title}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {sub.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>

              {canEditAll && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSubtask()}
                    placeholder="Add a subtask..."
                    className="h-8 text-xs flex-1 px-3 rounded-md border border-border bg-background text-foreground"
                    disabled={creatingSubtask}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateSubtask}
                    disabled={creatingSubtask || !newSubtaskTitle.trim()}
                    className="h-8 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="pt-2 border-t border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" /> Attachments ({currentAttachments.length})
                </label>
                <div>
                  <label className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingAttachment ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      onChange={handleUploadAttachment}
                      disabled={uploadingAttachment}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.svg,.html,.htm,.txt"
                    />
                  </label>
                </div>
              </div>

              {currentAttachments.length === 0 ? (
                <div className="text-xs text-muted-foreground/60 italic p-3 border border-dashed border-border rounded-lg text-center">
                  No attachments yet. Attach DOC, PDF, images, or HTML files.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentAttachments.map((att: any, idx: number) => (
                    <div
                      key={att.publicId || idx}
                      className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors text-xs"
                    >
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-foreground font-medium hover:text-primary truncate flex-1"
                      >
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{att.filename || 'Attachment'}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      </a>

                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {att.size && (
                          <span className="text-[10px] text-muted-foreground">
                            {(att.size / 1024).toFixed(0)} KB
                          </span>
                        )}

                        {/* Only Master Admin can delete attachment */}
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.publicId || att.url)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete attachment (Master Admin only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="pt-2 border-t border-border/50">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Comments ({comments.length})
              </label>

              <div className="space-y-3 max-h-56 overflow-y-auto mb-3 custom-scrollbar">
                {loadingComments && (
                  <div className="text-xs text-muted-foreground text-center py-3">Loading comments...</div>
                )}
                {!loadingComments && comments.length === 0 && (
                  <div className="text-xs text-muted-foreground/60 text-center py-4 border border-dashed border-border rounded-lg">
                    No comments yet
                  </div>
                )}
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-2.5 group">
                    <UserAvatar
                      name={comment.author?.name}
                      avatarUrl={comment.author?.avatarUrl}
                      size="xs"
                    />
                    <div className="flex-1 min-w-0 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {comment.author?.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {(comment.authorId === user?.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete your comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Write a comment..."
                  className="h-8 flex-1 px-3 text-xs rounded-md border border-border bg-background text-foreground"
                  disabled={sendingComment}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={sendingComment || !newComment.trim()}
                  className="h-8 text-xs gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      />
    </>
  );
}
