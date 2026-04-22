package repository

import (
	"context"

	"coding-plan-manager/backend/internal/model"
)

// ListModels 获取所有可用模型（关联平台信息）
func ListModels(ctx context.Context) ([]model.Model, error) {
	rows, err := DB.Query(ctx,
		`SELECT m.id, m.provider_id, m.model_id, m.display_name, COALESCE(m.description, ''),
		        COALESCE(m.brand, ''), COALESCE(m.capabilities, '{}'),
		        m.is_available, COALESCE(m.max_context_tokens, 0), COALESCE(m.max_output_tokens, 0),
		        COALESCE(m.input_price_per_million, 0), COALESCE(m.output_price_per_million, 0), m.created_at,
		        p.id, p.name, p.slug, COALESCE(p.description, ''), COALESCE(p.logo_url, ''), p.created_at
		 FROM models m
		 JOIN providers p ON m.provider_id = p.id
		 ORDER BY p.name, m.display_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.Model
	for rows.Next() {
		var m model.Model
		var p model.Provider
		if err := rows.Scan(
			&m.ID, &m.ProviderID, &m.ModelID, &m.DisplayName, &m.Description,
			&m.Brand, &m.Capabilities,
			&m.IsAvailable, &m.MaxContextTokens, &m.MaxOutputTokens,
			&m.InputPricePerMillion, &m.OutputPricePerMillion, &m.CreatedAt,
			&p.ID, &p.Name, &p.Slug, &p.Description, &p.LogoURL, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		m.Provider = &p
		list = append(list, m)
	}
	return list, nil
}

// ListModelsByProvider 获取指定平台的模型列表
func ListModelsByProvider(ctx context.Context, providerID string) ([]model.Model, error) {
	rows, err := DB.Query(ctx,
		`SELECT m.id, m.provider_id, m.model_id, m.display_name, COALESCE(m.description, ''),
		        COALESCE(m.brand, ''), COALESCE(m.capabilities, '{}'),
		        m.is_available, COALESCE(m.max_context_tokens, 0), COALESCE(m.max_output_tokens, 0),
		        COALESCE(m.input_price_per_million, 0), COALESCE(m.output_price_per_million, 0), m.created_at
		 FROM models m
		 WHERE m.provider_id = $1
		 ORDER BY m.display_name`, providerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.Model
	for rows.Next() {
		var m model.Model
		if err := rows.Scan(
			&m.ID, &m.ProviderID, &m.ModelID, &m.DisplayName, &m.Description,
			&m.Brand, &m.Capabilities,
			&m.IsAvailable, &m.MaxContextTokens, &m.MaxOutputTokens,
			&m.InputPricePerMillion, &m.OutputPricePerMillion, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

// CreateModel 创建新模型
func CreateModel(ctx context.Context, providerID, modelID, displayName, brand string, capabilities []string, maxContextTokens, maxOutputTokens int, inputPrice, outputPrice float64) (*model.Model, error) {
	var m model.Model
	err := DB.QueryRow(ctx,
		`INSERT INTO models (provider_id, model_id, display_name, brand, capabilities, max_context_tokens, max_output_tokens, input_price_per_million, output_price_per_million, is_available)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
		 RETURNING id, provider_id, model_id, display_name, COALESCE(description, ''),
		           COALESCE(brand, ''), COALESCE(capabilities, '{}'),
		           is_available, COALESCE(max_context_tokens, 0), COALESCE(max_output_tokens, 0),
		           COALESCE(input_price_per_million, 0), COALESCE(output_price_per_million, 0), created_at`,
		providerID, modelID, displayName, brand, capabilities, maxContextTokens, maxOutputTokens, inputPrice, outputPrice,
	).Scan(
		&m.ID, &m.ProviderID, &m.ModelID, &m.DisplayName, &m.Description,
		&m.Brand, &m.Capabilities,
		&m.IsAvailable, &m.MaxContextTokens, &m.MaxOutputTokens,
		&m.InputPricePerMillion, &m.OutputPricePerMillion, &m.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// UpdateModel 更新模型信息
func UpdateModel(ctx context.Context, id string, providerID, modelID, displayName, brand string, capabilities []string, maxContextTokens, maxOutputTokens int, inputPrice, outputPrice float64, isAvailable *bool) (*model.Model, error) {
	var m model.Model
	err := DB.QueryRow(ctx,
		`UPDATE models SET
		        provider_id = COALESCE(NULLIF($2, ''), provider_id),
		        model_id = COALESCE(NULLIF($3, ''), model_id),
		        display_name = COALESCE(NULLIF($4, ''), display_name),
		        brand = COALESCE(NULLIF($5, ''), brand),
		        capabilities = COALESCE($6, capabilities),
		        max_context_tokens = CASE WHEN $7 = 0 THEN max_context_tokens ELSE $7 END,
		        max_output_tokens = CASE WHEN $8 = 0 THEN max_output_tokens ELSE $8 END,
		        input_price_per_million = CASE WHEN $9 = 0 THEN input_price_per_million ELSE $9 END,
		        output_price_per_million = CASE WHEN $10 = 0 THEN output_price_per_million ELSE $10 END,
		        is_available = COALESCE($11, is_available)
		 WHERE id = $1
		 RETURNING id, provider_id, model_id, display_name, COALESCE(description, ''),
		           COALESCE(brand, ''), COALESCE(capabilities, '{}'),
		           is_available, COALESCE(max_context_tokens, 0), COALESCE(max_output_tokens, 0),
		           COALESCE(input_price_per_million, 0), COALESCE(output_price_per_million, 0), created_at`,
		id, providerID, modelID, displayName, brand, capabilities, maxContextTokens, maxOutputTokens, inputPrice, outputPrice, isAvailable,
	).Scan(
		&m.ID, &m.ProviderID, &m.ModelID, &m.DisplayName, &m.Description,
		&m.Brand, &m.Capabilities,
		&m.IsAvailable, &m.MaxContextTokens, &m.MaxOutputTokens,
		&m.InputPricePerMillion, &m.OutputPricePerMillion, &m.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// DeleteModel 删除模型
func DeleteModel(ctx context.Context, id string) error {
	_, err := DB.Exec(ctx, `DELETE FROM models WHERE id = $1`, id)
	return err
}

