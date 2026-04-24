package repository

import (
	"context"
	"encoding/json"
	"time"

	"coding-plan-manager/backend/internal/model"
)

// CreateUser 创建新用户，返回用户对象
func CreateUser(ctx context.Context, username, email, passwordHash string) (*model.User, error) {
	var u model.User
	err := DB.QueryRow(ctx,
		`INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)
		 RETURNING id, username, email, password_hash, role, is_active, created_at, updated_at`,
		username, email, passwordHash,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByEmail 根据邮箱查询用户
func GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	var u model.User
	err := DB.QueryRow(ctx,
		`SELECT id, username, email, password_hash, role, is_active, created_at, updated_at
		 FROM users WHERE email = $1`, email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByID 根据 ID 查询用户
func GetUserByID(ctx context.Context, id string) (*model.User, error) {
	var u model.User
	err := DB.QueryRow(ctx,
		`SELECT id, username, email, password_hash, role, is_active, created_at, updated_at
		 FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// UpdateUserLastSeen 更新用户最后活跃时间
func UpdateUserLastSeen(ctx context.Context, id string) error {
	_, err := DB.Exec(ctx,
		`UPDATE users SET updated_at = $1 WHERE id = $2`, time.Now(), id)
	return err
}

// ListUsers 查询所有用户
func ListUsers(ctx context.Context) ([]model.User, error) {
	rows, err := DB.Query(ctx,
		`SELECT id, username, email, password_hash, role, is_active, created_at, updated_at
		 FROM users ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// UpdateUser 更新用户基本信息
func UpdateUser(ctx context.Context, id, username, email string) error {
	_, err := DB.Exec(ctx,
		`UPDATE users SET username = $1, email = $2, updated_at = $3 WHERE id = $4`,
		username, email, time.Now(), id)
	return err
}

// DeleteUser 删除用户
func DeleteUser(ctx context.Context, id string) error {
	_, err := DB.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

// SetUserStatus 设置用户启用/禁用状态
func SetUserStatus(ctx context.Context, id string, isActive bool) error {
	_, err := DB.Exec(ctx,
		`UPDATE users SET is_active = $1, updated_at = $2 WHERE id = $3`,
		isActive, time.Now(), id)
	return err
}

// GetUserPermissions 查询用户所有权限（通过角色 JOIN）
func GetUserPermissions(ctx context.Context, userID string) ([]string, error) {
	rows, err := DB.Query(ctx,
		`SELECT r.permissions FROM user_roles ur
		 JOIN roles r ON r.id = ur.role_id
		 WHERE ur.user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permSet := make(map[string]bool)
	for rows.Next() {
		var permJSON []byte
		if err := rows.Scan(&permJSON); err != nil {
			return nil, err
		}
		var perms []string
		if err := json.Unmarshal(permJSON, &perms); err != nil {
			continue
		}
		for _, p := range perms {
			permSet[p] = true
		}
	}
	if permSet["*"] {
		return []string{"*"}, nil
	}

	result := make([]string, 0, len(permSet))
	for p := range permSet {
		result = append(result, p)
	}
	return result, rows.Err()
}

// GetUserRoles 查询用户角色
func GetUserRoles(ctx context.Context, userID string) ([]model.Role, error) {
	rows, err := DB.Query(ctx,
		`SELECT r.id, r.name, r.display_name, r.description, r.permissions, r.is_system, r.created_at
		 FROM user_roles ur
		 JOIN roles r ON r.id = ur.role_id
		 WHERE ur.user_id = $1`, userID)
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

// AssignRoles 分配角色（删旧插新）
func AssignRoles(ctx context.Context, userID string, roleIDs []string) error {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM user_roles WHERE user_id = $1`, userID); err != nil {
		return err
	}
	for _, roleID := range roleIDs {
		if _, err := tx.Exec(ctx,
			`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, userID, roleID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// CountUsers 查询用户总数
func CountUsers(ctx context.Context) (int, error) {
	var count int
	err := DB.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	return count, err
}
