package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// GlmUsageService GLM 用量查询服务
type GlmUsageService struct{}

// NewGlmUsageService 创建 GLM 用量查询服务实例
func NewGlmUsageService() *GlmUsageService {
	return &GlmUsageService{}
}

// GlmUsageResult GLM 用量查询结果
type GlmUsageResult struct {
	ModelUsage any `json:"model_usage"`
	ToolUsage  any `json:"tool_usage"`
	QuotaLimit any `json:"quota_limit"`
}

// QueryUsage 查询 GLM Coding Plan 用量
func (s *GlmUsageService) QueryUsage(ctx context.Context, baseURL, authToken string) (*GlmUsageResult, error) {
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return nil, fmt.Errorf("无效的 base URL: %w", err)
	}
	baseDomain := fmt.Sprintf("%s://%s", parsed.Scheme, parsed.Host)

	// 时间窗口：前一天当前小时 → 今天当前小时
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), now.Day()-1, now.Hour(), 0, 0, 0, now.Location())
	endDate := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), 59, 59, 0, now.Location())
	startTime := startDate.Format("2006-01-02 15:04:05")
	endTime := endDate.Format("2006-01-02 15:04:05")

	queryParams := fmt.Sprintf("?startTime=%s&endTime=%s",
		url.QueryEscape(startTime), url.QueryEscape(endTime))

	modelUsage, err := s.fetchGLMAPI(ctx, baseDomain+"/api/monitor/usage/model-usage"+queryParams, authToken)
	if err != nil {
		return nil, fmt.Errorf("查询模型用量失败: %w", err)
	}

	toolUsage, err := s.fetchGLMAPI(ctx, baseDomain+"/api/monitor/usage/tool-usage"+queryParams, authToken)
	if err != nil {
		return nil, fmt.Errorf("查询工具用量失败: %w", err)
	}

	quotaLimit, err := s.fetchGLMAPI(ctx, baseDomain+"/api/monitor/usage/quota/limit", authToken)
	if err != nil {
		return nil, fmt.Errorf("查询配额限制失败: %w", err)
	}

	return &GlmUsageResult{
		ModelUsage: modelUsage,
		ToolUsage:  toolUsage,
		QuotaLimit: processQuotaLimit(quotaLimit),
	}, nil
}

// fetchGLMAPI 调用 GLM 监控 API
func (s *GlmUsageService) fetchGLMAPI(ctx context.Context, apiURL, authToken string) (any, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", authToken)
	req.Header.Set("Accept-Language", "en-US,en")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]any
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if data, ok := result["data"]; ok {
		return data, nil
	}
	return result, nil
}

// processQuotaLimit 处理配额限制数据
func processQuotaLimit(data any) any {
	dataMap, ok := data.(map[string]any)
	if !ok {
		return data
	}
	limits, ok := dataMap["limits"].([]any)
	if !ok {
		return data
	}
	for i, item := range limits {
		limit, ok := item.(map[string]any)
		if !ok {
			continue
		}
		limitType, _ := limit["type"].(string)
		if limitType == "TOKENS_LIMIT" {
			// unit=3 → 5小时窗口，unit=6 → 每周窗口
			unit, _ := limit["unit"].(float64)
			if unit == 6 {
				limit["type"] = "Token usage (Weekly)"
			} else {
				limit["type"] = "Token usage (5 Hour)"
			}
		} else if limitType == "TIME_LIMIT" {
			limit["type"] = "MCP usage (1 Month)"
		}
		limits[i] = limit
	}
	dataMap["limits"] = limits
	return dataMap
}
