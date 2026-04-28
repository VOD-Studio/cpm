<!-- Parent: ../AGENTS.md -->

# Service Layer

业务逻辑层，封装核心业务规则和流程，协调 Repository 层完成数据操作。

## 文件概览

### auth.go
认证服务 `AuthService`，处理用户身份验证：
- `Register` - 注册新用户，检查邮箱唯一性，密码 bcrypt 加密，生成 token 对
- `Login` - 验证邮箱密码，生成 token 对
- `RefreshToken` - 刷新 access token，验证 refresh token 有效性
- `GetUser` - 根据 ID 获取用户信息

### api_key.go
API Key 管理服务 `ApiKeyService`：
- `List` - 获取用户所有 Key
- `Create` - 创建新 Key，加密存储敏感信息
- `Update` - 更新 Key 信息
- `Delete` - 删除 Key
- `Decrypt` - 解密 Key 原文
- `Test` - 测试 Key 连通性
- `GetKeyShares` / `SetKeyShares` - Key 共享管理（权限校验）

### usage.go
用量统计服务 `UsageService`：
- `GetSummary` - 获取用户用量汇总
- `GetByModel` - 按模型聚合用量
- `GetByProvider` - 按平台聚合用量
- `GetTrends` - 获取用量趋势
- `Record` - 写入用量记录

### role.go
角色管理服务 `RoleService`：
- `List` - 查询所有角色
- `Create` - 创建角色（检查名称唯一性）
- `Update` - 更新角色（系统角色不可编辑）
- `Delete` - 删除角色（系统角色不可删，有用户的角色不可删）

### user_admin.go
用户管理服务 `UserAdminService`：
- `ListUsers` - 查询所有用户及角色权限
- `CreateUser` - 创建用户（管理员创建）
- `UpdateUser` - 更新用户信息
- `DeleteUser` - 删除用户（保护默认管理员）
- `SetUserActive` - 设置启用/禁用状态
- `AssignRoles` - 分配角色并同步 role 字段

### model.go
模型查询服务 `ModelService`：
- `List` - 获取所有可用模型
- `ListByProvider` - 获取指定平台的模型
- `Create` / `Update` / `Delete` - 模型 CRUD

### provider.go
平台查询服务 `ProviderService`：
- `List` - 获取所有 AI 平台
- `Create` / `Update` / `Delete` - 平台 CRUD

### ali_usage.go
阿里云用量查询服务 `AliUsageService`：
- `QueryUsage` - 调用阿里云 API 查询 Coding Plan 用量

### volcengine_usage.go
火山引擎用量查询服务 `VolcengineUsageService`：
- `QueryUsage` - 调用火山引擎 ARK API（HMAC-SHA256 签名）

### glm_usage.go
GLM 用量查询服务 `GlmUsageService`：
- `QueryUsage` - 调用 GLM 监控 API 查询用量

## 设计模式

- Service 持有 Config 引用（用于获取密钥等配置）
- 业务校验在 Service 层进行（如检查系统角色不可删除）
- 密码使用 bcrypt 加密，API Key 使用 AES 加密
- 第三方 API 调用在 Service 层封装
