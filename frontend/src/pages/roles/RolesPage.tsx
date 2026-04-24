import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { roleApi } from '@/services/api'
import type { Role } from '@/types'
import { Plus, Trash2, X, Pencil, Shield, Check, LayoutDashboard, Key, Cpu, Server, Users, ShieldCheck, Settings, BarChart3 } from 'lucide-react'

// 按模块分组的权限定义
const PERMISSION_GROUPS = [
  {
    group: '仪表盘',
    icon: LayoutDashboard,
    color: 'blue',
    permissions: [
      { key: 'dashboard:read', label: '查看' },
    ],
  },
  {
    group: 'API Key',
    icon: Key,
    color: 'emerald',
    permissions: [
      { key: 'keys:read', label: '查看' },
      { key: 'keys:write', label: '创建/编辑' },
      { key: 'keys:delete', label: '删除' },
    ],
  },
  {
    group: '模型',
    icon: Cpu,
    color: 'violet',
    permissions: [
      { key: 'models:read', label: '查看' },
      { key: 'models:write', label: '创建/编辑' },
      { key: 'models:delete', label: '删除' },
    ],
  },
  {
    group: '平台',
    icon: Server,
    color: 'cyan',
    permissions: [
      { key: 'providers:read', label: '查看' },
      { key: 'providers:write', label: '创建/编辑' },
      { key: 'providers:delete', label: '删除' },
    ],
  },
  {
    group: '用户',
    icon: Users,
    color: 'amber',
    permissions: [
      { key: 'users:read', label: '查看' },
      { key: 'users:write', label: '编辑' },
      { key: 'users:delete', label: '删除' },
    ],
  },
  {
    group: '角色',
    icon: ShieldCheck,
    color: 'rose',
    permissions: [
      { key: 'roles:read', label: '查看' },
      { key: 'roles:write', label: '创建/编辑' },
      { key: 'roles:delete', label: '删除' },
    ],
  },
  {
    group: '设置',
    icon: Settings,
    color: 'slate',
    permissions: [
      { key: 'settings:read', label: '查看' },
    ],
  },
  {
    group: '用量',
    icon: BarChart3,
    color: 'teal',
    permissions: [
      { key: 'usage:read', label: '查看' },
    ],
  },
]

// 颜色映射
const colorMap: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30',    activeBg: 'bg-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', activeBg: 'bg-emerald-500/20' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/30',  activeBg: 'bg-violet-500/20' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    activeBg: 'bg-cyan-500/20' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',   activeBg: 'bg-amber-500/20' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/30',    activeBg: 'bg-rose-500/20' },
  slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/30',   activeBg: 'bg-slate-500/20' },
  teal:    { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/30',    activeBg: 'bg-teal-500/20' },
}

// 权限 key → 中文标签映射（用于角色卡片显示）
const permLabelMap: Record<string, string> = {}
PERMISSION_GROUPS.forEach((g) => {
  g.permissions.forEach((p) => {
    permLabelMap[p.key] = `${g.group} ${p.label}`
  })
})

