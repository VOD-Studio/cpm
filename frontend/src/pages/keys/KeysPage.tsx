import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { apiKeyApi, providerApi, modelApi, glmUsageApi } from '@/services/api'
import type { ApiKey, Provider, Model, CreateApiKeyRequest, BaseUrlEntry, UpdateApiKeyRequest, GlmUsageResponse } from '@/types'
import { Plus, Trash2, TestTube, X, Copy, Eye, EyeOff, Check, Pencil, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

// ===== 复制按钮 =====
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('复制失败')
    }
  }
  return (
    <button onClick={handleCopy} className={`shrink-0 text-slate-500 hover:text-indigo-400 ${className || ''}`} title="复制">
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  )
}

// ===== 密钥显示/复制组件 =====
function KeyReveal({ keyId }: { keyId: string }) {
  const [revealed, setRevealed] = useState(false)
  const [plainKey, setPlainKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false)
      setPlainKey(null)
      return
    }
    setLoading(true)
    try {
      const res = await apiKeyApi.decrypt(keyId)
      const key = (res.data as any)?.key ?? res.data
      setPlainKey(key)
      setRevealed(true)
    } catch {
      toast.error('获取密钥失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded bg-slate-700/50 px-2 py-0.5 font-mono text-xs text-slate-300">
        {revealed && plainKey ? plainKey : 'sk-••••••••'}
      </span>
      <button onClick={handleReveal} disabled={loading} className="text-slate-500 hover:text-white disabled:opacity-50" title={revealed ? '隐藏' : '显示'}>
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      {revealed && plainKey && <CopyButton text={plainKey} />}
    </div>
  )
}

// ===== 格式化 token 数 =====
function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

