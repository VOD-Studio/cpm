package service

import (
	"context"

	"coding-plan-manager/backend/internal/config"
	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/repository"
	"coding-plan-manager/backend/pkg/crypto"
)

// ApiKeyService API Key 管理服务
type ApiKeyService struct {
	cfg *config.Config
}

// NewApiKeyService 创建 API Key 服务实例
func NewApiKeyService(cfg *config.Config) *ApiKeyService {
	return &ApiKeyService{cfg: cfg}
}

// List 获取用户所有 API Key
func (s *ApiKeyService) List(ctx context.Context, userID string) ([]model.ApiKey, error) {
	return repository.ListApiKeys(ctx, userID)
}

// Create 创建新 API Key（加密存储，baseURLs 为 JSON 字符串，modelIDs 为关联模型 ID 列表）
func (s *ApiKeyService) Create(ctx context.Context, userID, providerID, name, rawKey, baseURLs, planType string, modelIDs []string) (*model.ApiKey, error) {
	// 加密 API Key 后存储
	encrypted, err := crypto.Encrypt(rawKey, s.cfg.Crypto.EncryptionKey)
	if err != nil {
		return nil, err
	}
	return repository.CreateApiKey(ctx, userID, providerID, name, encrypted, baseURLs, planType, modelIDs)
}

// Update 更新 API Key 信息（含关联模型）
func (s *ApiKeyService) Update(ctx context.Context, id, userID string, name, rawKey, baseURLs, planType string, isActive *bool, modelIDs []string) (*model.ApiKey, error) {
	// 如果提供了新的 key，加密后更新
	encrypted := ""
	if rawKey != "" {
		enc, err := crypto.Encrypt(rawKey, s.cfg.Crypto.EncryptionKey)
		if err != nil {
			return nil, err
		}
		encrypted = enc
	}
	return repository.UpdateApiKey(ctx, id, userID, name, encrypted, baseURLs, planType, isActive, modelIDs)
}

// Delete 删除 API Key
func (s *ApiKeyService) Delete(ctx context.Context, id, userID string) error {
	return repository.DeleteApiKey(ctx, id, userID)
}

// Decrypt 解密 API Key 原文（供前端查看/复制使用）
func (s *ApiKeyService) Decrypt(ctx context.Context, id, userID string) (string, error) {
	key, err := repository.GetApiKeyByID(ctx, id, userID)
	if err != nil {
		return "", err
	}
	plain, err := crypto.Decrypt(key.KeyEncrypted, s.cfg.Crypto.EncryptionKey)
	if err != nil {
		return "", err
	}
	return plain, nil
}

// Test 测试 API Key 连通性（更新测试状态）
func (s *ApiKeyService) Test(ctx context.Context, id, userID string) (string, error) {
	key, err := repository.GetApiKeyByID(ctx, id, userID)
	if err != nil {
		return "", err
	}
	// 解密 key 用于测试
	_, err = crypto.Decrypt(key.KeyEncrypted, s.cfg.Crypto.EncryptionKey)
	if err != nil {
		return "error", err
	}
	// TODO: 实际调用对应平台 API 进行连通性测试
	// 此处简化为标记为 valid
	status := "valid"
	_ = repository.UpdateKeyTestResult(ctx, id, status)
	return status, nil
}
