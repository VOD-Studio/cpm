package repository

import (
	"context"
	"time"

	"coding-plan-manager/backend/internal/model"
)

// ListApiKeys 获取指定用户的所有 API Key（自己的 + 共享给自己的），关联平台信息和可用模型
func ListApiKeys(ctx context.Context, userID string) ([]model.ApiKey, error) {
	// 查询自己的 Key（shared_by = NULL）
	rows, err := DB.Query(ctx,
		`SELECT k.id, k.user_id, k.provider_id, k.name, k.key_encrypted,
		        COALESCE(k.base_url, ''), COALESCE(k.base_urls::text, '[]'),
		        COALESCE(k.plan_type, ''), k.is_active, k.last_tested_at, k.last_status,
		        k.created_at, k.updated_at,
		        p.id, p.name, p.slug, COALESCE(p.description, ''), COALESCE(p.logo_url, ''), p.created_at,
		        NULL::text
		 FROM api_keys k
		 JOIN providers p ON k.provider_id = p.id
		 WHERE k.user_id = $1

		 UNION ALL

		 SELECT k.id, k.user_id, k.provider_id, k.name, k.key_encrypted,
		        COALESCE(k.base_url, ''), COALESCE(k.base_urls::text, '[]'),
		        COALESCE(k.plan_type, ''), k.is_active, k.last_tested_at, k.last_status,
		        k.created_at, k.updated_at,
		        p.id, p.name, p.slug, COALESCE(p.description, ''), COALESCE(p.logo_url, ''), p.created_at,
		        u.username
		 FROM api_keys k
		 JOIN providers p ON k.provider_id = p.id
		 JOIN api_key_shares s ON s.api_key_id = k.id
		 JOIN users u ON u.id = s.shared_by
		 WHERE s.user_id = $1

		 ORDER BY 12 DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.ApiKey
	for rows.Next() {
		var k model.ApiKey
		var p model.Provider
		var sharedBy *string
		if err := rows.Scan(
			&k.ID, &k.UserID, &k.ProviderID, &k.Name, &k.KeyEncrypted,
			&k.BaseURL, &k.BaseURLs,
			&k.PlanType, &k.IsActive, &k.LastTestedAt, &k.LastStatus,
			&k.CreatedAt, &k.UpdatedAt,
			&p.ID, &p.Name, &p.Slug, &p.Description, &p.LogoURL, &p.CreatedAt,
			&sharedBy,
		); err != nil {
			return nil, err
		}
		k.Provider = &p
		k.SharedBy = sharedBy
		list = append(list, k)
	}

	// 批量查询所有 key 关联的模型
	if len(list) > 0 {
		modelsMap, err := getModelsForKeys(ctx, list)
		if err == nil {
			for i := range list {
				list[i].AvailableModels = modelsMap[list[i].ID]
			}
		}
	}

	return list, nil
}

// getModelsForKeys 批量获取多个 key 关联的模型
func getModelsForKeys(ctx context.Context, keys []model.ApiKey) (map[string][]model.Model, error) {
	result := make(map[string][]model.Model)

	rows, err := DB.Query(ctx,
		`SELECT km.api_key_id,
		        m.id, m.provider_id, m.model_id, m.display_name, COALESCE(m.description, ''),
		        COALESCE(m.brand, ''), COALESCE(m.capabilities, '{}'),
		        m.is_available, COALESCE(m.max_context_tokens, 0),
		        COALESCE(m.input_price_per_million, 0), COALESCE(m.output_price_per_million, 0), m.created_at
		 FROM api_key_models km
		 JOIN models m ON km.model_id = m.id
		 ORDER BY m.display_name`)
	if err != nil {
		return result, err
	}
	defer rows.Close()

	for rows.Next() {
		var apiKeyID string
		var m model.Model
		if err := rows.Scan(
			&apiKeyID,
			&m.ID, &m.ProviderID, &m.ModelID, &m.DisplayName, &m.Description,
			&m.Brand, &m.Capabilities,
			&m.IsAvailable, &m.MaxContextTokens,
			&m.InputPricePerMillion, &m.OutputPricePerMillion, &m.CreatedAt,
		); err != nil {
			return result, err
		}
		result[apiKeyID] = append(result[apiKeyID], m)
	}
	return result, nil
}

// CreateApiKey 创建新的 API Key 记录（并关联模型）
func CreateApiKey(ctx context.Context, userID, providerID, name, keyEncrypted, baseURLs, planType string, modelIDs []string) (*model.ApiKey, error) {
	var k model.ApiKey
	err := DB.QueryRow(ctx,
		`INSERT INTO api_keys (user_id, provider_id, name, key_encrypted, base_urls, plan_type)
		 VALUES ($1, $2, $3, $4, $5::jsonb, $6)
		 RETURNING id, user_id, provider_id, name, key_encrypted,
		           COALESCE(base_url, ''), COALESCE(base_urls::text, '[]'),
		           COALESCE(plan_type, ''), is_active, last_tested_at, last_status, created_at, updated_at`,
		userID, providerID, name, keyEncrypted, baseURLs, planType,
	).Scan(&k.ID, &k.UserID, &k.ProviderID, &k.Name, &k.KeyEncrypted,
		&k.BaseURL, &k.BaseURLs,
		&k.PlanType, &k.IsActive, &k.LastTestedAt, &k.LastStatus, &k.CreatedAt, &k.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// 批量关联模型
	if len(modelIDs) > 0 {
		_ = attachModelsToKey(ctx, k.ID, modelIDs)
	}

	return &k, nil
}

// attachModelsToKey 为 Key 批量关联模型
func attachModelsToKey(ctx context.Context, apiKeyID string, modelIDs []string) error {
	for _, modelID := range modelIDs {
		_, err := DB.Exec(ctx,
			`INSERT INTO api_key_models (api_key_id, model_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			apiKeyID, modelID)
		if err != nil {
			return err
		}
	}
	return nil
}

