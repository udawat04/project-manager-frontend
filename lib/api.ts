import * as XLSX from 'xlsx';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiClientError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('projectvault_token');
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('projectvault_token', token);
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('projectvault_token');
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('projectvault_refresh_token');
}

export function setStoredRefreshToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('projectvault_refresh_token', token);
}

export function removeStoredRefreshToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('projectvault_refresh_token');
}

// Single-flight refresh token lock
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = getStoredRefreshToken();
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
        credentials: 'include',
      });

      if (!res.ok) {
        removeStoredToken();
        removeStoredRefreshToken();
        return null;
      }

      const data = await res.json();
      const newAccessToken = data?.data?.accessToken;
      const newRefreshToken = data?.data?.refreshToken;
      if (newAccessToken) {
        setStoredToken(newAccessToken);
      }
      if (newRefreshToken) {
        setStoredRefreshToken(newRefreshToken);
      }
      return newAccessToken || null;
    } catch {
      removeStoredToken();
      removeStoredRefreshToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 Unauthorized with single-flight automatic token refresh
  if (response.status === 401 && !isRetry) {
    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/signup') ||
      endpoint.includes('/auth/refresh');

    if (!isAuthEndpoint) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry original request with fresh token
        const retryHeaders = new Headers(options.headers);
        if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
          retryHeaders.set('Content-Type', 'application/json');
        }
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return apiRequest<T>(endpoint, { ...options, headers: retryHeaders }, true);
      } else {
        // Session expired
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('projectvault_session_expired'));
        }
      }
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    const errorCode = data?.error?.code || 'REQUEST_FAILED';
    throw new ApiClientError(errorMsg, errorCode, data?.error?.details);
  }

  return data?.data as T;
}

