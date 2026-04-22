import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usageApi, glmUsageApi, volcengineUsageApi, aliUsageApi } from '@/services/api'
import type { UsageRecord, UsageSummary, GlmUsageResponse } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { ChevronDown, ChevronRight } from 'lucide-react'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

// ===== 通用折叠区块 =====
function CollapsibleSection({ title, icon, defaultOpen = false, children }: {
  title: string
  icon: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 p-4 text-left text-sm font-semibold text-slate-300 hover:text-white"
      >
        <span>{icon}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </button>
      {open && <div className="border-t border-[var(--color-border)] px-5 pb-5 pt-4">{children}</div>}
    </div>
  )
}

// ===== GLM 用量查询组件 =====
function GlmUsageQuery() {
  const [baseUrl, setBaseUrl] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [result, setResult] = useState<GlmUsageResponse | null>(null)

  const mutation = useMutation({
    mutationFn: () => glmUsageApi.query({ base_url: baseUrl, auth_token: authToken }),
    onSuccess: (res) => {
      const data = (res as any).data?.data ?? (res as any).data ?? res.data
      setResult(data)
      toast.success('查询成功')
    },
    onError: () => {
      toast.error('查询失败，请检查 URL 和 Token')
    },
  })

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="Base URL (如 https://open.bigmodel.cn/api/anthropic)"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        />
        <input
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
          type="password"
          placeholder="Auth Token"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !baseUrl || !authToken}
          className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {mutation.isPending ? '查询中...' : '查询'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {result.model_usage && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-slate-400">模型用量</h4>
              <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
                {typeof result.model_usage === 'string' ? result.model_usage : JSON.stringify(result.model_usage, null, 2)}
              </pre>
            </div>
          )}
          {result.tool_usage && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-slate-400">工具用量</h4>
              <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
                {typeof result.tool_usage === 'string' ? result.tool_usage : JSON.stringify(result.tool_usage, null, 2)}
              </pre>
            </div>
          )}
          {result.quota_limit && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-slate-400">配额限制</h4>
              <div className="space-y-2">
                {Array.isArray((result.quota_limit as any)?.limits) && ((result.quota_limit as any).limits as any[]).map((limit: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2">
                    <span className="text-xs text-slate-300">{limit.type}</span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.min((limit.percentage || 0) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{((limit.percentage || 0) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ===== 火山引擎用量查询组件 =====
function VolcengineUsageQuery() {
  const [ak, setAk] = useState('')
  const [sk, setSk] = useState('')
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () => volcengineUsageApi.query({ ak, sk }),
    onSuccess: (res) => {
      const data = (res as any).data?.data ?? (res as any).data ?? res.data
      setResult(data)
      toast.success('查询成功')
    },
    onError: () => {
      toast.error('查询失败，请检查 AK/SK')
    },
  })

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={ak}
          onChange={(e) => setAk(e.target.value)}
          placeholder="Access Key (AK)"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        />
        <input
          value={sk}
          onChange={(e) => setSk(e.target.value)}
          type="password"
          placeholder="Secret Key (SK)"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !ak || !sk}
          className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {mutation.isPending ? '查询中...' : '查询'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </>
  )
}

// ===== 阿里云用量查询组件 =====
function AliUsageQuery() {
  const [cookie, setCookie] = useState('')
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () => aliUsageApi.query({ cookie }),
    onSuccess: (res) => {
      const data = (res as any).data?.data ?? (res as any).data ?? res.data
      setResult(data)
      toast.success('查询成功')
    },
    onError: () => {
      toast.error('查询失败，请检查 Cookie')
    },
  })

  return (
    <>
      <div className="mb-2 rounded-lg bg-slate-800/50 p-2.5 text-xs text-slate-500">
        从浏览器 DevTools → Network → 任意 bailian 请求 → 复制 Cookie 请求头的值
      </div>
      <div className="mb-4 flex flex-col gap-3">
        <textarea
          value={cookie}
          onChange={(e) => setCookie(e.target.value)}
          placeholder='粘贴 Cookie（如: cookie_name=cookie_value; ...）'
          rows={3}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !cookie}
          className="self-end rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {mutation.isPending ? '查询中...' : '查询'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </>
  )
}

// ===== 主页面 =====
export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [byModel, setByModel] = useState<UsageRecord[]>([])
  const [_byProvider, setByProvider] = useState<UsageRecord[]>([])
  const [trends, setTrends] = useState<UsageRecord[]>([])
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    const end = new Date()
    const start = new Date()
    if (period === '7d') start.setDate(start.getDate() - 7)
    else if (period === '30d') start.setDate(start.getDate() - 30)
    else start.setDate(start.getDate() - 90)

    const params = { start: start.toISOString(), end: end.toISOString() }

    Promise.all([
      usageApi.summary(params),
      usageApi.byModel(params),
      usageApi.byProvider(params),
      usageApi.trends({ ...params, period: 'daily' }),
    ]).then(([sumRes, modelRes, provRes, trendRes]) => {
      setSummary(sumRes.data)
      setByModel(modelRes.data || [])
      setByProvider(provRes.data || [])
      setTrends(trendRes.data || [])
    })
  }, [period])

  const trendChartData = trends.map((t) => ({
    date: new Date(t.period_start).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    tokens: t.total_tokens,
    cost: Number(t.cost.toFixed(2)),
    requests: t.request_count,
  }))

  const pieData = byModel.map((r) => ({
    name: r.model?.display_name || r.model_id,
    value: r.total_tokens,
  }))

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">用量分析</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'border border-[var(--color-border)] text-slate-300 hover:bg-white/5'
              }`}
            >
              {p === '7d' ? '7 天' : p === '30d' ? '30 天' : '90 天'}
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-4 backdrop-blur-sm">
            <p className="text-xs text-slate-400">总请求数</p>
            <p className="mt-1 text-xl font-bold text-white">
              {summary.total_requests.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-4 backdrop-blur-sm">
            <p className="text-xs text-slate-400">总 Token</p>
            <p className="mt-1 text-xl font-bold text-white">
              {summary.total_tokens.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-4 backdrop-blur-sm">
            <p className="text-xs text-slate-400">总费用</p>
            <p className="mt-1 text-xl font-bold text-amber-400">
              ${summary.total_cost.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-4 backdrop-blur-sm">
            <p className="text-xs text-slate-400">平均响应时间</p>
            <p className="mt-1 text-xl font-bold text-white">
              {summary.avg_response_time_ms}ms
            </p>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
            />
            <Line type="monotone" dataKey="tokens" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - By Model */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">按模型 Token 用量</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byModel.map((r) => ({
              name: r.model?.display_name || r.model_id,
              tokens: r.total_tokens,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Bar dataKey="tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Distribution */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Token 分布</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">暂无数据</p>
          )}
        </div>
      </div>

      {/* 平台用量查询 */}
      <div className="mt-6 space-y-4">
        <CollapsibleSection title="GLM Coding Plan 用量查询" icon="🟢" defaultOpen={false}>
          <GlmUsageQuery />
        </CollapsibleSection>

        <CollapsibleSection title="火山引擎 Coding Plan 用量查询" icon="🌋" defaultOpen={false}>
          <VolcengineUsageQuery />
        </CollapsibleSection>

        <CollapsibleSection title="阿里云 Coding Plan 用量查询" icon="☁️" defaultOpen={false}>
          <AliUsageQuery />
        </CollapsibleSection>
      </div>
    </div>
  )
}
