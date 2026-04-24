-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户-角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 为 users 表添加 is_active 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 插入系统内置角色
INSERT INTO roles (name, display_name, description, permissions, is_system) VALUES
    ('admin', '管理员', '系统管理员，拥有所有权限', '["*"]', true),
    ('user', '普通用户', '普通用户，拥有基本使用权限',
     '["dashboard:read","keys:read","keys:write","models:read","providers:read","usage:read","settings:read"]',
     true);

-- 为现有用户分配角色（admin 角色的用户 → admin，其余 → user）
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE r.name = CASE WHEN u.role = 'admin' THEN 'admin' ELSE 'user' END;

-- 确保第一个注册用户（通常是管理员）拥有 admin 角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE r.name = 'admin' AND u.role = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
