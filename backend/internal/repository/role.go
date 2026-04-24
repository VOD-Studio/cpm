package repository

import (
	"context"
	"encoding/json"
	"time"

	"coding-plan-manager/backend/internal/model"
)

// CreateRole 创建新角色
func CreateRole(ctx context.Context, name, displayName, description string, permissions []string) (*model.Role, error) {
	permJSON, err := json.Marshal(permissions)
	if err != nil {
		return nil, err
	}
	var r model.Role
	err = DB.QueryRow(ctx,
		`INSERT INTO roles (name, display_name, description, permissions)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, display_name, description, permissions, is_system, created_at`,
		name, displayName, description, permJSON,
	).Scan(&r.ID, &r.Name, &r.DisplayName, &r.Description, &permJSON, &r.IsSystem, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(permJSON, &r.Permissions)
	return &r, nil
}

// GetRoleByID 根据 ID 查询角色
func GetRoleByID(ctx context.Context, id string) (*model.Role, error) {
	var r model.Role
	var permJSON []byte
	err := DB.QueryRow(ctx,
		`SELECT id, name, display_name, description, permissions, is_system, created_at
		 FROM roles WHERE id = $1`, id,
	).Scan(&r.ID, &r.Name, &r.DisplayName, &r.Description, &permJSON, &r.IsSystem, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(permJSON, &r.Permissions)
	return &r, nil
}

// GetRoleByName 根据名称查询角色
func GetRoleByName(ctx context.Context, name string) (*model.Role, error) {
	var r model.Role
	var permJSON []byte
	err := DB.QueryRow(ctx,
		`SELECT id, name, display_name, description, permissions, is_system, created_at
		 FROM roles WHERE name = $1`, name,
	).Scan(&r.ID, &r.Name, &r.DisplayName, &r.Description, &permJSON, &r.IsSystem, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(permJSON, &r.Permissions)
	return &r, nil
}

// ListRoles 查询所有角色
func ListRoles(ctx context.Context) ([]model.Role, error) {
	rows, err := DB.Query(ctx,
		`SELECT id, name, display_name, description, permissions, is_system, created_at
		 FROM roles ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []model.Role
	for rows.Next() {
		var r model.Role
		var permJSON []byte
		if err := rows.Scan(&r.ID, &r.Name, &r.DisplayName, &r.Description, &permJSON, &r.IsSystem, &r.CreatedAt); err != nil {
			return nil, err
		}
		json.Unmarshal(permJSON, &r.Permissions)
		roles = append(roles, r)
	}
	return roles, rows.Err()
}

// UpdateRole 更新角色
func UpdateRole(ctx context.Context, id, displayName, description string, permissions []string) error {
	permJSON, err := json.Marshal(permissions)
	if err != nil {
		return err
	}
	_, err = DB.Exec(ctx,
		`UPDATE roles SET display_name = $1, description = $2, permissions = $3 WHERE id = $4`,
		displayName, description, permJSON, id)
	return err
}

// DeleteRole 删除角色（系统角色不可删除）
func DeleteRole(ctx context.Context, id string) error {
	_, err := DB.Exec(ctx,
		`DELETE FROM roles WHERE id = $1 AND is_system = false`, id)
	return err
}

// RoleExistsByName 检查角色名称是否已存在
func RoleExistsByName(ctx context.Context, name string, excludeID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM roles WHERE name = $1`
	args := []any{name}
	if excludeID != "" {
		query += ` AND id != $2`
		args = append(args, excludeID)
	}
	query += `)`
	err := DB.QueryRow(ctx, query, args...).Scan(&exists)
	return exists, err
}

// RoleHasUsers 检查角色是否关联了用户
func RoleHasUsers(ctx context.Context, roleID string) (bool, error) {
	var exists bool
	err := DB.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM user_roles WHERE role_id = $1)`, roleID).Scan(&exists)
	return exists, err
}

// GetUserPrimaryRole 获取用户的主要角色名称（用于保持 users.role 字段同步）
func GetUserPrimaryRole(ctx context.Context, userID string) (string, error) {
	var name string
	err := DB.QueryRow(ctx,
		`SELECT r.name FROM user_roles ur
		 JOIN roles r ON r.id = ur.role_id
		 WHERE ur.user_id = $1
		 ORDER BY r.is_system DESC, r.created_at ASC
		 LIMIT 1`, userID).Scan(&name)
	if err != nil {
		return "user", nil
	}
	return name, nil
}

// SyncUserRoleField 同步 users.role 字段到 user_roles 表的值
func SyncUserRoleField(ctx context.Context, userID string, role string) error {
	_, err := DB.Exec(ctx,
		`UPDATE users SET role = $1, updated_at = $2 WHERE id = $3`,
		role, time.Now(), userID)
	return err
}
