<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# Frontend - React SPA

## Purpose
React 19 单页应用，提供 Coding Plan Manager 的 Web 管理界面。支持多平台 API Key 管理、模型浏览、用量统计可视化、用户权限管理等功能。

## Key Files
| File | Description |
|------|-------------|
| `package.json` | 依赖配置，包含 React 19、TanStack Query、Zustand、react-router 等 |
| `vite.config.ts` | Vite 构建配置，含 API 代理 (`/api` → `localhost:8080`) |
| `tsconfig.json` | TypeScript 配置，启用 strict 模式，路径别名 `@/*` |
| `index.html` | 入口 HTML |
| `src/main.tsx` | React 应用入口 |
| `src/App.tsx` | 路由配置、认证守卫、全局 Provider |
| `src/index.css` | 全局样式，Tailwind CSS 导入，CSS 变量定义 |
| `Dockerfile` | 多阶段构建，Nginx 生产部署 |
| `nginx.conf` | Nginx 配置，SPA 路由回退 |
| `eslint.config.js` | ESLint 配置 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/components/` | 可复用 UI 组件 (see `src/components/AGENTS.md`) |
| `src/pages/` | 页面级组件，按功能模块组织 (see `src/pages/AGENTS.md`) |
| `src/services/` | API 服务层，axios 封装与后端通信 |
| `src/stores/` | Zustand 全局状态存储 |
| `src/types/` | TypeScript 类型定义 |
| `public/` | 静态资源 |

## For AI Agents

### Development Commands
```bash
npm run dev       # 启动开发服务器 (port 5173)
npm run build     # TypeScript 编译 + Vite 构建
npm run lint      # ESLint 检查
npm run format    # Prettier 格式化
npm run preview   # 预览生产构建
```

### Architecture Patterns

#### State Management
- **全局状态**: Zustand (`src/stores/auth.ts`) 管理用户认证、权限
- **服务端状态**: TanStack Query 处理 API 数据缓存、失效、乐观更新
- **表单状态**: react-hook-form 管理表单验证与提交

#### API Layer
- `src/services/api.ts` 集中定义所有 API 调用
- Axios 拦截器自动注入 Bearer Token
- 自动 Token 刷新 (401 → refresh → retry)
- 自动解包后端 `{data: ...}` 包装层

#### Routing
- react-router v7 BrowserRouter
- `ProtectedRoute` 组件实现认证守卫
- `MainLayout` 提供侧边栏导航 + 响应式抽屉

#### Styling
- Tailwind CSS v4 + 自定义 CSS 变量
- 暗色主题，CSS 变量定义颜色系统:
  - `--color-bg-primary/secondary`
  - `--color-border`
  - `--color-text-primary/secondary`
  - `--color-accent/success/warning/error`

### Common Patterns

#### Page Component Structure
```tsx
// 1. 查询数据
const { data } = useQuery({ queryKey: ['resource'], queryFn: ... })

// 2. 变更操作
const mutation = useMutation({
  mutationFn: (data) => api.create(data),
  onSuccess: () => {
    toast.success('成功')
    queryClient.invalidateQueries({ queryKey: ['resource'] })
  },
})

// 3. 权限检查
const canWrite = useAuthStore((s) => s.hasPermission('resource:write'))
```

#### Modal Pattern
- 使用 `useState` 控制 modal 状态
- Modal 组件接收 `onClose` 回调
- 成功后 invalidate queries 并关闭

#### API Types
- 所有类型定义在 `src/types/index.ts`
- 请求类型: `CreateXxxRequest`, `UpdateXxxRequest`
- 响应类型: `Xxx`, `XxxWithRelations`

### Testing Requirements
- 待添加测试框架 (推荐 Vitest + Testing Library)
- 测试文件应靠近被测组件: `Component.test.tsx`

### Permission System
- 后端返回 `permissions` 数组
- `hasPermission('*')` 表示超级管理员
- 页面组件检查权限后显示/隐藏操作按钮

### Key Dependencies
| Package | Purpose |
|---------|---------|
| `react` | UI 框架 |
| `react-router` | 路由 |
| `@tanstack/react-query` | 服务端状态管理 |
| `zustand` | 全局状态 |
| `axios` | HTTP 客户端 |
| `react-hook-form` | 表单管理 |
| `sonner` | Toast 通知 |
| `lucide-react` | 图标库 |
| `recharts` | 图表可视化 |
| `tailwindcss` | CSS 框架 |

## Dependencies

### Internal
- `../backend` — REST API 后端服务 (port 8080)

### External
- Node.js 20+
- Vite 6
- React 19

## Page Modules

| Page | Path | Description |
|------|------|-------------|
| `LoginPage` | `/login` | 登录表单 |
| `RegisterPage` | `/register` | 注册表单 |
| `DashboardPage` | `/dashboard` | 概览统计卡片 |
| `KeysPage` | `/keys` | API Key 管理、用量查询 |
| `ModelsPage` | `/models` | 模型浏览、价格信息 |
| `ProvidersPage` | `/providers` | 平台管理 |
| `UsersPage` | `/users` | 用户管理 (需 `users:read`) |
| `RolesPage` | `/roles` | 角色权限管理 (需 `roles:read`) |
| `SettingsPage` | `/settings` | 个人设置 |

## Build & Deploy

### Development
```bash
npm run dev  # Proxy /api → localhost:8080
```

### Production (Docker)
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
RUN npm ci && npm run build

# Stage 2: Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY dist /usr/share/nginx/html
```

### Environment
- 开发环境通过 Vite proxy 连接后端
- 生产环境 Nginx 反向代理 `/api` 到后端服务

<!-- MANUAL: -->
