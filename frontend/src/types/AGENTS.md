<!-- Parent: ../AGENTS.md -->

# Types Directory

TypeScript type definitions for the application.

## Structure

```
types/
└── index.ts    # All type exports
```

## Core Types

### User & Auth

```typescript
interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}

interface UserWithRoles {
  id: string
  username: string
  email: string
  role: string
  is_active: boolean
  roles: Role[]
  permissions: string[]
  created_at: string
  updated_at: string
}

interface Role {
  id: string
  name: string
  display_name: string
  description: string
  permissions: string[]
  is_system: boolean
  created_at: string
}

interface AuthTokens {
  access_token: string
  refresh_token: string
}
```

### Provider & API Key

```typescript
interface Provider {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  created_at: string
}

interface BaseUrlEntry {
  label: string       // e.g., "兼容 OpenAI 接口"
  protocol: string    // "openai" | "anthropic" | "custom"
  url: string
}

interface ApiKey {
  id: string
  user_id: string
  provider_id: string
  provider?: Provider
  name: string
  base_urls: BaseUrlEntry[] | string
  plan_type: string
  is_active: boolean
  last_tested_at: string | null
  last_status: 'valid' | 'invalid' | 'error' | null
  available_models?: Model[]
  shared_by?: string
  created_at: string
  updated_at: string
}
```

### Model

```typescript
interface Model {
  id: string
  provider_id: string
  provider?: Provider
  model_id: string
  display_name: string
  description: string
  brand: string              // 千问、智谱、Kimi、MiniMax etc.
  capabilities: string[]     // 文本生成、深度思考、视觉理解
  is_available: boolean
  max_context_tokens: number
  max_output_tokens: number
  input_price_per_million: number
  output_price_per_million: number
}
```

### Usage & Analytics

```typescript
interface UsageRecord {
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

interface UsageSummary {
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

interface DashboardSummary {
  summary: UsageSummary
  recent_usage: UsageRecord[]
  usage_by_provider: { provider_id, provider_name, cost, tokens }[]
  usage_by_model: { model_id, model_name, cost, tokens }[]
}
```

### Request Types

```typescript
interface LoginRequest { email: string; password: string }
interface RegisterRequest { username: string; email: string; password: string }
interface CreateApiKeyRequest { provider_id, name, key, base_urls, plan_type?, model_ids? }
interface UpdateApiKeyRequest { name?, key?, base_urls?, plan_type?, is_active?, model_ids? }
interface CreateProviderRequest { name, slug, description }
interface UpdateProviderRequest { name?, slug?, description? }
interface CreateModelRequest { provider_id, model_id, display_name, brand, capabilities, ... }
interface UpdateModelRequest { provider_id?, model_id?, display_name?, ... }
```

### Platform Usage Query

```typescript
interface GlmUsageRequest { base_url: string; auth_token: string }
interface GlmUsageResponse { model_usage: any; tool_usage: any; quota_limit: any }
interface VolcengineUsageRequest { ak: string; sk: string }
interface AliUsageRequest { cookie: string }
```

### Error

```typescript
interface ApiError {
  error: string
  message: string
}
```

## Usage

```typescript
import type { User, ApiKey, Model } from '@/types'

// In API responses
const { data } = await api.get<User>('/auth/me')

// In components
function KeyCard({ apiKey }: { apiKey: ApiKey }) { ... }
```
