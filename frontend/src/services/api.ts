import axios from 'axios'
import { toast } from 'sonner'
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  Provider,
  ApiKey,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  Model,
  UsageRecord,
  UsageSummary,
  DashboardSummary,
  CreateProviderRequest,
  UpdateProviderRequest,
  CreateModelRequest,
  UpdateModelRequest,
  GlmUsageRequest,
  GlmUsageResponse,
  VolcengineUsageRequest,
  AliUsageRequest,
} from '@/types'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 自动解包后端 response.JSON 返回的 {data: ...} 包装层
api.interceptors.response.use((res) => {
  if (res.data && typeof res.data === 'object' && 'data' in res.data && Object.keys(res.data).length <= 3) {
    res.data = res.data.data
  }
  return res
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isSilent401 = status === 401 && (url.includes('/auth/me') || url.includes('/auth/refresh'))

    if (status === 401 && !url.includes('/auth/refresh')) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post<AuthTokens>('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          error.config.headers.Authorization = `Bearer ${data.access_token}`
          return axios(error.config)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          if (!isSilent401) {
            toast.error('登录已过期，请重新登录')
            window.location.href = '/login'
          }
        }
      }
    }
    if (!isSilent401) {
      const msg = error.response?.data?.message || error.response?.data?.error || '请求失败'
      toast.error(msg)
    }
    return Promise.reject(error)
  },
)

// ===== Auth =====
export const authApi = {
  login: (data: LoginRequest) => api.post<AuthTokens & { user: User }>('/auth/login', data),
  register: (data: RegisterRequest) =>
    api.post<AuthTokens & { user: User }>('/auth/register', data),
  refresh: (refresh_token: string) => api.post<AuthTokens>('/auth/refresh', { refresh_token }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
}

// ===== Providers =====
export const providerApi = {
  list: () => api.get<Provider[]>('/providers'),
  get: (id: string) => api.get<Provider>(`/providers/${id}`),
  create: (data: CreateProviderRequest) => api.post<Provider>('/providers', data),
  update: (id: string, data: UpdateProviderRequest) => api.put<Provider>(`/providers/${id}`, data),
  delete: (id: string) => api.delete(`/providers/${id}`),
}

// ===== API Keys =====
export const apiKeyApi = {
  list: () => api.get<ApiKey[]>('/keys'),
  create: (data: CreateApiKeyRequest) => api.post<ApiKey>('/keys', data),
  update: (id: string, data: UpdateApiKeyRequest) => api.put<ApiKey>(`/keys/${id}`, data),
  delete: (id: string) => api.delete(`/keys/${id}`),
  test: (id: string) => api.post<{ status: string }>(`/keys/${id}/test`),
  decrypt: (id: string) => api.get<{ key: string }>(`/keys/${id}/decrypt`),
}

// ===== Models =====
export const modelApi = {
  list: () => api.get<Model[]>('/models'),
  getByProvider: (providerId: string) => api.get<Model[]>(`/providers/${providerId}/models`),
  create: (data: CreateModelRequest) => api.post<Model>('/models', data),
  update: (id: string, data: UpdateModelRequest) => api.put<Model>(`/models/${id}`, data),
  delete: (id: string) => api.delete(`/models/${id}`),
}

// ===== Usage =====
export const usageApi = {
  summary: (params?: { start?: string; end?: string }) =>
    api.get<UsageSummary>('/usage', { params }),
  byKey: (params?: { start?: string; end?: string }) =>
    api.get<UsageRecord[]>('/usage/by-key', { params }),
  byModel: (params?: { start?: string; end?: string }) =>
    api.get<UsageRecord[]>('/usage/by-model', { params }),
  byProvider: (params?: { start?: string; end?: string }) =>
    api.get('/usage/by-provider', { params }),
  trends: (params?: { period?: string; start?: string; end?: string }) =>
    api.get<UsageRecord[]>('/usage/trends', { params }),
  record: (data: Partial<UsageRecord>) => api.post('/usage/record', data),
}

// ===== Dashboard =====
export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary'),
}

// ===== GLM Usage =====
export const glmUsageApi = {
  query: (data: GlmUsageRequest) => api.post<GlmUsageResponse>('/glm/usage', data),
}

// ===== Volcengine Usage =====
export const volcengineUsageApi = {
  query: (data: VolcengineUsageRequest) => api.post('/volcengine/usage', data),
}

// ===== Ali Usage =====
export const aliUsageApi = {
  query: (data: AliUsageRequest) => api.post('/ali/usage', data),
}

export default api
