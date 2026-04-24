-- 回滚：删除用户-角色关联表
DROP TABLE IF EXISTS user_roles;

-- 回滚：删除角色表
DROP TABLE IF EXISTS roles;

-- 回滚：移除 is_active 字段
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
