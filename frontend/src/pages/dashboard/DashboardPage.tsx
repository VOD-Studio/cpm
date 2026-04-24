import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { apiKeyApi, providerApi, modelApi } from '@/services/api'
import type { ApiKey, Provider, Model } from '@/types'
import {
  Key,
  Cpu,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

// ===== 统计卡片 =====
function StatCard({ label, value, icon: Icon, iconBg, iconColor, onClick }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconBg: string
  iconColor: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 text-left backdrop-blur-sm transition-colors hover:border-indigo-500/30"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </button>
  )
}

// ===== 状态标签 =====
function StatusBadge({ status }: { status: string | null }) {
  if (status === 'valid') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <CheckCircle size={12} /> 有效
      </span>
    )
  }
  if (status === 'invalid') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-400">
        <XCircle size={12} /> 无效
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-400">
        <AlertCircle size={12} /> 错误
      </span>
    )
  }
  return <span className="text-xs text-slate-500">未测试</span>
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: keys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => apiKeyApi.list().then((r) => r.data || []),
  })
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providerApi.list().then((r) => r.data || []),
  })
  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.list().then((r) => r.data || []),
  })

  const activeKeys = keys.filter((k: ApiKey) => k.is_active)
  const validKeys = keys.filter((k: ApiKey) => k.last_status === 'valid')
  const invalidKeys = keys.filter((k: ApiKey) => k.last_status === 'invalid')

  // 按平台分组 Key
  const providerMap = Object.fromEntries(providers.map((p: Provider) => [p.id, p]))
  const keysByProvider = new Map<string, ApiKey[]>()
  for (const key of keys) {
    const list = keysByProvider.get(key.provider_id) || []
    list.push(key)
    keysByProvider.set(key.provider_id, list)
  }

  // 按平台分组模型
  const modelsByProvider = new Map<string, Model[]>()
  for (const model of models) {
    const list = modelsByProvider.get(model.provider_id) || []
    list.push(model)
    modelsByProvider.set(model.provider_id, list)
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="mb-6 text-xl font-bold text-white">仪表盘</h2>

      {/* 统计卡片 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="API Key 总数"
          value={keys.length}
          icon={Key}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-400"
          onClick={() => navigate('/keys')}
        />
        <StatCard
          label="活跃 Key"
          value={`${activeKeys.length} / ${keys.length}`}
          icon={CheckCircle}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          onClick={() => navigate('/keys')}
        />
        <StatCard
          label="平台"
          value={providers.length}
          icon={Server}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          onClick={() => navigate('/providers')}
        />
        <StatCard
          label="可用模型"
          value={models.filter((m: Model) => m.is_available).length}
          icon={Cpu}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          onClick={() => navigate('/models')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 平台概览 */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">平台概览</h3>
            <button
              onClick={() => navigate('/providers')}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {providers.map((p: Provider) => {
              const pKeys = keysByProvider.get(p.id) || []
              const pModels = modelsByProvider.get(p.id) || []
              const activeCount = pKeys.filter((k) => k.is_active).length
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.description || p.slug}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400">
                      {pModels.length} 模型
                    </span>
                    <span className={activeCount > 0 ? 'text-green-400' : 'text-slate-500'}>
                      {activeCount}/{pKeys.length} Key
                    </span>
                  </div>
                </div>
              )
            })}
            {providers.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">暂无平台</p>
            )}
          </div>
        </div>

        {/* Key 状态一览 */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Key 状态一览</h3>
            <button
              onClick={() => navigate('/keys')}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              管理Key <ArrowRight size={12} />
            </button>
          </div>

          {/* 状态统计条 */}
          <div className="mb-4 flex gap-3">
            <div className="rounded-lg bg-green-500/10 px-3 py-2 text-xs">
              <span className="text-green-400">{validKeys.length}</span>
              <span className="ml-1 text-slate-500">有效</span>
            </div>
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs">
              <span className="text-red-400">{invalidKeys.length}</span>
              <span className="ml-1 text-slate-500">无效</span>
            </div>
            <div className="rounded-lg bg-slate-500/10 px-3 py-2 text-xs">
              <span className="text-slate-400">{keys.length - validKeys.length - invalidKeys.length}</span>
              <span className="ml-1 text-slate-500">未测试</span>
            </div>
          </div>

          {/* Key 列表 */}
          <div className="space-y-2">
            {keys.slice(0, 8).map((key: ApiKey) => {
              const provider = providerMap[key.provider_id]
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{key.name}</p>
                    <p className="text-xs text-slate-500">
                      {provider?.name || key.provider_id}
                      {key.plan_type ? ` · ${key.plan_type}` : ''}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-3">
                    {!key.is_active && (
                      <span className="rounded bg-slate-600/30 px-1.5 py-0.5 text-xs text-slate-500">已禁用</span>
                    )}
                    <StatusBadge status={key.last_status} />
                  </div>
                </div>
              )
            })}
            {keys.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">暂无 API Key</p>
            )}
            {keys.length > 8 && (
              <button
                onClick={() => navigate('/keys')}
                className="w-full rounded-lg py-2 text-xs text-indigo-400 hover:text-indigo-300"
              >
                还有 {keys.length - 8} 个 Key，点击查看全部
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 模型品牌分布 */}
      {models.length > 0 && (
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">模型品牌分布</h3>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const brandMap = new Map<string, number>()
              for (const m of models) {
                const brand = m.brand || '其他'
                brandMap.set(brand, (brandMap.get(brand) || 0) + 1)
              }
              return Array.from(brandMap.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([brand, count]) => (
                  <span
                    key={brand}
                    className="rounded-lg bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300"
                  >
                    {brand}
                    <span className="ml-1.5 text-xs text-slate-500">({count})</span>
                  </span>
                ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
