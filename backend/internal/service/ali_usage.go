package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const aliUsageURL = "https://bailian-cs.console.aliyun.com/data/api.json?action=BroadScopeAspnGateway&product=sfm_bailian&api=zeldaEasy.broadscope-bailian.codingPlan.queryCodingPlanInstanceInfoV2"

// AliUsageService 阿里云用量查询服务
type AliUsageService struct{}

// NewAliUsageService 创建阿里云用量查询服务实例
func NewAliUsageService() *AliUsageService {
	return &AliUsageService{}
}

// AliUsageResult 阿里云用量查询结果
type AliUsageResult struct {
	InstanceInfo any `json:"instance_info"`
}

// QueryUsage 查询阿里云 Coding Plan 用量
func (s *AliUsageService) QueryUsage(ctx context.Context, cookie string) (*AliUsageResult, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", aliUsageURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Cookie", cookie)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]any
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	return &AliUsageResult{
		InstanceInfo: result,
	}, nil
}
