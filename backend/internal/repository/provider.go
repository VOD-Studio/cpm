package repository

import (
	"context"

	"coding-plan-manager/backend/internal/model"
)

// ListProviders 获取所有 AI 平台提供商
func ListProviders(ctx context.Context) ([]model.Provider, error) {
	rows, err := DB.Query(ctx,
		`SELECT id, name, slug, COALESCE(description, ''), COALESCE(logo_url, ''), created_at FROM providers ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.Provider
	for rows.Next() {
		var p model.Provider
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.LogoURL, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

// GetProviderByID 根据 ID 获取平台信息
func GetProviderByID(ctx context.Context, id string) (*model.Provider, error) {
	var p model.Provider
	err := DB.QueryRow(ctx,
		`SELECT id, name, slug, COALESCE(description, ''), COALESCE(logo_url, ''), created_at FROM providers WHERE id = $1`, id,
	).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.LogoURL, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// CreateProvider 创建新平台
func CreateProvider(ctx context.Context, name, slug, description string) (*model.Provider, error) {
	var p model.Provider
	err := DB.QueryRow(ctx,
		`INSERT INTO providers (name, slug, description) VALUES ($1, $2, $3)
		 RETURNING id, name, slug, COALESCE(description, ''), COALESCE(logo_url, ''), created_at`,
		name, slug, description,
	).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.LogoURL, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// UpdateProvider 更新平台信息
func UpdateProvider(ctx context.Context, id, name, slug, description string) (*model.Provider, error) {
	var p model.Provider
	err := DB.QueryRow(ctx,
		`UPDATE providers SET
		        name = COALESCE(NULLIF($2, ''), name),
		        slug = COALESCE(NULLIF($3, ''), slug),
		        description = $4
		 WHERE id = $1
		 RETURNING id, name, slug, COALESCE(description, ''), COALESCE(logo_url, ''), created_at`,
		id, name, slug, description,
	).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.LogoURL, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// DeleteProvider 删除平台
func DeleteProvider(ctx context.Context, id string) error {
	_, err := DB.Exec(ctx, `DELETE FROM providers WHERE id = $1`, id)
	return err
}