// UpdateApiKey 更新 API Key 信息（并替换关联模型）
func UpdateApiKey(ctx context.Context, id, userID, name, keyEncrypted, baseURLs, planType string, isActive *bool, modelIDs []string) (*model.ApiKey, error) {
	var k model.ApiKey
	err := DB.QueryRow(ctx,
		`UPDATE api_keys SET name = COALESCE(NULLIF($3, ''), name),
		        key_encrypted = COALESCE(NULLIF($4, ''), key_encrypted),
		        base_urls = COALESCE(NULLIF($5::jsonb, '[]'::jsonb), base_urls),
		        plan_type = COALESCE(NULLIF($6, ''), plan_type),
		        is_active = COALESCE($7, is_active),
		        updated_at = $8
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, provider_id, name, key_encrypted,
		           COALESCE(base_url, ''), COALESCE(base_urls::text, '[]'),
		           COALESCE(plan_type, ''), is_active, last_tested_at, last_status, created_at, updated_at`,
		id, userID, name, keyEncrypted, baseURLs, planType, isActive, time.Now(),
	).Scan(&k.ID, &k.UserID, &k.ProviderID, &k.Name, &k.KeyEncrypted,
		&k.BaseURL, &k.BaseURLs,
		&k.PlanType, &k.IsActive, &k.LastTestedAt, &k.LastStatus, &k.CreatedAt, &k.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// 替换关联模型
	if modelIDs != nil {
		_ = ReplaceKeyModels(ctx, id, modelIDs)
	}

	return &k, nil
}

// ReplaceKeyModels 替换 Key 关联的模型（先删后插）
func ReplaceKeyModels(ctx context.Context, apiKeyID string, modelIDs []string) error {
	_, err := DB.Exec(ctx, `DELETE FROM api_key_models WHERE api_key_id = $1`, apiKeyID)
	if err != nil {
		return err
	}
	return attachModelsToKey(ctx, apiKeyID, modelIDs)
}

// DeleteApiKey 删除指定 API Key
func DeleteApiKey(ctx context.Context, id, userID string) error {
	_, err := DB.Exec(ctx, `DELETE FROM api_keys WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

// UpdateKeyTestResult 更新 Key 测试结果
func UpdateKeyTestResult(ctx context.Context, id string, status string) error {
	_, err := DB.Exec(ctx,
		`UPDATE api_keys SET last_tested_at = $1, last_status = $2, updated_at = $1 WHERE id = $3`,
		time.Now(), status, id)
	return err
}

// GetApiKeyByID 根据 ID 获取 API Key（拥有者或共享用户均可访问）
func GetApiKeyByID(ctx context.Context, id, userID string) (*model.ApiKey, error) {
	var k model.ApiKey
	err := DB.QueryRow(ctx,
		`SELECT id, user_id, provider_id, name, key_encrypted,
		        COALESCE(base_url, ''), COALESCE(base_urls::text, '[]'),
		        COALESCE(plan_type, ''), is_active, last_tested_at, last_status, created_at, updated_at
		 FROM api_keys WHERE id = $1 AND (user_id = $2 OR EXISTS(
		 	SELECT 1 FROM api_key_shares WHERE api_key_id = $1 AND user_id = $2
		 ))`, id, userID,
	).Scan(&k.ID, &k.UserID, &k.ProviderID, &k.Name, &k.KeyEncrypted,
		&k.BaseURL, &k.BaseURLs,
		&k.PlanType, &k.IsActive, &k.LastTestedAt, &k.LastStatus, &k.CreatedAt, &k.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &k, nil
}

// ===== API Key 共享 =====

// ShareApiKey 共享 Key 给指定用户
func ShareApiKey(ctx context.Context, apiKeyID, userID, sharedBy string) error {
	_, err := DB.Exec(ctx,
		`INSERT INTO api_key_shares (api_key_id, user_id, shared_by) VALUES ($1, $2, $3)
		 ON CONFLICT (api_key_id, user_id) DO NOTHING`,
		apiKeyID, userID, sharedBy)
	return err
}

// UnshareApiKey 取消共享
func UnshareApiKey(ctx context.Context, apiKeyID, userID string) error {
	_, err := DB.Exec(ctx,
		`DELETE FROM api_key_shares WHERE api_key_id = $1 AND user_id = $2`,
		apiKeyID, userID)
	return err
}

// GetApiKeyShares 获取 Key 共享给了哪些用户
func GetApiKeyShares(ctx context.Context, apiKeyID string) ([]model.User, error) {
	rows, err := DB.Query(ctx,
		`SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.updated_at
		 FROM api_key_shares s
		 JOIN users u ON u.id = s.user_id
		 WHERE s.api_key_id = $1
		 ORDER BY u.username`, apiKeyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// IsApiKeyOwner 检查用户是否是 Key 的拥有者
func IsApiKeyOwner(ctx context.Context, apiKeyID, userID string) (bool, error) {
	var exists bool
	err := DB.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM api_keys WHERE id = $1 AND user_id = $2)`,
		apiKeyID, userID).Scan(&exists)
	return exists, err
}

// ReplaceApiKeyShares 替换 Key 的所有共享（先删后插）
func ReplaceApiKeyShares(ctx context.Context, apiKeyID, sharedBy string, userIDs []string) error {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM api_key_shares WHERE api_key_id = $1`, apiKeyID); err != nil {
		return err
	}
	for _, uid := range userIDs {
		if _, err := tx.Exec(ctx,
			`INSERT INTO api_key_shares (api_key_id, user_id, shared_by) VALUES ($1, $2, $3)`,
			apiKeyID, uid, sharedBy); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
