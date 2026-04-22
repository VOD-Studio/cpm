import { useEffect, useState } from 'react'
import { dashboardApi } from '@/services/api'
import type { DashboardSummary } from '@/types'
import { Key, Cpu, Coins, Activity } from 'lucide-react'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-lg bg-${color}-500/10 p-3`}>
          <Icon size={20} className={`text-${color}-400`} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    dashboardApi.summary().then(({ data }) => setData(data)).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  const s = data.summary
  const byProvider = data.usage_by_provider || []
  const byModel = data.usage_by_model || []

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-bold text-white">仪表盘</h2>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="API Key 总数" value={s.key_count} icon={Key} color="indigo" />
        <StatCard label="活跃 Key" value={s.active_key_count} icon={Activity} color="green" />
        <StatCard label="总 Token 消耗" value={s.total_tokens.toLocaleString()} icon={Cpu} color="blue" />
        <StatCard label="总费用" value={`$${s.total_cost.toFixed(2)}`} icon={Coins} color="amber" />
      </div>

      {/* Usage by Provider */}
      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">按平台用量</h3>
        {byProvider.length === 0 ? (
          <p className="text-sm text-slate-500">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {byProvider.map((item) => (
              <div key={item.provider_id} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{item.provider_name}</span>
                <div className="flex gap-6">
                  <span className="text-sm text-slate-400">
                    {item.tokens.toLocaleString()} tokens
                  </span>
                  <span className="text-sm text-amber-400">${item.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage by Model */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">按模型用量</h3>
        {byModel.length === 0 ? (
          <p className="text-sm text-slate-500">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {byModel.map((item) => (
              <div key={item.model_id} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{item.model_name}</span>
                <div className="flex gap-6">
                  <span className="text-sm text-slate-400">
                    {item.tokens.toLocaleString()} tokens
                  </span>
                  <span className="text-sm text-amber-400">${item.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
