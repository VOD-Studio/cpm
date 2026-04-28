<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# Database Migrations

## Purpose
PostgreSQL 数据库迁移文件，定义应用的数据模型结构。使用顺序编号的 SQL 脚本，支持 up/down 双向迁移。迁移在服务启动时自动执行。

## Key Files
| File | Description |
|------|-------------|
| `001_create_users.up.sql` | 创建 users 表：用户账户、密码哈希、角色字段 |
| `001_create_users.down.sql` | 回滚：删除 users 表 |
| `002_create_providers.up.sql` | 创建 providers 表 + 初始数据 (Anthropic, OpenAI, Google) |
| `002_create_providers.down.sql` | 回滚：删除 providers 表 |
| `003_create_api_keys.up.sql` | 创建 api_keys 表：加密存储、provider 关联 |
| `003_create_api_keys.down.sql` | 回滚：删除 api_keys 表 |
| `004_create_models.up.sql` | 创建 models 表 + 初始模型数据及定价 |
| `004_create_models.down.sql` | 回滚：删除 models 表 |
| `005_create_usage_records.up.sql` | 创建 usage_records 表：用量统计、时间周期索引 |
| `005_create_usage_records.down.sql` | 回滚：删除 usage_records 表 |
| `006_add_base_urls_and_brand.up.sql` | 修改 providers 表：添加 base_url、brand 字段 |
| `007_create_api_key_models.up.sql` | 创建 api_key_models 关联表 (多对多) |
| `008_add_max_output_tokens_and_zhipu_models.up.sql` | 添加 max_output_tokens 字段 + 智谱模型数据 |
| `009_add_volcengine_models.up.sql` | 添加火山引擎模型数据 |
| `010_fix_ali_models_tokens.up.sql` | 修正阿里云模型 token 限制 |
| `011_create_roles.up.sql` | 创建 roles/user_roles 表 + 系统角色 (admin/user) |
| `012_api_key_shares.up.sql` | 创建 api_key_shares 表：Key 共享关系 |

## For AI Agents

### Migration Execution Order
```
001 (users) → 002 (providers) → 003 (api_keys) → 004 (models)
    → 005 (usage_records) → 006 (providers 扩展) → 007 (api_key_models)
    → 008-010 (模型数据更新) → 011 (roles) → 012 (api_key_shares)
```

**依赖关系：**
- `api_keys` 依赖 `users`, `providers`
- `models` 依赖 `providers`
- `usage_records` 依赖 `api_keys`, `models`
- `api_key_models` 依赖 `api_keys`, `models`
- `user_roles` 依赖 `users`, `roles`
- `api_key_shares` 依赖 `api_keys`, `users`

### Adding New Migration
1. 确定下一个序号 (当前最大: 012)
2. 创建 `{N}_description.up.sql` 和 `{N}_description.down.sql`
3. up 脚本：CREATE TABLE IF NOT EXISTS / ALTER TABLE ... ADD COLUMN IF NOT EXISTS
4. down 脚本：DROP TABLE IF EXISTS / ALTER TABLE ... DROP COLUMN IF EXISTS
5. 使用幂等 SQL (IF NOT EXISTS / IF EXISTS)
6. 外键约束使用 `ON DELETE CASCADE`

### Migration SQL Patterns

**创建新表：**
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- columns
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);
```

**添加列：**
```sql
ALTER TABLE existing_table ADD COLUMN IF NOT EXISTS new_column VARCHAR(100);
```

**外键约束：**
```sql
foreign_id UUID NOT NULL REFERENCES other_table(id) ON DELETE CASCADE
```

### Database Schema Overview
```
users ─┬─< user_roles >── roles
       │
       ├─< api_keys >── providers
       │        │
       │        ├─< api_key_models >── models
       │        │
       │        └─< api_key_shares
       │
       └─< usage_records >── models
```

### Important Notes
- 迁移在 `cmd/server/main.go` 启动时自动执行
- 使用 `pgcrypto` 扩展 (001 中启用)
- 所有表使用 UUID 主键
- 时间字段使用 `TIMESTAMPTZ` (带时区)
- JSONB 用于 permissions 数组存储
- 定价使用 `DECIMAL(10,6)` 精度
