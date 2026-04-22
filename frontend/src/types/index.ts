export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

// 平台提供商
export interface Provider {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  created_at: string
}

// API Key 的 Base URL（支持多种协议）
export interface BaseUrlEntry {
  label: string    // 如 "兼容 OpenAI 接口"、"兼容 Anthropic 接口"
  protocol: string // "openai" | "anthropic" | "custom"
  url: string
}

// API Key（管理各平台的 Coding Plan Key）
export interface ApiKey {
  id: string
  user_id: string
  provider_id: string
  provider?: Provider
  name: string
  base_urls: BaseUrlEntry[] | string  // 支持多个 Base URL（可能是 JSON 字符串）
  plan_type: string
  is_active: boolean
  last_tested_at: string | null
  last_status: 'valid' | 'invalid' | 'error' | null
  available_models?: Model[]  // 该 Key 可用的模型列表
  created_at: string
  updated_at: string
}

export interface CreateApiKeyRequest {
  provider_id: string
  name: string
  key: string
  base_urls: BaseUrlEntry[]
  plan_type?: string
  model_ids?: string[]  // 可选：关联的模型 ID 列表
}

export interface UpdateApiKeyRequest {
  name?: string
  key?: string
  base_urls?: BaseUrlEntry[]
  plan_type?: string
  is_active?: boolean
  model_ids?: string[]
}

// 模型
export interface Model {
  id: string
  provider_id: string
  provider?: Provider
  model_id: string
  display_name: string
  description: string
  brand: string            // 品牌：千问、智谱、Kimi、MiniMax 等
  capabilities: string[]   // 能力：文本生成、深度思考、视觉理解
  is_available: boolean
  max_context_tokens: number
  max_output_tokens: number
  input_price_per_million: number
  output_price_per_million: number
}

export interface UsageRecord {
  id: string
  api_key_id: string
  model_id: string
  model?: Model
  api_key?: ApiKey
  request_count: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost: number
  avg_response_time_ms: number
  error_count: number
  period_type: 'hourly' | 'daily' | 'monthly'
  period_start: string
  period_end: string
}

export interface UsageSummary {
  total_requests: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  total_cost: number
  avg_response_time_ms: number
  total_errors: number
  key_count: number
  active_key_count: number
}

export interface DashboardSummary {
  summary: UsageSummary
  recent_usage: UsageRecord[]
  usage_by_provider: { provider_id: string; provider_name: string; cost: number; tokens: number }[]
  usage_by_model: { model_id: string; model_name: string; cost: number; tokens: number }[]
}

export interface ApiError {
  error: string
  message: string
}

// 创建平台请求
export interface CreateProviderRequest {
  name: string
  slug: string
  description: string
}

// 更新平台请求
export interface UpdateProviderRequest {
  name?: string
  slug?: string
  description?: string
}

// 创建模型请求
export interface CreateModelRequest {
  provider_id: string
  model_id: string
  display_name: string
  brand: string
  capabilities: string[]
  max_context_tokens?: number
  max_output_tokens?: number
  input_price_per_million?: number
  output_price_per_million?: number
}

// 更新模型请求
export interface UpdateModelRequest {
  provider_id?: string
  model_id?: string
  display_name?: string
  brand?: string
  capabilities?: string[]
  max_context_tokens?: number
  max_output_tokens?: number
  input_price_per_million?: number
  output_price_per_million?: number
  is_available?: boolean
}

// GLM 用量查询请求
export interface GlmUsageRequest {
  base_url: string
  auth_token: string
}

// GLM 用量查询响应
export interface GlmUsageResponse {
  model_usage: any
  tool_usage: any
  quota_limit: any
}

// 火山引擎用量查询请求
export interface VolcengineUsageRequest {
  ak: string
  sk: string
}

// 阿里云用量查询请求
export interface AliUsageRequest {
  cookie: string
}
