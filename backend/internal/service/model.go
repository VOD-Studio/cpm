package service

import (
	"context"

	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/repository"
)

// ModelService 模型查询服务
type ModelService struct{}

// NewModelService 创建模型服务实例
func NewModelService() *ModelService {
	return &ModelService{}
}

// List 获取所有可用模型
func (s *ModelService) List(ctx context.Context) ([]model.Model, error) {
	return repository.ListModels(ctx)
}

// ListByProvider 获取指定平台的模型
func (s *ModelService) ListByProvider(ctx context.Context, providerID string) ([]model.Model, error) {
	return repository.ListModelsByProvider(ctx, providerID)
}

// Create 创建新模型
func (s *ModelService) Create(ctx context.Context, providerID, modelID, displayName, brand string, capabilities []string, maxContextTokens, maxOutputTokens int, inputPrice, outputPrice float64) (*model.Model, error) {
	return repository.CreateModel(ctx, providerID, modelID, displayName, brand, capabilities, maxContextTokens, maxOutputTokens, inputPrice, outputPrice)
}

// Update 更新模型信息
func (s *ModelService) Update(ctx context.Context, id string, providerID, modelID, displayName, brand string, capabilities []string, maxContextTokens, maxOutputTokens int, inputPrice, outputPrice float64, isAvailable *bool) (*model.Model, error) {
	return repository.UpdateModel(ctx, id, providerID, modelID, displayName, brand, capabilities, maxContextTokens, maxOutputTokens, inputPrice, outputPrice, isAvailable)
}

// Delete 删除模型
func (s *ModelService) Delete(ctx context.Context, id string) error {
	return repository.DeleteModel(ctx, id)
}
