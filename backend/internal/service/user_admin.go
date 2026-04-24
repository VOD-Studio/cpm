package service

import (
	"context"
	"errors"

	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// UserAdminService 用户管理服务
type UserAdminService struct{}

// NewUserAdminService 创建用户管理服务实例
func NewUserAdminService() *UserAdminService {
	return &UserAdminService{}
}

// isProtectedAdmin 检查是否是受保护的 admin 用户（xunrua@gmail.com）
func isProtectedAdmin(ctx context.Context, userID string) bool {
	u, err := repository.GetUserByID(ctx, userID)
	if err != nil {
		return false
	}
	return u.Role == "admin" && u.Email == "xunrua@gmail.com"
}

// ListUsers 查询所有用户（含角色和权限）
func (s *UserAdminService) ListUsers(ctx context.Context) ([]model.UserWithRoles, error) {
	users, err := repository.ListUsers(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]model.UserWithRoles, 0, len(users))
	for _, u := range users {
		roles, _ := repository.GetUserRoles(ctx, u.ID)
		perms, _ := repository.GetUserPermissions(ctx, u.ID)
		if roles == nil {
			roles = []model.Role{}
		}
		if perms == nil {
			perms = []string{}
		}
		result = append(result, model.UserWithRoles{
			User:        u,
			Roles:       roles,
			Permissions: perms,
		})
	}
	return result, nil
}

// CreateUser 创建新用户（管理员创建）
func (s *UserAdminService) CreateUser(ctx context.Context, username, email, password string) (*model.User, error) {
	if username == "" || email == "" || password == "" {
		return nil, errors.New("用户名、邮箱和密码不能为空")
	}
	if len(password) < 8 {
		return nil, errors.New("密码至少 8 位")
	}
	// 检查邮箱是否已存在
	if _, err := repository.GetUserByEmail(ctx, email); err == nil {
		return nil, errors.New("邮箱已被注册")
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return repository.CreateUser(ctx, username, email, string(hashed))
}

// UpdateUser 更新用户基本信息
func (s *UserAdminService) UpdateUser(ctx context.Context, userID, username, email string) error {
	if username == "" || email == "" {
		return errors.New("用户名和邮箱不能为空")
	}
	if isProtectedAdmin(ctx, userID) {
		return errors.New("默认管理员不可修改")
	}
	return repository.UpdateUser(ctx, userID, username, email)
}

// DeleteUser 删除用户（不能删自己，不能删 admin 用户）
func (s *UserAdminService) DeleteUser(ctx context.Context, userID, operatorID string) error {
	if userID == operatorID {
		return errors.New("不能删除自己")
	}
	if isProtectedAdmin(ctx, userID) {
		return errors.New("默认管理员不可删除")
	}
	return repository.DeleteUser(ctx, userID)
}

// SetUserActive 设置用户启用/禁用状态
func (s *UserAdminService) SetUserActive(ctx context.Context, userID string, isActive bool) error {
	if isProtectedAdmin(ctx, userID) {
		return errors.New("默认管理员不可修改状态")
	}
	return repository.SetUserStatus(ctx, userID, isActive)
}

// AssignRoles 为用户分配角色
func (s *UserAdminService) AssignRoles(ctx context.Context, userID string, roleIDs []string) error {
	if len(roleIDs) == 0 {
		return errors.New("至少需要分配一个角色")
	}
	if isProtectedAdmin(ctx, userID) {
		return errors.New("默认管理员不可修改角色")
	}
	// 验证所有角色 ID 存在
	for _, rid := range roleIDs {
		if _, err := repository.GetRoleByID(ctx, rid); err != nil {
			return errors.New("角色不存在: " + rid)
		}
	}
	if err := repository.AssignRoles(ctx, userID, roleIDs); err != nil {
		return err
	}
	// 同步 users.role 字段
	primaryRole, _ := repository.GetUserPrimaryRole(ctx, userID)
	return repository.SyncUserRoleField(ctx, userID, primaryRole)
}
