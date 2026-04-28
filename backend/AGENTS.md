<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-25 | Updated: 2026-04-25 -->

# Backend Service

## Purpose
Go 后端服务，提供 REST API 用于 API Key 管理、用户认证、角色权限、用量统计等功能。采用三层架构 (Handler → Service → Repository)，支持多平台 AI 服务集成。

## Key Files
| File | Description |
|------|-------------|
| `cmd/server/main.go` | 应用入口：配置加载、数据库初始化、迁移执行、HTTP 服务器启动 |
| `internal/server/server.go` | HTTP 路由注册，所有 API 端点定义，服务/处理器初始化 |
| `internal/config/config.go` | 环境变量配置：Server、Database、JWT、Crypto |
| `internal/middleware/auth.go` | JWT 认证中间件 + RBAC 权限检查 |
| `internal/model/user.go` | 数据模型定义：User、Role、Provider、ApiKey、Model、UsageRecord |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `cmd/server/` | 应用入口点 |
| `internal/config/` | 配置管理与加载 |
| `internal/handler/` | HTTP 处理器 (请求解析、响应序列化) |
| `internal/service/` | 业务逻辑层 (核心业务处理) |
| `internal/repository/` | 数据访问层 (PostgreSQL 操作) |
| `internal/middleware/` | HTTP 中间件 (认证、CORS) |
| `internal/model/` | 数据结构定义 |
| `internal/server/` | HTTP 服务器与路由 |
| `pkg/crypto/` | AES 加密工具 (API Key 加密存储) |
| `pkg/jwt/` | JWT 令牌生成与解析 |
| `pkg/response/` | 统一 API 响应格式 |
| `migrations/` | SQL 数据库迁移文件 |

## For AI Agents

### Working In This Directory
- 运行服务: `go run ./cmd/server` 或 `make dev-backend` (从项目根目录)
- 运行测试: `go test ./...`
- 构建二进制: `go build -o bin/server ./cmd/server`
- 数据库迁移在启动时自动执行 (幂等设计)

### Architecture Pattern
```
HTTP Request
    ↓
Handler (internal/handler/)
    - 解析请求参数
    - 调用 Service 层
    - 序列化响应
    ↓
Service (internal/service/)
    - 业务逻辑处理
    - 数据验证
    - 调用 Repository 或外部 API
    ↓
Repository (internal/repository/)
    - 数据库 CRUD 操作
    - SQL 查询
    ↓
PostgreSQL (pgx/v5)
```

### Adding New API Endpoint
1. 在 `internal/model/` 定义数据结构 (如需要)
2. 在 `internal/repository/` 添加数据库操作函数
3. 在 `internal/service/` 创建服务方法和结构体
4. 在 `internal/handler/` 添加 HTTP 处理器
5. 在 `internal/server/server.go` 注册路由

### Authentication & Authorization
- JWT 认证：`middleware.Auth(cfg, handler)` 验证 Bearer Token
- 权限检查：`middleware.RequirePermission(cfg, "resource:action", handler)`
- 用户信息通过请求头传递：`X-User-ID`, `X-Username`, `X-Role`
- 权限格式：`keys:read`, `keys:write`, `users:delete`, `*` (超级管理员)

### Common Patterns

**Handler 示例:**
```go
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
    userID := r.Header.Get("X-User-ID")  // 从 Auth 中间件获取
    items, err := h.svc.List(r.Context(), userID)
    if err != nil {
        response.Error(w, http.StatusInternalServerError, "fetch_failed", "获取失败")
        return
    }
    response.JSON(w, http.StatusOK, items)
}
```

**Service 示例:**
```go
func (s *Service) Create(ctx context.Context, userID, name string) (*model.Item, error) {
    // 业务验证
    if name == "" {
        return nil, errors.New("名称不能为空")
    }
    // 调用 repository
    return repository.CreateItem(ctx, userID, name)
}
```

**Repository 示例:**
```go
func CreateItem(ctx context.Context, userID, name string) (*model.Item, error) {
    var item model.Item
    err := DB.QueryRow(ctx,
        `INSERT INTO items (user_id, name) VALUES ($1, $2)
         RETURNING id, user_id, name, created_at`,
        userID, name,
    ).Scan(&item.ID, &item.UserID, &item.Name, &item.CreatedAt)
    return &item, err
}
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `8080` | HTTP 服务端口 |
| `DB_HOST` | `localhost` | PostgreSQL 主机 |
| `DB_PORT` | `5432` | PostgreSQL 端口 |
| `DB_USER` | `postgres` | 数据库用户 |
| `DB_PASSWORD` | `postgres` | 数据库密码 |
| `DB_NAME` | `coding_plan_manager` | 数据库名称 |
| `JWT_ACCESS_SECRET` | `change-me-access-secret` | Access Token 签名密钥 |
| `JWT_REFRESH_SECRET` | `change-me-refresh-secret` | Refresh Token 签名密钥 |
| `ENCRYPTION_KEY` | `0123456789abcdef...` | API Key 加密密钥 (32字节) |

### API Routes Summary
| Route | Method | Auth | Permission | Description |
|-------|--------|------|------------|-------------|
| `/api/v1/auth/register` | POST | No | - | 用户注册 |
| `/api/v1/auth/login` | POST | No | - | 用户登录 |
| `/api/v1/auth/refresh` | POST | No | - | 刷新 Token |
| `/api/v1/auth/me` | GET | Yes | - | 获取当前用户 |
| `/api/v1/keys` | GET/POST | Yes | `keys:read/write` | API Key 列表/创建 |
| `/api/v1/keys/{id}` | PUT/DELETE | Yes | `keys:write/delete` | 更新/删除 Key |
| `/api/v1/models` | GET/POST | Yes | `models:write` (POST) | 模型管理 |
| `/api/v1/providers` | GET/POST | Yes | `providers:write` (POST) | 平台管理 |
| `/api/v1/users` | GET/POST | Yes | `users:read/write` | 用户管理 |
| `/api/v1/roles` | GET/POST | Yes | `roles:read/write` | 角色管理 |
| `/api/v1/usage/*` | GET | Yes | - | 用量统计 |
| `/api/v1/glm/usage` | POST | Yes | - | 智谱用量查询 |
| `/api/v1/volcengine/usage` | POST | Yes | - | 火山引擎用量查询 |
| `/api/v1/ali/usage` | POST | Yes | - | 阿里云用量查询 |

## Dependencies

### Internal
- `internal/config` — 配置管理
- `internal/model` — 数据模型
- `internal/repository` — 数据访问 (共享 DB 连接)
- `pkg/crypto` — AES-GCM 加密
- `pkg/jwt` — JWT 令牌处理
- `pkg/response` — 统一 JSON 响应

### External (go.mod)
| Package | Version | Purpose |
|---------|---------|---------|
| `github.com/jackc/pgx/v5` | v5.9.2 | PostgreSQL 驱动与连接池 |
| `github.com/golang-jwt/jwt/v5` | v5.3.1 | JWT 令牌生成与验证 |
| `golang.org/x/crypto` | v0.50.0 | bcrypt 密码哈希 |

## Database Schema
核心表 (见 `migrations/`):
- `users` — 用户账户
- `roles` — 角色定义 (含权限数组)
- `user_roles` — 用户-角色关联
- `providers` — AI 平台 (Anthropic, OpenAI, etc.)
- `api_keys` — API Key (加密存储)
- `api_key_models` — Key-模型关联
- `api_key_shares` — Key 共享关系
- `models` — 可用模型及定价
- `usage_records` — 用量统计记录

<!-- MANUAL: -->
