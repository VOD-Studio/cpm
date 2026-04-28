<!-- Parent: ../AGENTS.md -->

# Model Layer

数据模型定义，定义系统中所有实体结构。

## 文件概览

### user.go
包含所有核心数据模型：

#### User
用户实体：
- `ID` - 用户唯一标识（UUID）
- `Username` - 用户名
- `Email` - 邮箱
- `PasswordHash` - 密码哈希（JSON 序列化时隐藏）
- `Role` - 角色名称（同步自 user_roles 表）
- `IsActive` - 启用状态
- `CreatedAt` / `UpdatedAt` - 时间戳

#### Role
角色实体：
- `ID` - 角色唯一标识
- `Name` - 角色名称（如 admin、user）
- `DisplayName` - 显示名称
- `Description` - 描述
- `Permissions` - 权限列表（字符串数组）
- `IsSystem` - 是否系统内置角色
- `CreatedAt` - 创建时间

#### UserWithRoles
用户与角色组合视图：
- 嵌入 `User` 结构体
- `Roles` - 用户拥有的角色列表
- `Permissions` - 用户所有权限列表

#### Provider
AI 平台提供商：
- `ID` / `Name` / `Slug` / `Description` / `LogoURL` / `CreatedAt`

#### ApiKey
API Key 实体：
- `ID` / `UserID` / `ProviderID` / `Provider`
- `Name` - Key 名称
- `KeyEncrypted` - 加密后的 Key（JSON 输出时隐藏）
- `BaseURL` / `BaseURLs` - API Base URL
- `PlanType` - 计划类型
- `IsActive` - 启用状态
- `LastTestedAt` / `LastStatus` - 测试结果
- `AvailableModels` - 关联的可用模型
- `SharedBy` - 共享者用户名（非空表示是共享的 Key）

#### Model
AI 模型实体：
- `ID` / `ProviderID` / `Provider` / `ModelID` / `DisplayName`
- `Description` / `Brand` - 品牌（千问、智谱等）
- `Capabilities` - 能力标签（文本生成、深度思考等）
- `IsAvailable` - 是否可用
- `MaxContextTokens` / `MaxOutputTokens` - Token 限制
- `InputPricePerMillion` / `OutputPricePerMillion` - 价格

#### UsageSummary
用量汇总：
- `TotalRequests` / `TotalInputTokens` / `TotalOutputTokens` / `TotalTokens`
- `Cost` / `AvgResponseTimeMs` / `TotalErrors`
- `KeyCount` / `ActiveKeyCount`

#### UsageRecord
用量记录：
- `ID` / `ApiKeyID` / `ModelID` / `Model` / `ApiKey`
- `RequestCount` / `InputTokens` / `OutputTokens` / `TotalTokens` / `Cost`
- `AvgResponseTimeMs` / `ErrorCount`
- `PeriodType` / `PeriodStart` / `PeriodEnd` - 时间窗口
- `CreatedAt`

## JSON 标签

- 所有字段使用 `json` 标签控制序列化
- 敏感字段（如 `PasswordHash`、`KeyEncrypted`）使用 `json:"-"` 隐藏
- 关联实体使用 `omitempty` 省略空值
