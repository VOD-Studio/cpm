import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { providerApi, modelApi } from '@/services/api'
import type { Provider, CreateProviderRequest } from '@/types'
import { Plus, Trash2, X, Pencil, Server } from 'lucide-react'

// ===== 添加/编辑平台弹窗 =====
function ProviderFormModal({ provider, onClose }: { provider?: Provider; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = !!provider

  const { register, handleSubmit } = useForm<CreateProviderRequest>({
    defaultValues: provider ? {
      name: provider.name,
      slug: provider.slug,
      description: provider.description,
    } : {},
  })

  const mutation = useMutation({
    mutationFn: (data: CreateProviderRequest) => {
      if (isEdit) {
        return providerApi.update(provider!.id, data)
      }
      return providerApi.create(data)
    },
    onSuccess: () => {
      toast.success(isEdit ? '平台更新成功' : '平台添加成功')
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{isEdit ? '编辑平台' : '添加平台'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">平台名称</label>
            <input {...register('name', { required: true })} placeholder="如：智谱" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">标识（Slug）</label>
            <input {...register('slug', { required: true })} disabled={isEdit} placeholder="如：zhipu" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">描述</label>
            <textarea {...register('description')} placeholder="平台描述" rows={3} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {isEdit ? '保存' : '添加'}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== 主页面 =====
export default function ProvidersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providerApi.list().then((r) => r.data || []),
  })
  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.list().then((r) => r.data || []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => providerApi.delete(id),
    onSuccess: () => {
      toast.success('平台已删除')
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setConfirmDeleteId(null)
    },
    onError: () => {
      toast.error('删除失败，可能存在关联的模型或 API Key')
    },
  })

  // 计算每个平台的模型数量
  const modelCountMap = models.reduce<Record<string, number>>((acc, m) => {
    acc[m.provider_id] = (acc[m.provider_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">平台管理</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          <Plus size={16} /> 添加平台
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Server size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{provider.name}</h3>
                  <p className="font-mono text-xs text-slate-500">{provider.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditingProvider(provider)} className="rounded p-1 text-slate-500 opacity-0 hover:bg-white/5 hover:text-white group-hover:opacity-100" title="编辑">
                  <Pencil size={14} />
                </button>
                {confirmDeleteId === provider.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => deleteMutation.mutate(provider.id)} className="rounded bg-red-600 px-1.5 py-0.5 text-xs text-white">确认</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-white">取消</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(provider.id)} className="rounded p-1 text-slate-500 opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100" title="删除">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {provider.description && (
              <p className="mb-3 text-xs text-slate-400">{provider.description}</p>
            )}
            <div className="border-t border-[var(--color-border)] pt-3">
              <span className="text-xs text-slate-500">{modelCountMap[provider.id] || 0} 个模型</span>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">暂无平台数据</p>
      )}

      {showAdd && <ProviderFormModal onClose={() => setShowAdd(false)} />}
      {editingProvider && <ProviderFormModal provider={editingProvider} onClose={() => setEditingProvider(null)} />}
    </div>
  )
}
