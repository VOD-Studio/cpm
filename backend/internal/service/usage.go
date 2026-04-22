package service

import (
	"context"

	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/repository"
)

// UsageService 用量统计服务
type UsageService struct{}

// NewUsageService 创建用量统计服务实例
func NewUsageService() *UsageService {
	return &UsageService{}
}

// GetSummary 获取用户用量汇总
func (s *UsageService) GetSummary(ctx context.Context, userID, start, end string) (*model.UsageSummary, error) {
	return repository.GetUsageSummary(ctx, userID, start, end)
}

// GetByModel 按模型聚合用量
func (s *UsageService) GetByModel(ctx context.Context, userID, start, end string) ([]model.UsageRecord, error) {
	return repository.GetUsageByModel(ctx, userID, start, end)
}

// GetByProvider 按平台聚合用量
func (s *UsageService) GetByProvider(ctx context.Context, userID, start, end string) ([]map[string]any, error) {
	return repository.GetUsageByProvider(ctx, userID, start, end)
}

// GetTrends 获取用量趋势
func (s *UsageService) GetTrends(ctx context.Context, userID, period, start, end string) ([]model.UsageRecord, error) {
	return repository.GetUsageTrends(ctx, userID, period, start, end)
}

// Record 写入用量记录
func (s *UsageService) Record(ctx context.Context, r *model.UsageRecord) error {
	return repository.RecordUsage(ctx, r)
}
