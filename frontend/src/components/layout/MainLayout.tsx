import { Outlet, NavLink, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  Key,
  Cpu,
  Server,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { to: '/keys', label: 'API Key 管理', icon: Key },
  { to: '/models', label: '模型浏览', icon: Cpu },
  { to: '/providers', label: '平台管理', icon: Server },
  { to: '/usage', label: '用量分析', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex h-16 items-center justify-center border-b border-[var(--color-border)]">
          <h1 className="text-lg font-bold text-white">
            <span className="text-indigo-400">CPM</span> Manager
          </h1>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          <div className="mb-2 px-3 text-xs text-slate-500">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
