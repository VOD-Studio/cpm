package repository

import (
	"context"
	"fmt"

	"coding-plan-manager/backend/internal/model"
)

// GetUsageSummary 获取聚合用量统计
func GetUsageSummary(ctx context.Context, userID string, start, end string) (*model.UsageSummary, error) {
	// 获取该用户所有 key 的 ID 列表
	keyRows, err := DB.Query(ctx,
		`SELECT id FROM api_keys WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer keyRows.Close()
	var keyIDs []string
	for keyRows.Next() {
		var id string
		if err := keyRows.Scan(&id); err != nil {
			return nil, err
		}
		keyIDs = append(keyIDs, id)
	}
	if len(keyIDs) == 0 {
		return &model.UsageSummary{}, nil
	}

	var s model.UsageSummary
	query := `SELECT
		COALESCE(SUM(request_count), 0),
		COALESCE(SUM(input_tokens), 0),
		COALESCE(SUM(output_tokens), 0),
		COALESCE(SUM(total_tokens), 0),
		COALESCE(SUM(cost), 0),
		COALESCE(AVG(avg_response_time_ms), 0),
		COALESCE(SUM(error_count), 0)
	FROM usage_records
	WHERE api_key_id = ANY($1)`
	args := []interface{}{keyIDs}

	if start != "" && end != "" {
		query += ` AND period_start >= $2 AND period_end <= $3`
		args = append(args, start, end)
	}

	err = DB.QueryRow(ctx, query, args...).Scan(
		&s.TotalRequests, &s.TotalInputTokens, &s.TotalOutputTokens,
		&s.TotalTokens, &s.Cost, &s.AvgResponseTimeMs, &s.TotalErrors,
	)
	if err != nil {
		return nil, err
	}

	// 获取 key 数量统计
	err = DB.QueryRow(ctx,
		`SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active) FROM api_keys WHERE user_id = $1`,
		userID,
	).Scan(&s.KeyCount, &s.ActiveKeyCount)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

// GetUsageByModel 按模型聚合用量
func GetUsageByModel(ctx context.Context, userID string, start, end string) ([]model.UsageRecord, error) {
	query := `SELECT m.id, m.model_id, m.display_name,
	          SUM(r.request_count), SUM(r.input_tokens), SUM(r.output_tokens),
	          SUM(r.total_tokens), SUM(r.cost)
	          FROM usage_records r
	          JOIN models m ON r.model_id = m.id
	          JOIN api_keys k ON r.api_key_id = k.id
	          WHERE k.user_id = $1`
	args := []interface{}{userID}
	idx := 2
	if start != "" && end != "" {
		query += fmt.Sprintf(` AND r.period_start >= $%d AND r.period_end <= $%d`, idx, idx+1)
		args = append(args, start, end)
		idx += 2
	}
	query += ` GROUP BY m.id, m.model_id, m.display_name ORDER BY SUM(r.total_tokens) DESC`

	rows, err := DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.UsageRecord
	for rows.Next() {
		var r model.UsageRecord
		var m model.Model
		if err := rows.Scan(&m.ID, &m.ModelID, &m.DisplayName,
			&r.RequestCount, &r.InputTokens, &r.OutputTokens,
			&r.TotalTokens, &r.Cost,
		); err != nil {
			return nil, err
		}
		r.Model = &m
		list = append(list, r)
	}
	return list, nil
}

// GetUsageByProvider 按平台聚合用量
func GetUsageByProvider(ctx context.Context, userID string, start, end string) ([]map[string]any, error) {
	query := `SELECT p.id, p.name, p.slug,
	          SUM(r.request_count), SUM(r.input_tokens), SUM(r.output_tokens),
	          SUM(r.total_tokens), SUM(r.cost)
	          FROM usage_records r
	          JOIN api_keys k ON r.api_key_id = k.id
	          JOIN providers p ON k.provider_id = p.id
	          WHERE k.user_id = $1`
	args := []interface{}{userID}
	idx := 2
	if start != "" && end != "" {
		query += fmt.Sprintf(` AND r.period_start >= $%d AND r.period_end <= $%d`, idx, idx+1)
		args = append(args, start, end)
		idx += 2
	}
	query += ` GROUP BY p.id, p.name, p.slug ORDER BY SUM(r.total_tokens) DESC`

	rows, err := DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []map[string]any
	for rows.Next() {
		var id, name, slug string
		var reqCount int
		var inTok, outTok, totalTok int64
		var cost float64
		if err := rows.Scan(&id, &name, &slug, &reqCount, &inTok, &outTok, &totalTok, &cost); err != nil {
			return nil, err
		}
		list = append(list, map[string]any{
			"provider_id":   id,
			"provider_name": name,
			"provider_slug": slug,
			"request_count": reqCount,
			"input_tokens":  inTok,
			"output_tokens": outTok,
			"total_tokens":  totalTok,
			"cost":          cost,
		})
	}
	return list, nil
}

// GetUsageTrends 获取用量趋势数据
func GetUsageTrends(ctx context.Context, userID string, period, start, end string) ([]model.UsageRecord, error) {
	query := `SELECT r.period_start, r.period_end, r.period_type,
	          SUM(r.request_count), SUM(r.input_tokens), SUM(r.output_tokens),
	          SUM(r.total_tokens), SUM(r.cost)
	          FROM usage_records r
	          JOIN api_keys k ON r.api_key_id = k.id
	          WHERE k.user_id = $1`
	args := []interface{}{userID}
	idx := 2
	if start != "" && end != "" {
		query += fmt.Sprintf(` AND r.period_start >= $%d AND r.period_end <= $%d`, idx, idx+1)
		args = append(args, start, end)
		idx += 2
	}
	query += ` GROUP BY r.period_start, r.period_end, r.period_type ORDER BY r.period_start`

	rows, err := DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.UsageRecord
	for rows.Next() {
		var r model.UsageRecord
		if err := rows.Scan(&r.PeriodStart, &r.PeriodEnd, &r.PeriodType,
			&r.RequestCount, &r.InputTokens, &r.OutputTokens,
			&r.TotalTokens, &r.Cost,
		); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

// RecordUsage 写入一条用量记录
func RecordUsage(ctx context.Context, r *model.UsageRecord) error {
	_, err := DB.Exec(ctx,
		`INSERT INTO usage_records (api_key_id, model_id, request_count, input_tokens, output_tokens,
		 total_tokens, cost, avg_response_time_ms, error_count, period_type, period_start, period_end)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		r.ApiKeyID, r.ModelID, r.RequestCount, r.InputTokens, r.OutputTokens,
		r.TotalTokens, r.Cost, r.AvgResponseTimeMs, r.ErrorCount,
		r.PeriodType, r.PeriodStart, r.PeriodEnd,
	)
	return err
}