// Typed API modules
export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    apiRequest<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signup: (data: { name: string; email: string; password: string }) =>
    apiRequest<{ user: any; accessToken: string; refreshToken: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),
  getMe: () =>
    apiRequest<{ user: any }>('/auth/me'),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendSecurityOtp: (purpose: 'PASSWORD_CHANGE' | 'PROFILE_UPDATE') =>
    apiRequest<{ message: string }>('/auth/send-security-otp', {
      method: 'POST',
      body: JSON.stringify({ purpose }),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string; otp: string }) =>
    apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (data: { name?: string; avatarUrl?: string | null; email?: string; otp?: string }) =>
    apiRequest<{ user: any; message: string }>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboardStats: () =>
    apiRequest<{
      stats: {
        totalProjects: number;
        productionProjects: number;
        totalMembers: number;
        totalPlatforms: number;
        totalAccounts: number;
        totalCredentials: number;
        totalVariables: number;
      };
      recentProjects: any[];
      recentActivities: any[];
    }>('/dashboard/stats'),
  getDashboardConfig: () =>
    apiRequest<{ config: any }>('/dashboard/config'),
  updateDashboardConfig: (config: any) =>
    apiRequest<{ config: any }>('/dashboard/config', {
      method: 'PATCH',
      body: JSON.stringify({ config }),
    }),

  // Projects
  getProjects: (params?: { type?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return apiRequest<{ projects: any[] }>(`/projects?${query.toString()}`);
  },
  getProject: (id: string) =>
    apiRequest<{ project: any }>(`/projects/${id}`),
  createProject: (data: any) =>
    apiRequest<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: any) =>
    apiRequest<{ project: any }>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    apiRequest<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // Members
  getProjectMembers: (projectId: string) =>
    apiRequest<{ members: any[] }>(`/projects/${projectId}/members`),
  assignProjectMember: (projectId: string, userIds: string | string[]) =>
    apiRequest<{ memberships?: any[]; membership?: any; message?: string }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(Array.isArray(userIds) ? { userIds } : { userId: userIds }),
    }),
  assignProjectMemberWithRole: (projectId: string, userId: string, role: string) =>
    apiRequest<{ memberships?: any[]; membership?: any; message?: string }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),
  updateProjectMemberRole: (projectId: string, userId: string, role: string) =>
    apiRequest<{ message: string }>(`/projects/${projectId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  removeProjectMember: (projectId: string, userId: string) =>
    apiRequest<{ message: string }>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),
  getAllUsers: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<{ users: any[] }>(`/users${query}`);
  },
  getUserById: (id: string) =>
    apiRequest<{ user: any }>(`/users/${id}`),
  createUser: (data: {
    name: string;
    email: string;
    role?: string;
    title?: string;
    phone?: string;
    avatarUrl?: string | null;
    assignedProjectIds?: string[];
    initialPassword?: string;
  }) =>
    apiRequest<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      title?: string;
      phone?: string;
      avatarUrl?: string | null;
      assignedProjectIds?: string[];
      isActive?: boolean;
    }
  ) =>
    apiRequest<{ user: any; message: string }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    apiRequest<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
  uploadMyAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiRequest<{ avatarUrl: string; user: any; message: string }>('/users/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  },
  uploadMemberAvatar: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiRequest<{ avatarUrl: string; user: any; message: string }>(`/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
    });
  },


  // Environments
  getEnvironments: (projectId: string) =>
    apiRequest<{ environments: any[] }>(`/projects/${projectId}/environments`),
  createEnvironment: (projectId: string, data: { name: string; type?: string }) =>
    apiRequest<{ environment: any }>(`/projects/${projectId}/environments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteEnvironment: (environmentId: string) =>
    apiRequest<{ message: string }>(`/environments/${environmentId}`, {
      method: 'DELETE',
    }),

  // Environment Variables
  getVariables: (environmentId: string, params?: { search?: string; sensitive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.sensitive !== undefined) query.set('sensitive', String(params.sensitive));
    return apiRequest<{ variables: any[] }>(`/environments/${environmentId}/variables?${query.toString()}`);
  },
  createVariable: (environmentId: string, data: { key: string; value: string; isSensitive?: boolean; description?: string }) =>
    apiRequest<{ variable: any }>(`/environments/${environmentId}/variables`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVariable: (id: string, data: any) =>
    apiRequest<{ variable: any }>(`/environment-variables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteVariable: (id: string) =>
    apiRequest<{ message: string }>(`/environment-variables/${id}`, {
      method: 'DELETE',
    }),
  revealVariable: (id: string) =>
    apiRequest<{ id: string; key: string; value: string }>(`/environment-variables/${id}/reveal`, {
      method: 'POST',
    }),
  revealAllVariables: (environmentId: string) =>
    apiRequest<{ variables: Array<{ id: string; key: string; value: string; isSensitive: boolean }> }>(
      `/environments/${environmentId}/reveal-all`,
      { method: 'POST' }
    ),
  logCopyAction: (id: string, mode: 'VALUE' | 'KEY_VALUE') =>
    apiRequest(`/environment-variables/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  previewImport: (environmentId: string, content: string) =>
    apiRequest<{
      totalDetected: number;
      conflictsCount: number;
      variables: Array<{
        key: string;
        isSensitive: boolean;
        hasConflict: boolean;
        valuePreview: string;
        fullValue: string;
      }>;
      parseErrors: string[];
    }>(`/environments/${environmentId}/preview-import`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  importVariables: (environmentId: string, variables: any[]) =>
    apiRequest<{ message: string; insertedCount: number; updatedCount: number; skippedCount: number }>(
      `/environments/${environmentId}/import`,
      {
        method: 'POST',
        body: JSON.stringify({ variables }),
      }
    ),
  exportVariables: (environmentId: string) =>
    apiRequest<{ content: string; filename: string; variableCount: number }>(
      `/environments/${environmentId}/export`,
      { method: 'POST' }
    ),

  // Platforms & Accounts
  getPlatforms: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return apiRequest<{ platforms: any[] }>(`/platforms?${query.toString()}`);
  },
  getPlatform: (id: string) =>
    apiRequest<{ platform: any }>(`/platforms/${id}`),
  getPlatformAccounts: (params?: { platformId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.platformId) query.set('platformId', params.platformId);
    if (params?.search) query.set('search', params.search);
    return apiRequest<{ accounts: any[] }>(`/platform-accounts?${query.toString()}`);
  },
  createPlatformAccount: (data: { platformId: string; name: string; loginIdentifier: string; accountUrl?: string; notes?: string }) =>
    apiRequest<{ account: any }>('/platform-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePlatformAccount: (id: string) =>
    apiRequest<{ message: string }>(`/platform-accounts/${id}`, {
      method: 'DELETE',
    }),

  // Project Platforms
  getProjectPlatforms: (projectId: string) =>
    apiRequest<{ platforms: any[] }>(`/projects/${projectId}/platforms`),
  connectProjectPlatform: (projectId: string, data: { platformAccountId: string; resourceName?: string; resourceUrl?: string; notes?: string }) =>
    apiRequest<{ connection: any }>(`/projects/${projectId}/platforms`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  disconnectProjectPlatform: (id: string) =>
    apiRequest<{ message: string }>(`/project-platforms/${id}`, {
      method: 'DELETE',
    }),

  // Credentials
  getCredentials: (params?: { projectId?: string; platformAccountId?: string; type?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.platformAccountId) query.set('platformAccountId', params.platformAccountId);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    return apiRequest<{ credentials: any[] }>(`/credentials?${query.toString()}`);
  },
  getCredential: (id: string) =>
    apiRequest<{ credential: any }>(`/credentials/${id}`),
  createCredential: (data: any) =>
    apiRequest<{ credential: any }>('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCredential: (id: string) =>
    apiRequest<{ message: string }>(`/credentials/${id}`, {
      method: 'DELETE',
    }),
  revealCredential: (id: string) =>
    apiRequest<{ id: string; name: string; type: string; fields: any[] }>(`/credentials/${id}/reveal`, {
      method: 'POST',
    }),
  logCredentialCopy: (id: string, fieldName: string) =>
    apiRequest(`/credentials/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify({ fieldName }),
    }),
  getCredentialAccess: (id: string) =>
    apiRequest<{ accesses: any[] }>(`/credentials/${id}/access`),
  grantCredentialAccess: (id: string, data: { userIds: string[]; level: 'VIEW' | 'EDIT' }) =>
    apiRequest<{ accesses: any[] }>(`/credentials/${id}/access`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  revokeCredentialAccess: (id: string, userId: string) =>
    apiRequest<{ message: string }>(`/credentials/${id}/access/${userId}`, {
      method: 'DELETE',
    }),



  // Global Search
  search: (q: string) =>
    apiRequest<{
      projects: any[];
      platforms: any[];
      platformAccounts: any[];
      credentials: any[];
      members: any[];
      variables: any[];
    }>(`/search?q=${encodeURIComponent(q)}`),

  // Audit Logs
  getAuditLogs: (params?: { projectId?: string; action?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.action) query.set('action', params.action);
    if (params?.limit) query.set('limit', String(params.limit));
    return apiRequest<{ logs: any[] }>(`/audit?${query.toString()}`);
  },

  // Platform updates
  updatePlatform: (id: string, data: any) =>
    apiRequest<{ platform: any }>(`/platforms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updatePlatformAccount: (id: string, data: any) =>
    apiRequest<{ account: any }>(`/platform-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Tasks
  getProjectTasks: (projectId: string) =>
    apiRequest<{ tasks: any[] }>(`/projects/${projectId}/tasks`),
  getAllTasks: (params?: { projectId?: string; assigneeId?: string; status?: string; priority?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.set('projectId', params.projectId);
    if (params?.assigneeId) searchParams.set('assigneeId', params.assigneeId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return apiRequest<{ tasks: any[] }>(`/tasks${qs ? `?${qs}` : ''}`);
  },
  getTask: (id: string) =>
    apiRequest<{ task: any }>(`/tasks/${id}`),
  createTask: (
    projectIdOrData: string | {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      assigneeId?: string | null;
      projectId?: string | null;
      tags?: string[];
      parentId?: string | null;
      subtasks?: any[];
      attachments?: any[];
    },
    maybeData?: any
  ) => {
    let body: any;
    let url = '/tasks';
    if (typeof projectIdOrData === 'string' && maybeData) {
      body = { ...maybeData };
      if (projectIdOrData && projectIdOrData !== 'all' && projectIdOrData !== 'none') {
        body.projectId = projectIdOrData;
        url = `/projects/${projectIdOrData}/tasks`;
      }
    } else {
      body = projectIdOrData;
      if (body.projectId && body.projectId !== 'all' && body.projectId !== 'none') {
        url = `/projects/${body.projectId}/tasks`;
      }
    }
    return apiRequest<{ task: any }>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateTask: (id: string, data: {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    projectId?: string | null;
    tags?: string[];
    attachments?: any[];
    parentId?: string | null;
  }) =>
    apiRequest<{ task: any }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    apiRequest<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
  addSubtask: (taskId: string, data: { title: string; assigneeId?: string; priority?: string; dueDate?: string }) =>
    apiRequest<{ subtask: any }>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadTaskAttachment: async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{ attachment: any; task: any }>(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
    });
  },
  deleteTaskAttachment: (taskId: string, publicId: string) =>
    apiRequest<{ task: any }>(`/tasks/${taskId}/attachments/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    }),
  importTasks: (tasks: any[]) =>
    apiRequest<{ totalReceived: number; importedCount: number; errors: any[] }>('/tasks/import', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }),
  exportTasksJson: async (projectId?: string) => {
    const token = getStoredToken();
    const url =
      projectId && projectId !== 'all'
        ? `${API_BASE_URL}/tasks/export?projectId=${encodeURIComponent(projectId)}&format=json`
        : `${API_BASE_URL}/tasks/export?format=json`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (!res.ok) {
      let errMsg = 'Failed to export tasks';
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) errMsg = errJson.error.message;
        else if (errJson?.message) errMsg = errJson.message;
      } catch {}
      throw new Error(errMsg);
    }
    const data = await res.json();
    const tasks = data?.data?.tasks || [];
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = projectId && projectId !== 'all' ? `project-tasks-${projectId}.json` : 'tasks-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  exportTasksExcel: async (projectId?: string) => {
    const token = getStoredToken();
    const url =
      projectId && projectId !== 'all'
        ? `${API_BASE_URL}/tasks/export?projectId=${encodeURIComponent(projectId)}&format=json`
        : `${API_BASE_URL}/tasks/export?format=json`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (!res.ok) {
      let errMsg = 'Failed to export tasks';
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) errMsg = errJson.error.message;
        else if (errJson?.message) errMsg = errJson.message;
      } catch {}
      throw new Error(errMsg);
    }
    const data = await res.json();
    const tasks = data?.data?.tasks || [];

    const rows = tasks.map((t: any) => ({
      'Task ID': t.id,
      'Title': t.title,
      'Description': t.description || '',
      'Status': t.status,
      'Priority': t.priority,
      'Project': t.project?.name || 'Standalone / No Project',
      'Assignee Name': t.assignee?.name || 'Unassigned',
      'Assignee Email': t.assignee?.email || '',
      'Due Date': t.dueDate ? String(t.dueDate).split('T')[0] : '',
      'Subtasks Count': t.subTasks?.length || 0,
      'Tags': (t.tags || []).join(', '),
      'Created At': t.createdAt ? String(t.createdAt).split('T')[0] : '',
      'Completed At': t.completedAt ? String(t.completedAt).split('T')[0] : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    const filename = projectId && projectId !== 'all' ? `project-tasks-${projectId}.xlsx` : 'tasks-export.xlsx';
    XLSX.writeFile(workbook, filename);
  },

  exportTasksCsv: async (projectId?: string) => {
    // Fallback forwarding to Excel
    return api.exportTasksExcel(projectId);
  },

  // Task Comments
  getTaskComments: (taskId: string) =>
    apiRequest<{ comments: any[] }>(`/tasks/${taskId}/comments`),
  addTaskComment: (taskId: string, content: string) =>
    apiRequest<{ comment: any }>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateTaskComment: (taskId: string, commentId: string, content: string) =>
    apiRequest<{ comment: any }>(`/tasks/${taskId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  deleteTaskComment: (taskId: string, commentId: string) =>
    apiRequest<{ message: string }>(`/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // Access Control (Environments)
  getEnvironmentAccessList: (envId: string) =>
    apiRequest<{ accessList: any[] }>(`/environments/${envId}/access`),
  grantEnvironmentAccess: (envId: string, data: { userId: string; level: string; expiresAt?: string }) =>
    apiRequest<{ access: any }>(`/environments/${envId}/access`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  revokeEnvironmentAccess: (envId: string, userId: string) =>
    apiRequest<{ message: string }>(`/environments/${envId}/access/${userId}`, {
      method: 'DELETE',
    }),
  checkEnvironmentAccess: (envId: string) =>
    apiRequest<{ hasAccess: boolean; access: any }>(`/environments/${envId}/check-access`),

  // Access Requests
  getAccessRequests: () =>
    apiRequest<{ requests: any[] }>(`/access-requests`),
  createAccessRequest: (data: { resourceType: string; resourceId: string; reason: string }) =>
    apiRequest<{ request: any }>(`/access-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveAccessRequest: (id: string, data?: { level?: string; expiresAt?: string }) =>
    apiRequest<{ request: any }>(`/access-requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(data || {}),
    }),
  rejectAccessRequest: (id: string) =>
    apiRequest<{ request: any }>(`/access-requests/${id}/reject`, {
      method: 'PATCH',
    }),

  // Gmail
  getGmailAuthUrl: () =>
    apiRequest<{ url: string }>('/gmail/auth-url'),
  getGmailAccountStatus: () =>
    apiRequest<{ account: any }>('/gmail/account'),
  disconnectGmail: () =>
    apiRequest<{ message: string }>('/gmail/disconnect', { method: 'DELETE' }),


  // Users
  getUsers: (search?: string) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    return apiRequest<{ users: any[] }>(`/users?${query.toString()}`);
  },
  syncGmail: () =>
    apiRequest<{ message: string; count: number }>('/gmail/sync', { method: 'POST' }),
  getGmailEmails: () =>
    apiRequest<{ emails: any[] }>('/gmail/emails'),
  getGmailEmailById: (id: string) =>
    apiRequest<{ email: any }>(`/gmail/emails/${id}`),
  deleteEmail: (id: string) =>
    apiRequest<{ message: string }>(`/gmail/emails/${id}`, { method: 'DELETE' }),
  replyToEmail: (id: string, data: { body: string }) =>
    apiRequest<{ message: string }>(`/gmail/emails/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Conversations
  getConversations: () =>
    apiRequest<{ conversations: any[] }>('/conversations'),
  getConversation: (id: string) =>
    apiRequest<{ conversation: any }>(`/conversations/${id}`),
  createConversation: (data: { type: string; name?: string; participantIds: string[]; projectId?: string }) =>
    apiRequest<{ conversation: any }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Messages
  getMessages: (conversationId: string) =>
    apiRequest<{ messages: any[] }>(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, data: { content: string; attachments?: any[] }) =>
    apiRequest<{ message: any }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: () =>
    apiRequest<{ notifications: any[] }>('/notifications'),
  getUnreadNotificationCount: () =>
    apiRequest<{ count: number }>('/notifications/unread-count'),
  markNotificationAsRead: (id: string) =>
    apiRequest<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsAsRead: () =>
    apiRequest<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id: string) =>
    apiRequest<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
  clearAllNotifications: () =>
    apiRequest<{ message: string }>('/notifications', { method: 'DELETE' }),
  updateNotificationPreferences: (data: any) =>
    apiRequest<{ message: string }>('/users/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Direct apiRequest access
  apiRequest,
};
