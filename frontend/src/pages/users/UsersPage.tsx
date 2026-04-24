import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { userAdminApi, roleApi } from '@/services/api'
import type { UserWithRoles, Role } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { Trash2, X, Pencil, Users, ShieldCheck, ShieldOff, Plus, Lock } from 'lucide-react'

// 判断是否是受保护的 admin 用户
function isProtectedAdmin(u: UserWithRoles) {
  return u.role === 'admin' && u.email === 'xunrua@gmail.com'
}

// ===== 创建用户弹窗 =====
function CreateUserModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(() => {
    // 默认选中普通用户角色
    const userRole = roles.find((r) => r.name === 'user')
    return userRole ? [userRole.id] : []
  })

  const { register, handleSubmit } = useForm({
    defaultValues: { username: '', email: '', password: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: { username: string; email: string; password: string }) =>
      userAdminApi.create(data),
    onSuccess: (_data, variables) => {
      // 如果选了角色，分配角色
      if (selectedRoleIds.length > 0) {
        // 先获取用户列表找到新用户 ID
        userAdminApi.list().then((res) => {
          const newUser = res.data?.find((u) => u.email === variables.email)
          if (newUser) {
            userAdminApi.assignRoles(newUser.id, selectedRoleIds).then(() => {
              queryClient.invalidateQueries({ queryKey: ['users'] })
            })
          }
        })
      }
      toast.success('用户创建成功')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '创建失败')
    },
  })

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">添加用户</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">用户名</label>
            <input {...register('username', { required: true })} placeholder="用户名" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">邮箱</label>
            <input {...register('email', { required: true })} type="email" placeholder="user@example.com" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">密码</label>
            <input {...register('password', { required: true, minLength: 8 })} type="password" placeholder="至少 8 位" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">角色</label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-white">{role.display_name}</span>
                  {role.is_system && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">系统</span>
                  )}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              创建
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== 编辑用户弹窗 =====
function EditUserModal({ user, roles, onClose }: { user: UserWithRoles; roles: Role[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const protected_ = isProtectedAdmin(user)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(user.roles.map((r) => r.id))

  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: user.username,
      email: user.email,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { username: string; email: string }) =>
      userAdminApi.update(user.id, data),
    onSuccess: () => {
      toast.success('用户信息更新成功')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const assignRolesMutation = useMutation({
    mutationFn: (roleIds: string[]) =>
      userAdminApi.assignRoles(user.id, roleIds),
    onSuccess: () => {
      toast.success('角色分配成功')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '角色分配失败')
    },
  })

  const onSubmit = (data: { username: string; email: string }) => {
    if (!protected_) {
      updateMutation.mutate(data)
      assignRolesMutation.mutate(selectedRoleIds)
    }
  }

  const toggleRole = (roleId: string) => {
    if (protected_) return
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">编辑用户</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        {protected_ && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <Lock size={14} />
            默认管理员不可修改
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">用户名</label>
            <input {...register('username', { required: true })} disabled={protected_} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">邮箱</label>
            <input {...register('email', { required: true })} disabled={protected_} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">角色分配</label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label key={role.id} className={`flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm ${protected_ ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    disabled={protected_}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-white">{role.display_name}</span>
                  {role.is_system && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">系统</span>
                  )}
                </label>
              ))}
            </div>
          </div>
          {!protected_ && (
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={updateMutation.isPending || assignRolesMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                保存
              </button>
              <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">取消</button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ===== 主页面 =====
export default function UsersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canWrite = hasPermission('users:write')
  const canDelete = hasPermission('users:delete')

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAdminApi.list().then((r) => r.data || []),
  })
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.list().then((r) => r.data || []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userAdminApi.delete(id),
    onSuccess: () => {
      toast.success('用户已删除')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDeleteId(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '删除失败')
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userAdminApi.setActive(id, isActive),
    onSuccess: () => {
      toast.success('状态已更新')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || '操作失败')
    },
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">用户管理</h2>
        <div className="flex items-center gap-4">
          {canWrite && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            <Plus size={16} /> 添加用户
          </button>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users size={16} />
            <span>{users.length} 个用户</span>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">用户名</th>
              <th className="px-4 py-3 font-medium text-slate-400">邮箱</th>
              <th className="px-4 py-3 font-medium text-slate-400">角色</th>
              <th className="px-4 py-3 font-medium text-slate-400">状态</th>
              <th className="px-4 py-3 font-medium text-slate-400">创建时间</th>
              <th className="px-4 py-3 font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {users.map((u) => {
              const protected_ = isProtectedAdmin(u)
              return (
                <tr key={u.id} className={`hover:bg-white/[0.02] ${protected_ ? 'bg-amber-500/[0.03]' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{u.username}</span>
                      {protected_ && <span title="受保护的管理员"><Lock size={12} className="text-amber-400" /></span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r.id} className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300">
                          {r.display_name}
                        </span>
                      ))}
                      {u.roles.length === 0 && (
                        <span className="text-xs text-slate-500">无角色</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${u.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {u.is_active ? '活跃' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canWrite && (
                        <button
                          onClick={() => setEditingUser(u)}
                          className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                          title="编辑"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canWrite && !protected_ && (
                        <button
                          onClick={() => activeMutation.mutate({ id: u.id, isActive: !u.is_active })}
                          className={`rounded p-1.5 hover:bg-white/5 ${u.is_active ? 'text-slate-400 hover:text-amber-400' : 'text-green-400 hover:text-green-300'}`}
                          title={u.is_active ? '禁用' : '启用'}
                        >
                          {u.is_active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </button>
                      )}
                      {canDelete && !protected_ && (
                        confirmDeleteId === u.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteMutation.mutate(u.id)} className="rounded bg-red-600 px-1.5 py-0.5 text-xs text-white">确认</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-white">取消</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(u.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">暂无用户数据</p>
      )}

      {showAdd && <CreateUserModal roles={roles} onClose={() => setShowAdd(false)} />}
      {editingUser && (
        <EditUserModal user={editingUser} roles={roles} onClose={() => setEditingUser(null)} />
      )}
    </div>
  )
}
