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

// Shared types for courses / materials / requests
export type CourseStatus = 'PENDING_RESOURCES' | 'ACTIVE' | 'CLOSED'

export interface CourseResponse {
  id: string
  name: string
  description?: string
  professorId: string
  professorName: string
  maxStudents: number
  tokensPerStudent: number
  vpsPerStudent: number
  professorExtraTokens: number
  professorExtraVps: number
  status: CourseStatus
  createdAt: string
}

export interface CourseMaterialResponse {
  id: string
  courseId: string
  originalFilename: string
  contentType: string
  size: number
  createdAt: string
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FORWARDED_TO_ADMIN' | 'ADMIN_APPROVED' | 'ADMIN_REJECTED'
export type ResourceRequestType = 'TOKEN' | 'VPS'

export interface ResourceRequestResponse {
  id: string
  courseId: string
  courseName: string
  studentId: string
  studentName: string
  resourceType: ResourceRequestType
  amountRequested: number
  status: RequestStatus
  professorNote?: string | null
  createdAt: string
  updatedAt: string
}

// helper for multipart with session refresh
async function fetchWithRefresh(input: string, init?: RequestInit, skipRefresh = false): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${input}`, { ...init, credentials: 'include' })
  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return fetchWithRefresh(input, init, true)
    }
  }

  return response
}

export const professorApi = {
  createCourse: (payload: { name: string; description?: string; maxStudents: number; tokensPerStudent: number; vpsPerStudent: number }) =>
    apiRequest<CourseResponse>('/api/professor/courses', { method: 'POST', body: payload }),

  listCourses: () => apiRequest<CourseResponse[]>('/api/professor/courses'),

  getCourse: (courseId: string) => apiRequest<CourseResponse>(`/api/professor/courses/${encodeURIComponent(courseId)}`),

  uploadMaterial: async (courseId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)

    const res = await fetchWithRefresh(`/api/professor/courses/${encodeURIComponent(courseId)}/materials`, { method: 'POST', body: form })
    if (!res.ok) throw await parseError(res)
    return (await res.json()) as CourseMaterialResponse
  },

  listMaterials: (courseId: string) => apiRequest<CourseMaterialResponse[]>(`/api/professor/courses/${encodeURIComponent(courseId)}/materials`),

  getMaterialDownloadUrl: (courseId: string, materialId: string) => `${API_BASE_URL}/api/professor/courses/${encodeURIComponent(courseId)}/materials/${encodeURIComponent(materialId)}/download`,

  listResourceRequests: (courseId: string) => apiRequest<ResourceRequestResponse[]>(`/api/professor/courses/${encodeURIComponent(courseId)}/resource-requests`),

  deleteMaterial: (courseId: string, materialId: string) => apiRequest(`/api/professor/courses/${encodeURIComponent(courseId)}/materials/${encodeURIComponent(materialId)}`, { method: 'DELETE' }),

  approveResourceRequest: (requestId: string, note?: string) => apiRequest<ResourceRequestResponse>(`/api/professor/resource-requests/${encodeURIComponent(requestId)}/approve`, { method: 'PATCH', body: note ? { note } : undefined }),

  rejectResourceRequest: (requestId: string, note?: string) => apiRequest<ResourceRequestResponse>(`/api/professor/resource-requests/${encodeURIComponent(requestId)}/reject`, { method: 'PATCH', body: note ? { note } : undefined }),
}

// Admin course allocation + forwarded requests
export const adminCoursesApi = {
  listCourses: (status?: CourseStatus) => apiRequest<CourseResponse[]>((status ? `/api/admin/courses?status=${encodeURIComponent(status)}` : '/api/admin/courses')),

  allocateCourse: (courseId: string) => apiRequest<CourseResponse>(`/api/admin/courses/${encodeURIComponent(courseId)}/allocate`, { method: 'POST' }),

  listForwardedRequests: () => apiRequest<ResourceRequestResponse[]>('/api/admin/resource-requests/forwarded'),

  approveForwardedRequest: (requestId: string) => apiRequest<ResourceRequestResponse>(`/api/admin/resource-requests/${encodeURIComponent(requestId)}/approve`, { method: 'PATCH' }),

  rejectForwardedRequest: (requestId: string) => apiRequest<ResourceRequestResponse>(`/api/admin/resource-requests/${encodeURIComponent(requestId)}/reject`, { method: 'PATCH' }),
}
