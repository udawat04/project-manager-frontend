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
  assignProjectMember: (projectId: string, userId: string) =>
    apiRequest<{ membership: any }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  removeProjectMember: (projectId: string, userId: string) =>
    apiRequest<{ message: string }>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),
  getAllUsers: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<{ users: any[] }>(`/users${query}`);
  },
  createUser: (data: { name: string; email: string; password?: string; assignedProjectIds?: string[] }) =>
    apiRequest<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),


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

  // User detail
  getUserById: (id: string) =>
    apiRequest<{ user: any }>(`/users/${id}`),

  // Direct apiRequest access
  apiRequest,
};
