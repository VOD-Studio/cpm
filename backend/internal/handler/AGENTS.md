<!-- Parent: ../AGENTS.md -->

# Handler Layer

HTTP 请求处理器层，负责接收 HTTP 请求、解析参数、调用 Service 层并返回响应。

## 文件概览

### auth.go
认证处理器 `AuthHandler`，处理用户身份验证相关请求：
- `Register` - 用户注册，创建新用户并返回 token 对
- `Login` - 用户登录，验证凭据并返回 token 对
- `Refresh` - 刷新 access token
- `Logout` - 退出登录（客户端清除 token）
- `Me` - 获取当前用户信息及权限列表

### api_key.go
API Key 管理处理器 `ApiKeyHandler`，处理 API Key 的 CRUD 操作：
- `List` - 获取用户所有 Key（含共享给自己的）
- `Create` - 创建新 Key（支持多 Base URL 和模型关联）
- `Update` - 更新 Key 信息
- `Delete` - 删除 Key
- `Test` - 测试 Key 连通性
- `Decrypt` - 解密 Key 原文供前端复制
- `GetShares` / `SetShares` - Key 共享管理

### usage.go
用量统计处理器 `UsageHandler`，提供用量数据查询：
- `Summary` - 获取用量汇总（总请求数、Token 数、成本等）
- `ByModel` - 按模型聚合用量
- `ByProvider` - 按平台聚合用量
- `Trends` - 获取用量趋势数据

### dashboard.go
仪表盘处理器 `DashboardHandler`，提供仪表盘汇总数据：
- `Summary` - 综合汇总（用量统计 + 按模型/平台聚合）

### role.go
角色管理处理器 `RoleHandler`，处理角色 CRUD：
- `List` - 查询所有角色
- `Create` - 创建新角色
- `Update` - 更新角色信息和权限
- `Delete` - 删除角色（系统角色不可删）

### user_admin.go
用户管理处理器 `UserAdminHandler`，管理员操作用户：
- `ListUsers` - 查询所有用户（含角色和权限）
- `CreateUser` - 创建新用户
- `UpdateUser` - 更新用户基本信息
- `DeleteUser` - 删除用户
- `SetActive` - 启用/禁用用户
- `AssignRoles` - 为用户分配角色

### ali_usage.go
阿里云用量查询处理器 `AliUsageHandler`：
- `Query` - 通过 Cookie 查询阿里云 Coding Plan 用量

### volcengine_usage.go
火山引擎用量查询处理器 `VolcengineUsageHandler`：
- `Query` - 通过 AK/SK 查询火山引擎 Coding Plan 用量

### glm_usage.go
GLM 用量查询处理器 `GlmUsageHandler`：
- `Query` - 通过 Auth Token 查询 GLM Coding Plan 用量

## 设计模式

- 每个 Handler 持有对应 Service 的引用
- 通过依赖注入创建 Handler 实例
- 请求参数解析使用匿名 struct + JSON decode
- 响应统一使用 `pkg/response` 包的 `JSON` 和 `Error` 函数
- 用户身份信息从请求头 `X-User-ID` 获取（由中间件注入）
