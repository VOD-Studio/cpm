<!-- Parent: ../AGENTS.md -->

# Repository Layer

数据访问层，封装所有数据库操作，使用 pgx/v5 连接 PostgreSQL。

## 文件概览

### repository.go
数据库连接管理：
- `DB` - 全局数据库连接池（`*pgxpool.Pool`）
- `InitDB` - 初始化连接池
- `CloseDB` - 关闭连接池

### user.go
用户数据访问：
- `CreateUser` - 创建用户
- `GetUserByEmail` / `GetUserByID` - 查询用户
- `UpdateUser` / `UpdateUserLastSeen` - 更新用户
- `DeleteUser` - 删除用户
- `SetUserStatus` - 设置启用/禁用状态
- `ListUsers` - 查询所有用户
- `GetUserPermissions` - 获取用户所有权限（通过角色 JOIN）
- `GetUserRoles` - 获取用户角色列表
- `AssignRoles` - 分配角色（事务内删旧插新）
- `CountUsers` - 统计用户总数

### role.go
角色数据访问：
- `CreateRole` / `GetRoleByID` / `GetRoleByName` - 角色 CRUD
- `ListRoles` - 查询所有角色
- `UpdateRole` / `DeleteRole` - 更新/删除角色
- `RoleExistsByName` - 检查角色名称唯一性
- `RoleHasUsers` - 检查角色是否关联用户
- `GetUserPrimaryRole` - 获取用户主要角色
- `SyncUserRoleField` - 同步 users.role 字段

### api_key.go
API Key 数据访问：
- `ListApiKeys` - 获取用户所有 Key（含共享给自己的的）
- `CreateApiKey` - 创建 Key 并关联模型
- `UpdateApiKey` - 更新 Key 并替换关联模型
- `DeleteApiKey` - 删除 Key
- `GetApiKeyByID` - 获取 Key（拥有者或共享用户可访问）
- `UpdateKeyTestResult` - 更新测试结果
- Key 共享：`ShareApiKey` / `UnshareApiKey` / `GetApiKeyShares` / `IsApiKeyOwner` / `ReplaceApiKeyShares`

### model.go
模型数据访问：
- `ListModels` - 获取所有模型（关联平台信息）
- `ListModelsByProvider` - 获取指定平台的模型
- `CreateModel` / `UpdateModel` / `DeleteModel` - 模型 CRUD

### provider.go
平台数据访问：
- `ListProviders` - 获取所有平台
- `GetProviderByID` - 根据 ID 获取平台
- `CreateProvider` / `UpdateProvider` / `DeleteProvider` - 平台 CRUD

### usage.go
用量数据访问：
- `GetUsageSummary` - 获取用量汇总（聚合查询）
- `GetUsageByModel` - 按模型聚合用量
- `GetUsageByProvider` - 按平台聚合用量
- `GetUsageTrends` - 获取用量趋势
- `RecordUsage` - 写入用量记录

## 设计模式

- 使用 pgx 连接池提高性能
- 查询结果直接 Scan 到 model 结构体
- 复杂查询使用 JOIN 获取关联数据
- 事务操作使用 `DB.Begin()` + `tx.Commit()`
- NULL 值处理使用 `COALESCE` 函数
- JSON 字段（如 permissions）使用 `[]byte` 中间扫描后 Unmarshal