// ===== 角色表单弹窗 =====
function RoleFormModal({ role, onClose }: { role?: Role; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = !!role
  const [selectedPerms, setSelectedPerms] = useState<string[]>(role?.permissions || [])

  const { register, handleSubmit } = useForm({
    defaultValues: role
      ? { display_name: role.display_name, description: role.description || '' }
      : { display_name: '', description: '' },
  })

  const { register: registerCreate, handleSubmit: handleSubmitCreate } = useForm({
    defaultValues: { name: '', display_name: '', description: '' },
  })

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const toggleGroup = (groupKey: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.group === groupKey)
    if (!group) return
    const groupPermKeys = group.permissions.map((p) => p.key)
    const allSelected = groupPermKeys.every((p) => selectedPerms.includes(p))
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((p) => !groupPermKeys.includes(p)))
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...groupPermKeys])])
    }
  }

  const selectAll = () => {
    const all = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
    setSelectedPerms(all)
  }

  const clearAll = () => setSelectedPerms([])

  const createMutation = useMutation({
    mutationFn: (data: { name: string; display_name: string; description: string }) =>
      roleApi.create({ ...data, permissions: selectedPerms }),
    onSuccess: () => {
      toast.success('角色创建成功')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { display_name: string; description: string }) =>
      roleApi.update(role!.id, { ...data, permissions: selectedPerms }),
    onSuccess: () => {
      toast.success('角色更新成功')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '更新失败')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{isEdit ? '编辑角色' : '创建角色'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {!isEdit ? (
          <form onSubmit={handleSubmitCreate((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">角色标识</label>
                <input {...registerCreate('name', { required: true })} placeholder="如：editor" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">显示名称</label>
                <input {...registerCreate('display_name', { required: true })} placeholder="如：编辑者" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">描述</label>
              <textarea {...registerCreate('description')} placeholder="角色描述" rows={2} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <PermSelector selectedPerms={selectedPerms} togglePerm={togglePerm} toggleGroup={toggleGroup} selectAll={selectAll} clearAll={clearAll} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">创建</button>
              <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">取消</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">角色标识</label>
                <input value={role.name} disabled className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-slate-500 outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">显示名称</label>
                <input {...register('display_name', { required: true })} disabled={role.is_system} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">描述</label>
              <textarea {...register('description')} rows={2} disabled={role.is_system} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50" />
            </div>
            <PermSelector selectedPerms={selectedPerms} togglePerm={togglePerm} toggleGroup={toggleGroup} selectAll={selectAll} clearAll={clearAll} disabled={role.is_system} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={updateMutation.isPending || role.is_system} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">保存</button>
              <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">取消</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ===== 权限选择器（分组卡片 + 开关） =====
function PermSelector({
  selectedPerms,
  togglePerm,
  toggleGroup,
  selectAll,
  clearAll,
  disabled = false,
}: {
  selectedPerms: string[]
  togglePerm: (key: string) => void
  toggleGroup: (group: string) => void
  selectAll: () => void
  clearAll: () => void
  disabled?: boolean
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm text-slate-300">权限配置</label>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} disabled={disabled} className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-30">全选</button>
          <span className="text-xs text-slate-600">|</span>
          <button type="button" onClick={clearAll} disabled={disabled} className="text-xs text-slate-400 hover:text-slate-300 disabled:opacity-30">清空</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {PERMISSION_GROUPS.map((pg) => {
          const colors = colorMap[pg.color]
          const Icon = pg.icon
          const groupPermKeys = pg.permissions.map((p) => p.key)
          const allSelected = groupPermKeys.every((p) => selectedPerms.includes(p))
          const someSelected = groupPermKeys.some((p) => selectedPerms.includes(p))
          return (
            <div
              key={pg.group}
              onClick={() => !disabled && toggleGroup(pg.group)}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                allSelected
                  ? `${colors.border} ${colors.activeBg}`
                  : someSelected
                    ? 'border-slate-600 bg-slate-800/50'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-slate-600'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {/* 模块头部 */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded ${colors.bg}`}>
                    <Icon size={12} className={colors.text} />
                  </div>
                  <span className="text-xs font-medium text-white">{pg.group}</span>
                </div>
                {allSelected && <Check size={14} className={colors.text} />}
              </div>
              {/* 权限开关 */}
              <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                {pg.permissions.map((perm) => (
                  <button
                    key={perm.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => togglePerm(perm.key)}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 text-left transition-colors ${
                      selectedPerms.includes(perm.key)
                        ? `${colors.activeBg}`
                        : 'hover:bg-white/5'
                    } ${disabled ? 'cursor-not-allowed' : ''}`}
                  >
                    <span className={`text-xs ${selectedPerms.includes(perm.key) ? colors.text : 'text-slate-500'}`}>
                      {perm.label}
                    </span>
                    {/* 开关 */}
                    <div className={`h-3.5 w-6 rounded-full transition-colors ${selectedPerms.includes(perm.key) ? colors.bg : 'bg-slate-700'}`}>
                      <div className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${selectedPerms.includes(perm.key) ? 'translate-x-2.5' : 'translate-x-0'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">已选 {selectedPerms.length} 项权限</p>
    </div>
  )
}

// ===== 主页面 =====
export default function RolesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.list().then((r) => r.data || []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roleApi.delete(id),
    onSuccess: () => {
      toast.success('角色已删除')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setConfirmDeleteId(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '删除失败')
      setConfirmDeleteId(null)
    },
  })

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">角色管理</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          <Plus size={16} /> 创建角色
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          // 按 group 聚合权限显示
          const groupedPerms: Record<string, string[]> = {}
          role.permissions.forEach((p) => {
            if (p === '*') return
            const pg = PERMISSION_GROUPS.find((g) => g.permissions.some((gp) => gp.key === p))
            const group = pg?.group || '其他'
            const label = pg?.permissions.find((gp) => gp.key === p)?.label || p
            if (!groupedPerms[group]) groupedPerms[group] = []
            groupedPerms[group].push(label)
          })

          return (
            <div key={role.id} className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                    <Shield size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{role.display_name}</h3>
                      {role.is_system && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">系统</span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-slate-500">{role.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingRole(role)}
                    disabled={role.is_system}
                    className="rounded p-1 text-slate-500 opacity-0 hover:bg-white/5 hover:text-white group-hover:opacity-100 disabled:opacity-0"
                    title="编辑"
                  >
                    <Pencil size={14} />
                  </button>
                  {confirmDeleteId === role.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => deleteMutation.mutate(role.id)} className="rounded bg-red-600 px-1.5 py-0.5 text-xs text-white">确认</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-white">取消</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(role.id)}
                      disabled={role.is_system}
                      className="rounded p-1 text-slate-500 opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-0"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              {role.description && (
                <p className="mb-3 text-xs text-slate-400">{role.description}</p>
              )}
              <div className="border-t border-[var(--color-border)] pt-3">
                {role.permissions.includes('*') ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">全部权限</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(groupedPerms).map(([group, labels]) => {
                      const pg = PERMISSION_GROUPS.find((g) => g.group === group)
                      const colors = pg ? colorMap[pg.color] : colorMap.slate
                      return (
                        <span key={group} className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-2 py-0.5 text-xs ${colors.text}`}>
                          {group}: {labels.join('/')}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {roles.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">暂无角色数据</p>
      )}

      {showAdd && <RoleFormModal onClose={() => setShowAdd(false)} />}
      {editingRole && <RoleFormModal role={editingRole} onClose={() => setEditingRole(null)} />}
    </div>
  )
}
