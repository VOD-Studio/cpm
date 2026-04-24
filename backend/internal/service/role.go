package service

import (
	"context"
	"errors"

	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/repository"
)

// RoleService 角色管理服务
type RoleService struct{}

// NewRoleService 创建角色服务实例
func NewRoleService() *RoleService {
	return &RoleService{}
}

// List 查询所有角色
func (s *RoleService) List(ctx context.Context) ([]model.Role, error) {
	return repository.ListRoles(ctx)
}

// Create 创建新角色
func (s *RoleService) Create(ctx context.Context, name, displayName, description string, permissions []string) (*model.Role, error) {
	if name == "" || displayName == "" {
		return nil, errors.New("角色名称和显示名称不能为空")
	}
	exists, err := repository.RoleExistsByName(ctx, name, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("角色名称已存在")
	}
	return repository.CreateRole(ctx, name, displayName, description, permissions)
}

// Update 更新角色
func (s *RoleService) Update(ctx context.Context, id, displayName, description string, permissions []string) (*model.Role, error) {
	role, err := repository.GetRoleByID(ctx, id)
	if err != nil {
		return nil, errors.New("角色不存在")
	}
	if role.IsSystem {
		return nil, errors.New("系统内置角色不可编辑")
	}
	if err := repository.UpdateRole(ctx, id, displayName, description, permissions); err != nil {
		return nil, err
	}
	return repository.GetRoleByID(ctx, id)
}

// Delete 删除角色
func (s *RoleService) Delete(ctx context.Context, id string) error {
	role, err := repository.GetRoleByID(ctx, id)
	if err != nil {
		return errors.New("角色不存在")
	}
	if role.IsSystem {
		return errors.New("系统内置角色不可删除")
	}
	hasUsers, err := repository.RoleHasUsers(ctx, id)
	if err != nil {
		return err
	}
	if hasUsers {
		return errors.New("该角色下还有用户，无法删除")
	}
	return repository.DeleteRole(ctx, id)
}
