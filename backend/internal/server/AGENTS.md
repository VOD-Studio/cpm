<!-- Parent: ../AGENTS.md -->

# Server Package

HTTP 服务器初始化与路由注册。

## 文件概览

### server.go

#### Server
HTTP 服务器结构：
- `cfg` - 配置引用
- `router` - HTTP 路由器（`*http.ServeMux`）

#### New
创建服务器实例：
- 初始化 Service 层
- 初始化 Handler 层
- 调用 `setupRoutes` 注册路由

#### setupRoutes
注册所有 API 路由：

**公开路由（无需鉴权）**
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新 Token
- `POST /api/v1/auth/logout` - 退出登录

**受保护路由（需鉴权）**
- `GET /api/v1/auth/me` - 获取当前用户信息

**API Key 管理**
- `GET /api/v1/keys` - 获取 Key 列表
- `POST /api/v1/keys` - 创建 Key
- `PUT /api/v1/keys/{id}` - 更新 Key
- `DELETE /api/v1/keys/{id}` - 删除 Key
- `POST /api/v1/keys/{id}/test` - 测试 Key
- `GET /api/v1/keys/{id}/decrypt` - 解密 Key
- `GET /api/v1/keys/{id}/shares` - 获取共享列表
- `PUT /api/v1/keys/{id}/shares` - 设置共享

**模型与平台**
- `GET /api/v1/models` - 获取所有模型
- `POST /api/v1/models` - 创建模型
- `PUT /api/v1/models/{id}` - 更新模型
- `DELETE /api/v1/models/{id}` - 删除模型
- `GET /api/v1/providers` - 获取所有平台
- `GET /api/v1/providers/{id}/models` - 获取平台模型
- `POST /api/v1/providers` - 创建平台
- `PUT /api/v1/providers/{id}` - 更新平台
- `DELETE /api/v1/providers/{id}` - 删除平台

**用量统计**
- `GET /api/v1/usage` - 用量汇总
- `GET /api/v1/usage/by-model` - 按模型聚合
- `GET /api/v1/usage/by-provider` - 按平台聚合
- `GET /api/v1/usage/trends` - 用量趋势
- `GET /api/v1/dashboard/summary` - 仪表盘汇总

**第三方用量查询**
- `POST /api/v1/glm/usage` - GLM 用量
- `POST /api/v1/volcengine/usage` - 火山引擎用量
- `POST /api/v1/ali/usage` - 阿里云用量

**用户管理**
- `GET /api/v1/users` - 用户列表
- `POST /api/v1/users` - 创建用户
- `PUT /api/v1/users/{id}` - 更新用户
- `DELETE /api/v1/users/{id}` - 删除用户
- `PUT /api/v1/users/{id}/active` - 启用/禁用
- `PUT /api/v1/users/{id}/roles` - 分配角色

**角色管理**
- `GET /api/v1/roles` - 角色列表
- `POST /api/v1/roles` - 创建角色
- `PUT /api/v1/roles/{id}` - 更新角色
- `DELETE /api/v1/roles/{id}` - 删除角色

#### Handler
返回带 CORS 中间件的 Handler

### helpers.go

#### writeJSON
辅助函数，将数据序列化为 JSON 写入响应：
- 包装为 `{"data": <data>}` 格式

## 权限标识

路由权限映射：
- `keys:read` / `keys:write` / `keys:delete` - Key 管理
- `models:write` / `models:delete` - 模型管理
- `providers:write` / `providers:delete` - 平台管理
- `users:read` / `users:write` / `users:delete` - 用户管理
- `roles:read` / `roles:write` / `roles:delete` - 角色管理

## 设计模式

- 使用 Go 1.22+ 的新路由语法（支持路径参数如 `{id}`）
- 中间件链式组合：`middleware.Auth(cfg, middleware.RequirePermission(cfg, "perm", handler))`
- 路径参数通过 `r.PathValue("id")` 获取
