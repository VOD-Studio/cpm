# Coding Plan Manager

多平台 AI API Key 管理工具，用于统一管理 Anthropic、OpenAI、Google 等 AI 平台的 API Key 和 Endpoint，展示可用模型及全面用量统计。

## 功能

- **API Key 管理** — 添加、编辑、删除、测试连通性，支持自定义 Base URL
- **模型浏览** — 按平台查看可用模型、上下文窗口、Token 价格
- **用量统计** — 请求次数、Token 消耗、费用、响应时间、错误率，支持按模型/平台/时间段聚合
- **仪表盘** — 关键指标一览，趋势图表，费用分布
- **安全存储** — 第三方 API Key 使用 AES-256-GCM 加密存储

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19, TypeScript, Vite, TailwindCSS v4, Recharts, Zustand, Sonner |
| 后端 | Golang, net/http (Go 1.22+ 路由), PostgreSQL, JWT, bcrypt |
| 部署 | Docker Compose, Nginx, Alpine |

## 快速开始

### 环境要求

- Docker & Docker Compose
- Make（可选，使用 Makefile 命令）

### 一键部署

```bash
# 1. 克隆项目
git clone <repo-url>
cd coding-plan-manager

# 2. 创建环境配置（按需修改密码和密钥）
cp .env.example .env

# 3. 一键构建并启动
make up
```

启动完成后访问：

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| 后端 API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

首次启动后端会自动执行数据库迁移并插入初始数据（3 个平台、8 个模型）。

### 常用命令

```bash
make up          # 构建并启动所有服务
make down        # 停止所有服务
make clean       # 停止并清除数据（重置数据库）
make logs        # 查看实时日志
make build       # 仅重新构建镜像
make restart     # 重启所有服务
make psql        # 连接 PostgreSQL
```

## 本地开发

不使用 Docker，分别启动各服务：

```bash
# 1. 仅启动数据库
make dev-db

# 2. 启动后端（终端 1）
make dev-backend

# 3. 启动前端（终端 2）
make dev-frontend
```

本地开发时，前端 Vite 开发服务器自动将 `/api` 请求代理到 `localhost:8080`。

### 环境变量说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `FRONTEND_PORT` | 3000 | 前端端口 |
| `BACKEND_PORT` | 8080 | 后端端口 |
| `DB_HOST` | localhost | 数据库主机 |
| `DB_PORT` | 5432 | 数据库端口 |
| `DB_USER` | postgres | 数据库用户 |
| `DB_PASSWORD` | postgres | 数据库密码 |
| `DB_NAME` | coding_plan_manager | 数据库名 |
| `JWT_ACCESS_SECRET` | - | Access Token 签名密钥 |
| `JWT_REFRESH_SECRET` | - | Refresh Token 签名密钥 |
| `JWT_ACCESS_TTL` | 15m | Access Token 有效期 |
| `JWT_REFRESH_TTL` | 168h | Refresh Token 有效期 |
| `ENCRYPTION_KEY` | - | API Key 加密密钥（32 字节 hex） |

## 项目结构

```
coding-plan-manager/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── components/          # 通用组件
│   │   │   └── layout/          # 布局（Sidebar, Header）
│   │   ├── pages/               # 页面
│   │   │   ├── auth/            # 登录、注册
│   │   │   ├── dashboard/       # 仪表盘
│   │   │   ├── keys/            # API Key 管理
│   │   │   ├── models/          # 模型浏览
│   │   │   ├── usage/           # 用量分析
│   │   │   └── settings/        # 设置
│   │   ├── services/            # API 调用封装
│   │   ├── stores/              # Zustand 状态管理
│   │   └── types/               # TypeScript 类型定义
│   ├── Dockerfile               # 前端容器（Node 构建 + Nginx 托管）
│   └── nginx.conf               # Nginx 配置（SPA 路由 + API 代理）
│
├── backend/                     # Golang 后端
│   ├── cmd/server/main.go       # 入口
│   ├── internal/
│   │   ├── config/              # 配置加载
│   │   ├── handler/             # HTTP 请求处理器
│   │   ├── middleware/           # 中间件（JWT 鉴权、CORS）
│   │   ├── model/               # 数据模型
│   │   ├── repository/          # 数据访问层
│   │   ├── service/             # 业务逻辑层
│   │   └── server/              # 路由注册
│   ├── pkg/
│   │   ├── jwt/                 # JWT 工具
│   │   ├── crypto/              # AES-256-GCM 加解密
│   │   └── response/            # 统一响应格式
│   ├── migrations/              # SQL 迁移文件
│   └── Dockerfile               # 后端容器（Go 多阶段构建）
│
├── docker-compose.yml           # 编排三个服务
├── Makefile                     # 便捷命令
└── .env.example                 # 环境变量模板
```

## API 接口

### 认证（公开）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| POST | `/api/v1/auth/logout` | 退出登录 |

### 业务接口（需 JWT）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/providers` | 平台列表 |
| GET | `/api/v1/models` | 模型列表 |
| GET | `/api/v1/keys` | API Key 列表 |
| POST | `/api/v1/keys` | 创建 API Key |
| DELETE | `/api/v1/keys/:id` | 删除 API Key |
| POST | `/api/v1/keys/:id/test` | 测试 Key 连通性 |
| GET | `/api/v1/usage` | 用量汇总 |
| GET | `/api/v1/usage/by-model` | 按模型统计 |
| GET | `/api/v1/usage/trends` | 用量趋势 |
| GET | `/api/v1/dashboard/summary` | 仪表盘数据 |

## 生产部署注意

1. **修改密钥** — 复制 `.env.example` 为 `.env`，修改所有密钥和密码
2. **ENCRYPTION_KEY** — 生成 32 字节随机 hex：`openssl rand -hex 16`
3. **JWT_SECRET** — 使用高强度随机字符串
4. **数据库密码** — 使用强密码
5. **HTTPS** — 在 Nginx 前面加一层反向代理（如 Caddy、Traefik）配置 TLS
