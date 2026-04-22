package service

import (
	"context"

	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/repository"
)

// ProviderService 平台查询服务
type ProviderService struct{}

// NewProviderService 创建平台服务实例
func NewProviderService() *ProviderService {
	return &ProviderService{}
}

// List 获取所有平台
func (s *ProviderService) List(ctx context.Context) ([]model.Provider, error) {
	return repository.ListProviders(ctx)
}

// Create 创建新平台
func (s *ProviderService) Create(ctx context.Context, name, slug, description string) (*model.Provider, error) {
	return repository.CreateProvider(ctx, name, slug, description)
}

// Update 更新平台信息
func (s *ProviderService) Update(ctx context.Context, id, name, slug, description string) (*model.Provider, error) {
	return repository.UpdateProvider(ctx, id, name, slug, description)
}

// Delete 删除平台
func (s *ProviderService) Delete(ctx context.Context, id string) error {
	return repository.DeleteProvider(ctx, id)
}
