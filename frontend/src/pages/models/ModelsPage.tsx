import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { modelApi, providerApi } from '@/services/api'
import type { Model, Provider, CreateModelRequest, UpdateModelRequest } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { Plus, Trash2, X, Pencil } from 'lucide-react'

const brandColors: Record<string, string> = {
  '千问': 'bg-blue-500/20 text-blue-300',
  '智谱': 'bg-purple-500/20 text-purple-300',
  'Kimi': 'bg-amber-500/20 text-amber-300',
  'MiniMax': 'bg-green-500/20 text-green-300',
  'Anthropic': 'bg-orange-500/20 text-orange-300',
  'OpenAI': 'bg-emerald-500/20 text-emerald-300',
  'Google': 'bg-red-500/20 text-red-300',
}

const capColors: Record<string, string> = {
  '文本生成': 'bg-slate-500/20 text-slate-300',
  '深度思考': 'bg-indigo-500/20 text-indigo-300',
  '视觉理解': 'bg-cyan-500/20 text-cyan-300',
  '代码生成': 'bg-green-500/20 text-green-300',
  '图像生成': 'bg-pink-500/20 text-pink-300',
}

const defaultCapabilities = ['文本生成', '深度思考', '视觉理解', '代码生成', '图像生成']

// ===== 添加/编辑模型弹窗 =====
function ModelFormModal({ model, providers, onClose }: { model?: Model; providers: Provider[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = !!model

  const { register, handleSubmit } = useForm<CreateModelRequest & UpdateModelRequest>({
    defaultValues: model ? {
      provider_id: model.provider_id,
      model_id: model.model_id,
      display_name: model.display_name,
      brand: model.brand,
      capabilities: model.capabilities,
      max_context_tokens: model.max_context_tokens,
      max_output_tokens: model.max_output_tokens,
      input_price_per_million: model.input_price_per_million,
      output_price_per_million: model.output_price_per_million,
      is_available: model.is_available,
    } : {
      capabilities: [],
      max_context_tokens: 128000,
      max_output_tokens: 4096,
      input_price_per_million: 0,
      output_price_per_million: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CreateModelRequest & UpdateModelRequest) => {
      if (isEdit) {
        return modelApi.update(model!.id, data)
      }
      return modelApi.create(data as CreateModelRequest)
    },
    onSuccess: () => {
      toast.success(isEdit ? '模型更新成功' : '模型添加成功')
      queryClient.invalidateQueries({ queryKey: ['models'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{isEdit ? '编辑模型' : '添加模型'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">平台</label>
            <select {...register('provider_id', { required: true })} disabled={isEdit} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50">
              <option value="">选择平台</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">模型 ID</label>
            <input {...register('model_id', { required: true })} placeholder="如：qwen3.6-plus" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">显示名称</label>
            <input {...register('display_name', { required: true })} placeholder="如：Qwen3.6 Plus" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">品牌</label>
            <input {...register('brand')} placeholder="如：千问、智谱" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">能力（逗号分隔）</label>
            <div className="flex flex-wrap gap-2">
              {defaultCapabilities.map((cap) => (
                <label key={cap} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    value={cap}
                    defaultChecked={model?.capabilities?.includes(cap)}
                    className="h-3.5 w-3.5 accent-indigo-500"
                    {...register('capabilities')}
                  />
                  <span className="text-xs text-slate-300">{cap}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-slate-300">上下文 tokens</label>
              <input {...register('max_context_tokens', { valueAsNumber: true })} type="number" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-300">最大输出 tokens</label>
              <input {...register('max_output_tokens', { valueAsNumber: true })} type="number" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-300">输入价格/M</label>
              <input {...register('input_price_per_million', { valueAsNumber: true })} type="number" step="0.01" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-300">输出价格/M</label>
              <input {...register('output_price_per_million', { valueAsNumber: true })} type="number" step="0.01" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
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
export default function ModelsPage() {
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canWrite = hasPermission('models:write')
  const canDelete = hasPermission('models:delete')

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.list().then((r) => r.data || []),
  })
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providerApi.list().then((r) => r.data || []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => modelApi.delete(id),
    onSuccess: () => {
      toast.success('模型已删除')
      queryClient.invalidateQueries({ queryKey: ['models'] })
      setConfirmDeleteId(null)
    },
  })

  const filtered = filterProvider === 'all' ? models : models.filter((m) => m.provider_id === filterProvider)

  // 按品牌分组
  const grouped = filtered.reduce<Record<string, Model[]>>((acc, m) => {
    const brand = m.brand || '其他'
    if (!acc[brand]) acc[brand] = []
    acc[brand].push(m)
    return acc
  }, {})

  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]))

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">模型管理</h2>
        {canWrite && (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          <Plus size={16} /> 添加模型
        </button>
        )}
      </div>

      {/* 平台筛选 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterProvider('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filterProvider === 'all' ? 'bg-indigo-600 text-white' : 'border border-[var(--color-border)] text-slate-300 hover:bg-white/5'}`}
        >全部</button>
        {providers.map((p) => (
          <button key={p.id} onClick={() => setFilterProvider(p.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filterProvider === p.id ? 'bg-indigo-600 text-white' : 'border border-[var(--color-border)] text-slate-300 hover:bg-white/5'}`}
          >{p.name}</button>
        ))}
      </div>

      {/* 按品牌分组展示 */}
      {Object.entries(grouped).map(([brand, brandModels]) => (
        <div key={brand} className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${brandColors[brand] || 'bg-slate-500/20 text-slate-300'}`}>
              {brand}
            </span>
            <span className="text-xs text-slate-500">{brandModels.length} 个模型</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brandModels.map((model) => (
              <div key={model.id} className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{model.display_name}</h3>
                  <div className="flex items-center gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${model.is_available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {model.is_available ? '可用' : '不可用'}
                    </span>
                    {canWrite && (
                    <button onClick={() => setEditingModel(model)} className="rounded p-1 text-slate-500 opacity-0 hover:bg-white/5 hover:text-white group-hover:opacity-100" title="编辑">
                      <Pencil size={12} />
                    </button>
                    )}
                    {canDelete && (
                    confirmDeleteId === model.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteMutation.mutate(model.id)} className="rounded bg-red-600 px-1.5 py-0.5 text-xs text-white">确认</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-white">取消</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(model.id)} className="rounded p-1 text-slate-500 opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100" title="删除">
                        <Trash2 size={12} />
                      </button>
                    )
                    )}
                  </div>
                </div>
                <p className="mb-2 font-mono text-xs text-slate-500">{model.model_id}</p>

                {/* 能力标签 */}
                {model.capabilities && model.capabilities.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {model.capabilities.map((cap) => (
                      <span key={cap} className={`rounded px-1.5 py-0.5 text-xs ${capColors[cap] || 'bg-slate-500/20 text-slate-300'}`}>{cap}</span>
                    ))}
                  </div>
                )}

                <div className="mt-2 border-t border-[var(--color-border)] pt-2">
                  {model.description && (
                    <p className="mb-1.5 text-xs text-slate-400">{model.description}</p>
                  )}
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>上下文: {model.max_context_tokens?.toLocaleString() || 'N/A'}</span>
                    <span>输出: {model.max_output_tokens?.toLocaleString() || 'N/A'}</span>
                    <span>{providerMap[model.provider_id] || ''}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-blue-400">输入: ${model.input_price_per_million}/M</span>
                    <span className="text-amber-400">输出: ${model.output_price_per_million}/M</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">暂无模型数据</p>
      )}

      {showAdd && <ModelFormModal providers={providers} onClose={() => setShowAdd(false)} />}
      {editingModel && <ModelFormModal model={editingModel} providers={providers} onClose={() => setEditingModel(null)} />}
    </div>
  )
}
