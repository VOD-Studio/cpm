import { useAuthStore } from '@/stores/auth'

export default function SettingsPage() {
  const { user } = useAuthStore()

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-bold text-white">设置</h2>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">账户信息</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">用户名</span>
              <span className="text-sm text-white">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">邮箱</span>
              <span className="text-sm text-white">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">角色</span>
              <span className="text-sm text-white">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">注册时间</span>
              <span className="text-sm text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">关于</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">版本</span>
              <span className="text-sm text-white">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">项目</span>
              <span className="text-sm text-indigo-400">Coding Plan Manager</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
