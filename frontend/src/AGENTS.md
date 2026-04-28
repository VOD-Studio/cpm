<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# Frontend Source Code

## Purpose
React 19 单页应用的核心源代码目录。包含组件、页面、服务层、状态管理和类型定义，实现 Coding Plan Manager 的完整前端功能。

## Key Files
| File | Description |
|------|-------------|
| `main.tsx` | React 应用入口，创建 Root 并渲染 App |
| `App.tsx` | 路由配置、认证守卫、全局 Provider（QueryClient、BrowserRouter） |
| `index.css` | 全局样式，Tailwind CSS 导入，CSS 变量定义（颜色系统） |
| `vite-env.d.ts` | Vite 类型引用 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `components/` | 可复用 UI 组件，如布局组件 MainLayout |
| `pages/` | 页面级组件，按功能模块组织（auth、dashboard、keys 等） |
| `services/` | API 服务层，axios 封装与后端 REST API 通信 |
| `stores/` | Zustand 全局状态存储（认证状态、权限管理） |
| `types/` | TypeScript 类型定义，涵盖所有 API 请求/响应类型 |

## For AI Agents

### Directory Responsibilities

#### `components/`
- **MainLayout.tsx**: 应用主布局，包含侧边栏导航、移动端抽屉、权限过滤
- 未来扩展：可复用的 UI 组件（Button、Modal、Form 等）

#### `pages/`
按功能模块组织的页面组件：
| Page | Path | File |
|------|------|------|
| 登录 | `/login` | `auth/LoginPage.tsx` |
| 注册 | `/register` | `auth/RegisterPage.tsx` |
| 仪表盘 | `/dashboard` | `dashboard/DashboardPage.tsx` |
| API Key 管理 | `/keys` | `keys/KeysPage.tsx` |
| 模型浏览 | `/models` | `models/ModelsPage.tsx` |
| 平台管理 | `/providers` | `providers/ProvidersPage.tsx` |
| 用户管理 | `/users` | `users/UsersPage.tsx` |
| 角色管理 | `/roles` | `roles/RolesPage.tsx` |
| 设置 | `/settings` | `settings/SettingsPage.tsx` |
| 用量统计 | - | `usage/UsagePage.tsx` |

#### `services/api.ts`
集中式 API 服务层，导出多个 API 模块：
- `authApi`: 认证（登录、注册、刷新 Token、登出）
- `providerApi`: 平台管理
- `apiKeyApi`: API Key 管理、测试、解密、共享
- `modelApi`: 模型管理
- `usageApi`: 用量统计
- `dashboardApi`: 仪表盘汇总
- `glmUsageApi`: 智谱 GLM 用量查询
- `volcengineUsageApi`: 火山引擎用量查询
- `aliUsageApi`: 阿里云用量查询
- `userAdminApi`: 用户管理
- `roleApi`: 角色权限管理

#### `stores/auth.ts`
Zustand 认证状态存储：
- `user`: 当前用户信息
- `permissions`: 用户权限列表
- `isAuthenticated`: 认证状态
- `isLoading`: 加载状态
- 方法：`login`, `register`, `logout`, `checkAuth`, `hasPermission`

#### `types/index.ts`
TypeScript 类型定义，包含：
- 用户相关：`User`, `UserWithRoles`, `Role`
- 认证：`AuthTokens`, `LoginRequest`, `RegisterRequest`
- 平台：`Provider`, `CreateProviderRequest`, `UpdateProviderRequest`
- API Key：`ApiKey`, `BaseUrlEntry`, `CreateApiKeyRequest`, `UpdateApiKeyRequest`
- 模型：`Model`, `CreateModelRequest`, `UpdateModelRequest`
- 用量：`UsageRecord`, `UsageSummary`, `DashboardSummary`
- 平台用量：`GlmUsageRequest`, `VolcengineUsageRequest`, `AliUsageRequest`

### Development Guidelines

#### Import Conventions
```tsx
// 使用路径别名 @/
import { useAuthStore } from '@/stores/auth'
import { apiKeyApi } from '@/services/api'
import type { ApiKey } from '@/types'
import MainLayout from '@/components/layout/MainLayout'
```

#### Page Component Pattern
```tsx
export default function XxxPage() {
  // 1. 权限检查
  const hasPermission = useAuthStore((s) => s.hasPermission)

  // 2. 数据查询
  const { data, isLoading } = useQuery({
    queryKey: ['resource'],
    queryFn: () => api.list().then(r => r.data),
  })

  // 3. 变更操作
  const mutation = useMutation({
    mutationFn: (data) => api.create(data),
    onSuccess: () => {
      toast.success('操作成功')
      queryClient.invalidateQueries({ queryKey: ['resource'] })
    },
    onError: (err) => toast.error('操作失败'),
  })

  // 4. 渲染
  return (/* JSX */)
}
```

#### Styling Conventions
- 使用 Tailwind CSS 类名
- CSS 变量定义主题颜色：
  ```css
  --color-bg-primary: #0f172a
  --color-bg-secondary: #1e293b
  --color-border: #334155
  --color-text-primary: #f8fafc
  --color-text-secondary: #94a3b8
  --color-accent: #6366f1
  ```
- 支持 `var(--color-xxx)` 引用

#### API Call Pattern
```tsx
// 查询
const { data } = useQuery({
  queryKey: ['keys'],
  queryFn: () => apiKeyApi.list().then(r => r.data),
})

// 变更
const mutation = useMutation({
  mutationFn: (data) => apiKeyApi.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['keys'] }),
})
```

#### Permission Check Pattern
```tsx
const canWrite = useAuthStore((s) => s.hasPermission('keys:write'))
const isSuperAdmin = useAuthStore((s) => s.hasPermission('*'))

// 条件渲染
{canWrite && <button onClick={handleCreate}>创建</button>}
```

### Key Dependencies
| Package | Usage |
|---------|-------|
| `react` | UI 框架 |
| `react-router` | 路由管理 |
| `@tanstack/react-query` | 服务端状态管理 |
| `zustand` | 全局状态管理 |
| `axios` | HTTP 客户端 |
| `react-hook-form` | 表单管理 |
| `sonner` | Toast 通知 |
| `lucide-react` | 图标库 |
| `recharts` | 图表可视化 |
| `tailwindcss` | CSS 框架 |

### Common Tasks

#### Adding a New Page
1. 在 `pages/` 下创建目录和组件文件
2. 在 `App.tsx` 添加路由
3. 在 `MainLayout.tsx` 的 `allNavItems` 添加导航项（如需权限控制设置 `permission`）

#### Adding a New API Endpoint
1. 在 `types/index.ts` 添加请求/响应类型
2. 在 `services/api.ts` 添加 API 方法
3. 在页面中使用 `useQuery` 或 `useMutation`

#### Adding a New Store
1. 在 `stores/` 创建新的 Zustand store
2. 使用 `create` 函数定义状态和方法
3. 在组件中使用 `useXxxStore` hook

## Dependencies

### Internal
- `../AGENTS.md` — 父级文档，包含构建命令和完整架构说明

### External
- React 19
- TanStack Query v5
- Zustand v5
- Vite 6
