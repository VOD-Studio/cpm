package model

import "time"

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Provider struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	LogoURL     string    `json:"logo_url"`
	CreatedAt   time.Time `json:"created_at"`
}

type ApiKey struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	ProviderID   string     `json:"provider_id"`
	Provider     *Provider  `json:"provider,omitempty"`
	Name         string     `json:"name"`
	KeyEncrypted string     `json:"-"`
	BaseURL      string     `json:"base_url"`        // 旧字段，保留兼容
	BaseURLs     string     `json:"base_urls"`       // JSON 格式的 BaseUrlEntry 数组
	PlanType     string     `json:"plan_type"`
	IsActive     bool       `json:"is_active"`
	LastTestedAt *time.Time `json:"last_tested_at"`
	LastStatus   *string    `json:"last_status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	AvailableModels []Model    `json:"available_models,omitempty"`
}

type Model struct {
	ID                    string    `json:"id"`
	ProviderID            string    `json:"provider_id"`
	Provider              *Provider `json:"provider,omitempty"`
	ModelID               string    `json:"model_id"`
	DisplayName           string    `json:"display_name"`
	Description           string    `json:"description"`
	Brand                 string    `json:"brand"`                        // 品牌：千问、智谱、Kimi、MiniMax 等
	Capabilities          []string  `json:"capabilities"`                 // 能力：文本生成、深度思考、视觉理解
	IsAvailable           bool      `json:"is_available"`
	MaxContextTokens      int       `json:"max_context_tokens"`
	MaxOutputTokens       int       `json:"max_output_tokens"`
	InputPricePerMillion  float64   `json:"input_price_per_million"`
	OutputPricePerMillion float64   `json:"output_price_per_million"`
	CreatedAt             time.Time `json:"created_at"`
}

// UsageSummary 用量统计汇总
type UsageSummary struct {
	TotalRequests      int     `json:"total_requests"`
	TotalInputTokens   int64   `json:"total_input_tokens"`
	TotalOutputTokens  int64   `json:"total_output_tokens"`
	TotalTokens        int64   `json:"total_tokens"`
	Cost               float64 `json:"total_cost"`
	AvgResponseTimeMs  int     `json:"avg_response_time_ms"`
	TotalErrors        int     `json:"total_errors"`
	KeyCount           int     `json:"key_count"`
	ActiveKeyCount     int     `json:"active_key_count"`
}

type UsageRecord struct {
	ID                  string    `json:"id"`
	ApiKeyID            string    `json:"api_key_id"`
	ModelID             string    `json:"model_id"`
	Model               *Model    `json:"model,omitempty"`
	ApiKey              *ApiKey   `json:"api_key,omitempty"`
	RequestCount        int       `json:"request_count"`
	InputTokens         int64     `json:"input_tokens"`
	OutputTokens        int64     `json:"output_tokens"`
	TotalTokens         int64     `json:"total_tokens"`
	Cost                float64   `json:"cost"`
	AvgResponseTimeMs   int       `json:"avg_response_time_ms"`
	ErrorCount          int       `json:"error_count"`
	PeriodType          string    `json:"period_type"`
	PeriodStart         time.Time `json:"period_start"`
	PeriodEnd           time.Time `json:"period_end"`
	CreatedAt           time.Time `json:"created_at"`
}