// ===== Key 用量查询组件 =====
function KeyUsageQuery({ apiKey }: { apiKey: ApiKey }) {
  const [result, setResult] = useState<GlmUsageResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleQuery = async () => {
    if (loading) return
    if (result) { setResult(null); return }

    setLoading(true)
    try {
      const decRes = await apiKeyApi.decrypt(apiKey.id)
      const authToken = (decRes.data as any)?.key ?? decRes.data

      const rawUrls = apiKey.base_urls
      const urls: BaseUrlEntry[] = rawUrls
        ? (typeof rawUrls === 'string' ? JSON.parse(rawUrls as string) : rawUrls) as BaseUrlEntry[]
        : []
      const baseUrl = urls.length > 0 ? urls[0].url : ''
      if (!baseUrl) { toast.error('该 Key 没有配置 Base URL'); return }

      const res = await glmUsageApi.query({ base_url: baseUrl, auth_token: authToken })
      const data = (res as any).data?.data ?? (res as any).data ?? res.data
      setResult(data)
    } catch {
      toast.error('查询用量失败')
    } finally {
      setLoading(false)
    }
  }

  const mu = result?.model_usage as any
  const ql = result?.quota_limit as any

  // 模型汇总柱状图数据
  const modelBarData = mu?.modelSummaryList?.map((m: any) => ({
    name: m.modelName,
    tokens: m.totalTokens,
  })) || []

  // 小时趋势数据（只取有值的时段）
  const xTime: string[] = mu?.x_time || []
  const tokensUsage: number[] = mu?.tokensUsage || []
  const callCount: number[] = mu?.modelCallCount || []
  const trendData = xTime
    .map((t, i) => ({
      time: t.slice(5), // "04-22 12:00"
      tokens: tokensUsage[i] || 0,
      calls: callCount[i] || 0,
    }))
    .filter((d) => d.tokens > 0 || d.calls > 0)

  // MCP 用量明细
  const mcpLimit = ql?.limits?.find((l: any) => l.type === 'MCP usage (1 Month)')
  const tokenLimits = ql?.limits?.filter((l: any) => l.type === 'Token usage (5 Hour)' || l.type === 'Token usage (Weekly)') || []

  // MCP 中文名映射
  const mcpNames: Record<string, string> = {
    'search-prime': '联网搜索 MCP',
    'web-reader': '网页读取 MCP',
    'zread': '开源仓库 MCP',
  }

  // 格式化下次刷新时间
  const formatResetTime = (ms: number) => {
    if (!ms) return ''
    const d = new Date(ms)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  // 配额类型中文
  const quotaLabels: Record<string, string> = {
    'Token usage (5 Hour)': 'Token 配额（5 小时）',
    'Token usage (Weekly)': 'Token 配额（每周）',
    'MCP usage (1 Month)': 'MCP 使用量（每月）',
  }

  return (
    <div className="mt-3">
      <button onClick={handleQuery} disabled={loading} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
        <BarChart3 size={14} />
        {loading ? '查询中...' : result ? '收起用量' : '查询用量'}
      </button>
      {result && (
        <div className="mt-3 space-y-4 rounded-lg border border-[var(--color-border)] bg-slate-900/50 p-4">

          {/* 总览 */}
          {mu?.totalUsage && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <p className="text-xs text-slate-500">总 Token</p>
                <p className="text-sm font-bold text-white">{formatTokens(mu.totalUsage.totalTokensUsage)}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <p className="text-xs text-slate-500">总调用</p>
                <p className="text-sm font-bold text-white">{mu.totalUsage.totalModelCallCount?.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                <p className="text-xs text-slate-500">套餐</p>
                <p className="text-sm font-bold text-indigo-400">{ql?.level || '-'}</p>
              </div>
            </div>
          )}

          {/* 模型 Token 柱状图 */}
          {modelBarData.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-slate-400">模型 Token 用量</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={modelBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatTokens} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(v: number) => [v.toLocaleString(), 'Tokens']}
                  />
                  <Bar dataKey="tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 小时趋势折线图 */}
          {trendData.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-slate-400">Token 趋势</h4>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatTokens} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(v: number, name: string) => [name === 'tokens' ? v.toLocaleString() : v, name === 'tokens' ? 'Tokens' : '调用']}
                  />
                  <Area type="monotone" dataKey="tokens" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 配额限制 - Token */}
          {tokenLimits.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-slate-400">Token 配额</h4>
              <div className="space-y-2">
                {tokenLimits.map((limit: any, i: number) => (
                  <div key={i} className="rounded-lg bg-slate-800/50 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-slate-300">{quotaLabels[limit.type] || limit.type}</span>
                      <span className="text-xs text-slate-500">刷新: {formatResetTime(limit.nextResetTime)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                          <div
                            className={`h-full rounded-full ${(limit.percentage || 0) > 80 ? 'bg-red-500' : (limit.percentage || 0) > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(limit.percentage || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-mono text-slate-400">{limit.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MCP 使用量 */}
          {mcpLimit && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium text-slate-400">MCP 使用量（每月）</h4>
                <span className="text-xs text-slate-500">刷新: {formatResetTime(mcpLimit.nextResetTime)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2">
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className={`h-full rounded-full ${(mcpLimit.percentage || 0) > 80 ? 'bg-red-500' : (mcpLimit.percentage || 0) > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(mcpLimit.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-mono text-slate-400">
                    {mcpLimit.currentValue || 0} / {mcpLimit.usage || mcpLimit.number} ({mcpLimit.percentage}%)
                  </span>
                </div>
                {mcpLimit.usageDetails?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mcpLimit.usageDetails.map((d: any, i: number) => (
                      <span key={i} className="rounded bg-slate-700/50 px-2 py-1 text-xs text-slate-400">
                        {mcpNames[d.modelCode] || d.modelCode} · {d.usage} 次
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== 添加 Key 弹窗 =====
function AddKeyModal({ providers, onClose }: { providers: Provider[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [baseUrls, setBaseUrls] = useState<BaseUrlEntry[]>([])
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const { register, handleSubmit, watch } = useForm<CreateApiKeyRequest>()

  const selectedProviderId = watch('provider_id')

  // 加载选中平台的模型列表
  const { data: providerModels = [] } = useQuery({
    queryKey: ['provider-models', selectedProviderId],
    queryFn: () => modelApi.getByProvider(selectedProviderId!).then((r) => r.data || []),
    enabled: !!selectedProviderId,
  })

  const addBaseUrl = () => setBaseUrls([...baseUrls, { label: '', protocol: 'openai', url: '' }])
  const removeBaseUrl = (i: number) => setBaseUrls(baseUrls.filter((_, idx) => idx !== i))
  const updateBaseUrl = (i: number, field: keyof BaseUrlEntry, value: string) => {
    const updated = [...baseUrls]
    updated[i] = { ...updated[i], [field]: value }
    setBaseUrls(updated)
  }

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) next.delete(modelId)
      else next.add(modelId)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: (data: CreateApiKeyRequest) =>
      apiKeyApi.create({ ...data, base_urls: baseUrls, model_ids: Array.from(selectedModels) }),
    onSuccess: () => {
      toast.success('API Key 添加成功')
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      onClose()
    },
  })

  const selectedProvider = providers.find((p) => p.id === selectedProviderId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">添加 Coding Plan Key</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">平台</label>
            <select {...register('provider_id', { required: true })} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
              <option value="">选择平台</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">名称</label>
            <input {...register('name', { required: true })} placeholder="如：我的阿里云 Coding Plan" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">API Key</label>
            <input {...register('key', { required: true })} type="password" placeholder="sk-..." className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">套餐类型</label>
            <input {...register('plan_type')} placeholder="如：pro / max / team" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>

          {/* Base URL 列表 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm text-slate-300">Base URL（可多个协议）</label>
              <button type="button" onClick={addBaseUrl} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <Plus size={14} /> 添加 URL
              </button>
            </div>
            <div className="space-y-2">
              {baseUrls.map((bu, i) => (
                <div key={i} className="flex gap-2">
                  <select value={bu.protocol} onChange={(e) => updateBaseUrl(i, 'protocol', e.target.value)} className="w-28 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-2 text-xs text-white outline-none">
                    <option value="openai">OpenAI 兼容</option>
                    <option value="anthropic">Anthropic 兼容</option>
                    <option value="custom">自定义</option>
                  </select>
                  <input value={bu.label} onChange={(e) => updateBaseUrl(i, 'label', e.target.value)} placeholder="标签（可选）" className="w-28 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-2 text-xs text-white outline-none" />
                  <input value={bu.url} onChange={(e) => updateBaseUrl(i, 'url', e.target.value)} placeholder="https://..." className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-2 text-xs text-white outline-none" />
                  <button type="button" onClick={() => removeBaseUrl(i)} className="shrink-0 text-slate-500 hover:text-red-400"><X size={16} /></button>
                </div>
              ))}
              {baseUrls.length === 0 && (
                <p className="text-xs text-slate-500">点击上方按钮添加 Base URL，支持 OpenAI / Anthropic 等多种协议</p>
              )}
            </div>
          </div>

          {/* 模型选择 */}
          {selectedProviderId && providerModels.length > 0 && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">可用模型</label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3">
                {providerModels.map((m: Model) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selectedModels.has(m.id)}
                      onChange={() => toggleModel(m.id)}
                      className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-indigo-500 accent-indigo-500"
                    />
                    <span className="text-sm text-white">{m.display_name}</span>
                    {m.brand && <span className="text-xs text-slate-500">{m.brand}</span>}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">已选 {selectedModels.size} 个模型</p>
            </div>
          )}

          {/* 提示信息 */}
          {selectedProvider && (
            <div className="rounded-lg bg-indigo-500/10 p-3 text-xs text-indigo-300">
              已选择 <strong>{selectedProvider.name}</strong>，请填入该平台的 API Key 和对应的 Base URL
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">保存</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== 编辑 Key 弹窗 =====
function EditKeyModal({ editKey, onClose }: { editKey: ApiKey; onClose: () => void }) {
  const queryClient = useQueryClient()
  const rawUrls = editKey.base_urls
  const parsedUrls: BaseUrlEntry[] = rawUrls
    ? (typeof rawUrls === 'string' ? JSON.parse(rawUrls as string) : rawUrls) as BaseUrlEntry[]
    : []

  const [baseUrls, setBaseUrls] = useState<BaseUrlEntry[]>(parsedUrls)
  const existingModelIds = new Set((editKey.available_models || []).map((m) => m.id))
  const [selectedModels, setSelectedModels] = useState<Set<string>>(existingModelIds)
  const { register, handleSubmit } = useForm<UpdateApiKeyRequest>({
    defaultValues: {
      name: editKey.name,
      plan_type: editKey.plan_type,
    },
  })

  // 加载该平台下的模型列表
  const { data: providerModels = [] } = useQuery({
    queryKey: ['provider-models', editKey.provider_id],
    queryFn: () => modelApi.getByProvider(editKey.provider_id).then((r) => r.data || []),
    enabled: !!editKey.provider_id,
  })

  const addBaseUrl = () => setBaseUrls([...baseUrls, { label: '', protocol: 'openai', url: '' }])
  const removeBaseUrl = (i: number) => setBaseUrls(baseUrls.filter((_, idx) => idx !== i))
  const updateBaseUrl = (i: number, field: keyof BaseUrlEntry, value: string) => {
    const updated = [...baseUrls]
    updated[i] = { ...updated[i], [field]: value }
    setBaseUrls(updated)
  }

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) next.delete(modelId)
      else next.add(modelId)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: (data: UpdateApiKeyRequest) =>
      apiKeyApi.update(editKey.id, { ...data, base_urls: baseUrls as any, model_ids: Array.from(selectedModels) }),
    onSuccess: () => {
      toast.success('Key 更新成功')
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">编辑 Key</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">名称</label>
            <input {...register('name')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">新密钥（留空不修改）</label>
            <input {...register('key')} type="password" placeholder="留空则保持原密钥不变" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">套餐类型</label>
            <input {...register('plan_type')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>

          {/* Base URL 列表 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm text-slate-300">Base URL</label>
              <button type="button" onClick={addBaseUrl} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <Plus size={14} /> 添加 URL
              </button>
            </div>
            <div className="space-y-2">
              {baseUrls.map((bu, i) => (
                <div key={i} className="flex gap-2">
                  <select value={bu.protocol} onChange={(e) => updateBaseUrl(i, 'protocol', e.target.value)} className="w-28 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-2 text-xs text-white outline-none">
                    <option value="openai">OpenAI 兼容</option>
                    <option value="anthropic">Anthropic 兼容</option>
                    <option value="custom">自定义</option>
                  </select>
                  <input value={bu.label} onChange={(e) => updateBaseUrl(i, 'label', e.target.value)} placeholder="标签" className="w-28 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-2 text-xs text-white outline-none" />
                  <input value={bu.url} onChange={(e) => updateBaseUrl(i, 'url', e.target.value)} placeholder="https://..." className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-2 text-xs text-white outline-none" />
                  <button type="button" onClick={() => removeBaseUrl(i)} className="shrink-0 text-slate-500 hover:text-red-400"><X size={16} /></button>
                </div>
              ))}
              {baseUrls.length === 0 && (
                <button type="button" onClick={addBaseUrl} className="text-xs text-indigo-400 hover:text-indigo-300">+ 添加 Base URL</button>
              )}
            </div>
          </div>

          {/* 模型选择 */}
          {providerModels.length > 0 && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">可用模型</label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3">
                {providerModels.map((m: Model) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selectedModels.has(m.id)}
                      onChange={() => toggleModel(m.id)}
                      className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-indigo-500 accent-indigo-500"
                    />
                    <span className="text-sm text-white">{m.display_name}</span>
                    {m.brand && <span className="text-xs text-slate-500">{m.brand}</span>}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">已选 {selectedModels.size} 个模型</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">保存</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-slate-300 hover:bg-white/5">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== 主页面 =====
export default function KeysPage() {
  const [modal, setModal] = useState<'key' | null>(null)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: keys = [] } = useQuery({ queryKey: ['keys'], queryFn: () => apiKeyApi.list().then((r) => r.data || []) })
  const { data: providers = [] } = useQuery({ queryKey: ['providers'], queryFn: () => providerApi.list().then((r) => r.data || []) })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeyApi.delete(id),
    onSuccess: () => { toast.success('已删除'); queryClient.invalidateQueries({ queryKey: ['keys'] }) },
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => apiKeyApi.test(id),
    onMutate: (id) => setTestingId(id),
    onSuccess: () => toast.success('Key 有效'),
    onError: () => toast.error('Key 无效或连接失败'),
    onSettled: () => setTestingId(null),
  })

  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]))
  const protocolLabels: Record<string, string> = { openai: 'OpenAI 兼容', anthropic: 'Anthropic 兼容', custom: '自定义' }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">API Key 管理</h2>
        <div className="flex gap-2">
          <button onClick={() => setModal('key')} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            <Plus size={16} /> 添加 Key
          </button>
        </div>
      </div>

      {/* 平台列表 */}
      {providers.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {providers.map((p) => (
            <span key={p.id} className="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-300">{p.name}</span>
          ))}
        </div>
      )}

      {/* Key 列表 */}
      <div className="grid gap-4">
        {keys.map((key: ApiKey) => {
          const rawUrls = key.base_urls
          const urls: BaseUrlEntry[] = rawUrls
            ? (typeof rawUrls === 'string' ? JSON.parse(rawUrls as string) : rawUrls) as BaseUrlEntry[]
            : []
          const models: Model[] = key.available_models || []
          const isExpanded = expandedId === key.id
          return (
            <div key={key.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{key.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${key.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      {key.is_active ? '活跃' : '已禁用'}
                    </span>
                    {key.last_status && (
                      <span className={`text-xs ${key.last_status === 'valid' ? 'text-green-400' : key.last_status === 'invalid' ? 'text-red-400' : 'text-amber-400'}`}>{key.last_status}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {providerMap[key.provider_id] || key.provider_id} · {key.plan_type || '未指定套餐'}
                  </p>

                  {/* 密钥 */}
                  <div className="mt-2">
                    <KeyReveal keyId={key.id} />
                  </div>

                  {/* Base URLs */}
                  {urls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {urls.slice(0, isExpanded ? undefined : 2).map((bu, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-300">{protocolLabels[bu.protocol] || bu.protocol}</span>
                          <span className="truncate text-slate-400">{bu.url}</span>
                          <CopyButton text={bu.url} />
                        </div>
                      ))}
                      {!isExpanded && urls.length > 2 && (
                        <button onClick={() => setExpandedId(key.id)} className="text-xs text-indigo-400 hover:text-indigo-300">
                          展开 ({urls.length - 2} 更多)
                        </button>
                      )}
                    </div>
                  )}

                  {/* 关联模型 */}
                  {models.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-slate-500">可用模型</p>
                      <div className="flex flex-wrap gap-1.5">
                        {models.map((m) => (
                          <span key={m.id} className="group flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs">
                            <span className="text-slate-300">{m.display_name}</span>
                            <span className="font-mono text-slate-500">{m.model_id}</span>
                            <CopyButton text={m.model_id} />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GLM 用量查询 */}
                  <KeyUsageQuery apiKey={key} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingKey(key)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" title="编辑"><Pencil size={16} /></button>
                  <button onClick={() => testMutation.mutate(key.id)} disabled={testingId === key.id} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50" title="测试连通性"><TestTube size={16} /></button>
                  <button onClick={() => deleteMutation.mutate(key.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400" title="删除"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          )
        })}
        {keys.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500">暂无 API Key，点击上方按钮添加</p>
        )}
      </div>

      {modal === 'key' && <AddKeyModal providers={providers} onClose={() => setModal(null)} />}
      {editingKey && <EditKeyModal editKey={editingKey} onClose={() => setEditingKey(null)} />}
    </div>
  )
}
