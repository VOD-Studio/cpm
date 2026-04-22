package repository

import (
	"context"
	"time"

	"coding-plan-manager/backend/internal/model"
)

// CreateUser 创建新用户，返回用户对象
func CreateUser(ctx context.Context, username, email, passwordHash string) (*model.User, error) {
	var u model.User
	err := DB.QueryRow(ctx,
		`INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)
		 RETURNING id, username, email, password_hash, role, created_at, updated_at`,
		username, email, passwordHash,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByEmail 根据邮箱查询用户
func GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	var u model.User
	err := DB.QueryRow(ctx,
		`SELECT id, username, email, password_hash, role, created_at, updated_at
		 FROM users WHERE email = $1`, email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByID 根据 ID 查询用户
func GetUserByID(ctx context.Context, id string) (*model.User, error) {
	var u model.User
	err := DB.QueryRow(ctx,
		`SELECT id, username, email, password_hash, role, created_at, updated_at
		 FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt)
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
