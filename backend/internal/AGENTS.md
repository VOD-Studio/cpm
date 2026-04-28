# backend/internal

<!-- Parent: ../AGENTS.md -->

内部模块目录，包含分层架构的核心实现代码。

## Purpose

此目录封装了应用的核心业务逻辑，按职责划分为清晰的分层架构。所有内部模块不对外暴露，通过 `server` 统一暴露 HTTP API。

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| [config/](./config/) | 配置加载，环境变量解析 |
| [handler/](./handler/) | HTTP 请求处理，参数校验，响应封装 |
| [middleware/](./middleware/) | HTTP 中间件，鉴权/权限检查/CORS |
| [model/](./model/) | 数据模型定义，结构体与 JSON 映射 |
| [repository/](./repository/) | 数据访问层，SQL 查询与持久化 |
| [server/](./server/) | HTTP 服务器，路由注册与启动 |
| [service/](./service/) | 业务逻辑层，领域服务实现 |

## For AI Agents

### Layered Architecture

```
Request Flow:
  HTTP Request -> middleware (auth/perm) -> handler -> service -> repository -> database

Dependency Direction:
  handler -> service -> repository -> model
  server -> handler, middleware
  all -> config, model
```

### Layer Responsibilities

1. **config/** - 应用配置
   - 从环境变量加载 Server/Database/JWT/Crypto 配置
   - 提供 `DatabaseConfig.DSN()` 生成连接字符串

2. **model/** - 领域模型
   - 纯数据结构定义，无业务逻辑
   - 包含 User, Role, ApiKey, Model, Provider, UsageRecord 等
   - JSON tag 定义序列化规则

3. **repository/** - 数据访问
   - 全局 `DB *pgxpool.Pool` 连接池
   - 每个领域实体一个文件: user.go, role.go, api_key.go, model.go 等
   - 函数式 API，无状态: `GetUserByID(ctx, id)`

4. **service/** - 业务逻辑
   - 封装业务规则与外部依赖调用
   - 每个服务一个结构体: `AuthService`, `ApiKeyService`, `ModelService`
   - 协调 repository 操作，处理加密/解密/JWT 等横切关注点

5. **handler/** - 请求处理
   - HTTP handler 函数，解析请求参数
   - 调用 service 层，封装 response
   - 路由定义在 `server.go` 的 `setupRoutes()`

6. **middleware/** - 横切逻辑
   - `Auth()`: JWT 验证，注入 X-User-ID/X-Username/X-Role 到请求头
   - `RequirePermission()`: 权限检查，支持缓存
   - `CORS()`: 跨域处理

7. **server/** - 服务器入口
   - `New()` 创建服务器并注册路由
   - `Handler()` 返回带 CORS 的 handler
   - `setupRoutes()` 集中定义所有 API 路由

### Adding New Features

To add a new feature (e.g., "notifications"):

1. **model/user.go** - 添加数据结构:
   ```go
   type Notification struct {
       ID        string    `json:"id"`
       UserID    string    `json:"user_id"`
       Message   string    `json:"message"`
       Read      bool      `json:"read"`
       CreatedAt time.Time `json:"created_at"`
   }
   ```

2. **repository/notification.go** - 数据访问:
   ```go
   func CreateNotification(ctx context.Context, userID, message string) (*model.Notification, error)
   func ListNotifications(ctx context.Context, userID string) ([]model.Notification, error)
   func MarkAsRead(ctx context.Context, id string) error
   ```

3. **service/notification.go** - 业务逻辑:
   ```go
   type NotificationService struct{}
   func NewNotificationService() *NotificationService
   func (s *NotificationService) List(ctx context.Context, userID string) ([]model.Notification, error)
   ```

4. **handler/notification.go** - HTTP 处理:
   ```go
   type NotificationHandler struct { svc *service.NotificationService }
   func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler
   func (h *NotificationHandler) List(w http.ResponseWriter, r *http.Request)
   ```

5. **server/server.go** - 注册路由:
   ```go
   // 在 setupRoutes() 中添加
   notifSvc := service.NewNotificationService()
   notifH := handler.NewNotificationHandler(notifSvc)
   s.router.HandleFunc("GET /api/v1/notifications", middleware.Auth(s.cfg, notifH.List))
   ```

### Permission System

- 权限通过 `user_roles` 和 `roles` 表关联
- `repository.GetUserPermissions()` 查询用户所有权限
- `middleware.RequirePermission(cfg, "resource:action", handler)` 检查权限
- 权限格式: `keys:read`, `keys:write`, `users:delete`, `*` (超级权限)
- 权限缓存 5 分钟，存储在 `middleware.permCache`

### Common Patterns

**Repository Function Signature**:
```go
func GetXxxByID(ctx context.Context, id string) (*model.Xxx, error)
func ListXxx(ctx context.Context) ([]model.Xxx, error)
func CreateXxx(ctx context.Context, ...) (*model.Xxx, error)
func UpdateXxx(ctx context.Context, id string, ...) error
func DeleteXxx(ctx context.Context, id string) error
```

**Service Layer**:
```go
type XxxService struct {
    cfg *config.Config  // 可选，需要配置时
}
func NewXxxService(cfg *config.Config) *XxxService
func (s *XxxService) Method(ctx context.Context, ...) (..., error)
```

**Handler Layer**:
```go
type XxxHandler struct {
    svc *service.XxxService
}
func NewXxxHandler(svc *service.XxxService) *XxxHandler
func (h *XxxHandler) Method(w http.ResponseWriter, r *http.Request)
```

## Dependencies

### Internal Dependencies (Layer Hierarchy)

```
+-------------+     +------------+     +--------------+
|   handler   | --> |  service   | --> |  repository  |
+-------------+     +------------+     +--------------+
       |                  |                   |
       v                  v                   v
+-------------+     +------------+     +--------------+
| middleware  |     |   model    | <-- |   config     |
+-------------+     +------------+     +--------------+
       |                  ^
       v                  |
+-------------+           |
|   server    | ----------+
+-------------+
```

### External Dependencies

- `github.com/jackc/pgx/v5/pgxpool` - PostgreSQL 连接池
- `golang.org/x/crypto/bcrypt` - 密码哈希
- 内部 pkg: `pkg/jwt`, `pkg/crypto`, `pkg/response`

### Key Import Rules

- **model/** - 只导入标准库
- **repository/** - 导入 model, pgxpool
- **service/** - 导入 config, model, repository, pkg/*
- **handler/** - 导入 service, repository (仅查询), pkg/response
- **middleware/** - 导入 config, repository, pkg/*
- **server/** - 导入所有 internal 模块
- **config/** - 只导入标准库

## Key Files

- `server/server.go` - 所有路由定义，服务初始化
- `repository/repository.go` - 数据库连接池初始化
- `middleware/auth.go` - JWT 鉴权与权限检查
- `model/user.go` - 核心领域模型
