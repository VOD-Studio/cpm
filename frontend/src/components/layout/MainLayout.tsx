import { useState, useMemo } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  Key,
  Cpu,
  Server,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Shield,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  permission?: string
}

const allNavItems: NavItem[] = [
  { to: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { to: '/keys', label: 'API Key 管理', icon: Key },
  { to: '/models', label: '模型浏览', icon: Cpu },
  { to: '/providers', label: '平台管理', icon: Server },
  { to: '/users', label: '用户管理', icon: Users, permission: 'users:read' },
  { to: '/roles', label: '角色管理', icon: Shield, permission: 'roles:read' },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function MainLayout() {
  const { user, logout, hasPermission } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems = useMemo(
    () => allNavItems.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission]
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 路由变化时关闭抽屉
  const handleNav = (to: string) => {
    navigate(to)
    setDrawerOpen(false)
  }

  const currentNav = navItems.find((n) => location.pathname.startsWith(n.to))

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {/* 桌面端侧边栏 */}
      <aside className="hidden flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] md:flex md:w-60">
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

      {/* 移动端遮罩 */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* 移动端抽屉侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-transform duration-200 md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
          <h1 className="text-lg font-bold text-white">
            <span className="text-indigo-400">CPM</span> Manager
          </h1>
          <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              onClick={() => handleNav(to)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                location.pathname.startsWith(to)
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
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

      {/* 右侧主区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 移动端顶栏 */}
        <header className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 md:hidden">
          <button onClick={() => setDrawerOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            {currentNav && <currentNav.icon size={18} className="text-indigo-400" />}
            <span className="text-sm font-medium text-white">{currentNav?.label || 'CPM Manager'}</span>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
