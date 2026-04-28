<!-- Parent: ../AGENTS.md -->

# Middleware Layer

HTTP 中间件，处理请求预处理和响应后处理。

## 文件概览

### auth.go
认证与权限中间件：

#### Auth
JWT 鉴权中间件：
- 验证 `Authorization: Bearer <token>` 头
- 解析并验证 access token
- 将用户信息注入请求头供下游使用：
  - `X-User-ID` - 用户 ID
  - `X-Username` - 用户名
  - `X-Role` - 角色名称

#### RequirePermission
权限检查中间件：
- 依赖 Auth 中间件（需先注入用户信息）
- 查询用户权限列表
- 检查是否拥有目标权限或通配符 `*`
- 权限不足返回 403 Forbidden

#### 权限缓存
- `permCache` - 内存权限缓存（map）
- `permCacheMu` - 读写锁保护并发访问
- 缓存有效期 5 分钟
- 减少数据库查询次数

### cors.go
跨域资源共享中间件：

#### CORS
- 设置 `Access-Control-Allow-Origin: *`
- 允许 `GET, POST, PUT, DELETE, OPTIONS` 方法
- 允许 `Content-Type, Authorization` 头
- 预检请求（OPTIONS）返回 204
- Max-Age 设置为 86400 秒

## 中间件链

典型请求处理链：
1. CORS 中间件 - 处理跨域
2. Auth 中间件 - 验证身份
3. RequirePermission 中间件 - 检查权限
4. Handler - 业务处理

## 设计模式

- 中间件返回 `http.HandlerFunc`，支持链式组合
- 错误响应使用 `pkg/response.Error` 统一格式
- 权限缓存使用 sync.RWMutex 保证并发安全
