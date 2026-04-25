const API_BASE_URL = 'http://localhost:8080'

export type BackendRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT' | 'AUDIT'

export interface ApiErrorPayload {
  status: number
  error: string
  errorCode?: string
  timestamp?: string
  errors?: string[]
}

export class ApiError extends Error {
  status: number
  errorCode?: string
  errors: string[]

  constructor(payload: ApiErrorPayload) {
    super(payload.errors?.[0] ?? payload.error ?? 'Request failed')
    this.name = 'ApiError'
    this.status = payload.status
    this.errorCode = payload.errorCode
    this.errors = payload.errors ?? []
  }
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown
  headers?: Record<string, string>
  skipRefresh?: boolean
}

const isJsonResponse = (response: Response) => (response.headers.get('content-type') ?? '').includes('application/json')

async function parseError(response: Response): Promise<ApiError> {
  if (isJsonResponse(response)) {
    const payload = (await response.json()) as ApiErrorPayload
    return new ApiError(payload)
  }

  return new ApiError({
    status: response.status,
    error: response.statusText || 'Request failed',
    errors: ['A apărut o eroare neașteptată.'],
  })
}

async function refreshSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })

  return response.ok
}

export async function apiRequest<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, skipRefresh, ...init } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true })
    }
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  if (!isJsonResponse(response)) {
    return undefined as T
  }

  return (await response.json()) as T
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  role: BackendRole
}

export interface CurrentUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: BackendRole
}

export const authApi = {
  login: (payload: LoginRequest) => apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: payload, skipRefresh: true }),
  register: (payload: RegisterRequest) => apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: payload, skipRefresh: true }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest<CurrentUserResponse>('/api/auth/me'),
  forgotPassword: (email: string) => apiRequest('/api/auth/password/forgot', { method: 'POST', body: { email }, skipRefresh: true }),
  validateResetToken: (token: string) => apiRequest(`/api/auth/password/validate-token?token=${encodeURIComponent(token)}`, { method: 'GET', skipRefresh: true }),
  resetPassword: (token: string, newPassword: string) => apiRequest('/api/auth/password/reset', { method: 'POST', body: { token, newPassword }, skipRefresh: true }),
}

export type AdminManageableRole = 'PROFESSOR' | 'AUDIT'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: BackendRole
  isActive: boolean
}

export interface CreateAdminUserRequest {
  email: string
  firstName: string
  lastName: string
  role: AdminManageableRole
}

export interface UpdateAdminUserRoleRequest {
  role: AdminManageableRole
}

export interface ActivityType {
  id: string
  name: string
  tokensRequired: number
  isActive: boolean
}

export interface CreateActivityTypeRequest {
  name: string
  tokensRequired: number
}

export interface UpdateActivityTypeRequest {
  name: string
  tokensRequired: number
}

export type ResourcePoolType = 'TOKEN' | 'VPS'

export interface ResourcePool {
  id: string
  type: ResourcePoolType
  totalAmount: number
  allocatedAmount: number
  availableAmount: number
}

export interface SetResourcePoolRequest {
  type: ResourcePoolType
  totalAmount: number
}

export const adminApi = {
  createUser: (payload: CreateAdminUserRequest) => apiRequest<AdminUser>('/api/admin/users', { method: 'POST', body: payload }),
  listUsers: () => apiRequest<AdminUser[]>('/api/admin/users'),
  updateUserRole: (userId: string, payload: UpdateAdminUserRoleRequest) => apiRequest<AdminUser>(`/api/admin/users/${userId}/role`, { method: 'PATCH', body: payload }),
  deactivateUser: (userId: string) => apiRequest(`/api/admin/users/${userId}/deactivate`, { method: 'PATCH' }),
  reactivateUser: (userId: string) => apiRequest(`/api/admin/users/${userId}/reactivate`, { method: 'PATCH' }),

  createActivityType: (payload: CreateActivityTypeRequest) => apiRequest<ActivityType>('/api/admin/activity-types', { method: 'POST', body: payload }),
  listActivityTypes: () => apiRequest<ActivityType[]>('/api/admin/activity-types'),
  updateActivityType: (id: string, payload: UpdateActivityTypeRequest) => apiRequest<ActivityType>(`/api/admin/activity-types/${id}`, { method: 'PUT', body: payload }),
  deleteActivityType: (id: string) => apiRequest(`/api/admin/activity-types/${id}`, { method: 'DELETE' }),

  setResourcePool: (payload: SetResourcePoolRequest) => apiRequest<ResourcePool>('/api/admin/resources', { method: 'POST', body: payload }),
  addResourceTotal: (type: ResourcePoolType, amount: number) => apiRequest<ResourcePool>(`/api/admin/resources/${encodeURIComponent(type)}`, { method: 'PATCH', body: { amount } }),
  listResourcePools: () => apiRequest<ResourcePool[]>('/api/admin/resources'),
}
