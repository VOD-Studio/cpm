import { create } from 'zustand'
import type { User } from '@/types'
import { authApi } from '@/services/api'

interface AuthState {
  user: User | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    // 登录后获取用户权限
    let perms: string[] = []
    try {
      const meRes = await authApi.me()
      const userData = meRes.data as any
      set({ user: userData, permissions: userData?.permissions || [], isAuthenticated: true })
      return
    } catch {}
    set({ user: data.user, permissions: perms, isAuthenticated: true })
  },

  register: async (username, email, password) => {
    const { data } = await authApi.register({ username, email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ user: data.user, permissions: [], isAuthenticated: true })
  },

  logout: () => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, permissions: [], isAuthenticated: false })
    // 通知 React Query 清除缓存
    window.dispatchEvent(new Event('auth:logout'))
  },

  checkAuth: async () => {
    if (!localStorage.getItem('access_token')) {
      set({ isAuthenticated: false })
      return
    }
    try {
      set({ isLoading: true })
      const { data } = await authApi.me()
      const userData = data as any
      set({ user: userData, permissions: userData?.permissions || [], isAuthenticated: true })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, permissions: [], isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  hasPermission: (permission: string) => {
    const { permissions } = get()
    if (!permissions || permissions.length === 0) return false
    return permissions.includes('*') || permissions.includes(permission)
  },
}))
