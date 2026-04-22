package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	volcengineAddr   = "https://open.volcengineapi.com"
	volcenginePath   = "/"
	volcengineService = "ark"
	volcengineRegion  = "cn-beijing"
	volcengineVersion = "2024-01-01"
)

// VolcengineUsageService 火山引擎用量查询服务
type VolcengineUsageService struct{}

// NewVolcengineUsageService 创建火山引擎用量查询服务实例
func NewVolcengineUsageService() *VolcengineUsageService {
	return &VolcengineUsageService{}
}

// VolcengineUsageResult 火山引擎用量查询结果
type VolcengineUsageResult struct {
	SeatUsages any `json:"seat_usages"`
}

// QueryUsage 查询火山引擎 Coding Plan 用量
func (s *VolcengineUsageService) QueryUsage(ctx context.Context, ak, sk string) (*VolcengineUsageResult, error) {
	// 调用 ListSeatInfoUsages 获取所有 seat 用量
	result, err := s.callVolcengineAPI(ctx, ak, sk, "ListSeatInfoUsages", map[string]any{
		"ProjectName": "default",
	})
	if err != nil {
		return nil, fmt.Errorf("查询 seat 用量失败: %w", err)
	}

	return &VolcengineUsageResult{
		SeatUsages: result,
	}, nil
}

// callVolcengineAPI 调用火山引擎 ARK API（带 HMAC-SHA256 签名）
func (s *VolcengineUsageService) callVolcengineAPI(ctx context.Context, ak, sk, action string, body map[string]any) (any, error) {
	// 构建 query 参数
	queries := url.Values{}
	queries.Set("Action", action)
	queries.Set("Version", volcengineVersion)

	// 序列化 body
	var bodyBytes []byte
	if body != nil {
		var err error
		bodyBytes, err = json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("序列化请求体失败: %w", err)
		}
	} else {
		bodyBytes = []byte("{}")
	}

	// 构建完整 URL
	requestURL := fmt.Sprintf("%s%s?%s", volcengineAddr, volcenginePath, queries.Encode())

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "POST", requestURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// HMAC-SHA256 签名
	if err := signRequest(req, ak, sk, volcengineService, volcengineRegion); err != nil {
		return nil, fmt.Errorf("签名失败: %w", err)
	}

	// 发送请求
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	return result, nil
}

// ===== HMAC-SHA256 签名工具函数 =====
// 参考火山引擎官方 Go 签名示例: volcengine/volc-openapi-demos/signature/golang/sign.go

func hmacSHA256(key []byte, content string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(content))
	return mac.Sum(nil)
}

func getSignedKey(secretKey, date, region, service string) []byte {
	kDate := hmacSHA256([]byte(secretKey), date)
	kRegion := hmacSHA256(kDate, region)
	kService := hmacSHA256(kRegion, service)
	kSigning := hmacSHA256(kService, "request")
	return kSigning
}

func hashSHA256(data []byte) []byte {
	h := sha256.New()
	h.Write(data)
	return h.Sum(nil)
}

// signRequest 对 HTTP 请求进行 HMAC-SHA256 签名
func signRequest(req *http.Request, ak, sk, service, region string) error {
	now := time.Now().UTC()
	date := now.Format("20060102T150405Z")
	authDate := date[:8]

	// 设置必要的 headers
	req.Header.Set("X-Date", date)
	req.Header.Set("Content-Type", "application/json")

	// 计算 payload hash
	bodyBytes, _ := io.ReadAll(req.Body)
	req.Body.Close()
	req.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	payload := hex.EncodeToString(hashSHA256(bodyBytes))
	req.Header.Set("X-Content-Sha256", payload)

	// 构建 canonical query string
	queryString := req.URL.RawQuery
	// 替换 + 为 %20
	queryString = strings.ReplaceAll(queryString, "+", "%20")

	// Signed headers
	signedHeaders := []string{"content-type", "host", "x-content-sha256", "x-date"}

	var headerList []string
	for _, header := range signedHeaders {
		if header == "host" {
			headerList = append(headerList, header+":"+req.URL.Host)
		} else {
			v := req.Header.Get(header)
			headerList = append(headerList, header+":"+strings.TrimSpace(v))
		}
	}
	headerString := strings.Join(headerList, "\n")

	// 构建 Canonical Request
	canonicalString := strings.Join([]string{
		req.Method,
		volcenginePath,
		queryString,
		headerString + "\n",
		strings.Join(signedHeaders, ";"),
		payload,
	}, "\n")

	hashedCanonicalString := hex.EncodeToString(hashSHA256([]byte(canonicalString)))

	// 构建 Credential Scope
	credentialScope := authDate + "/" + region + "/" + service + "/request"

	// 构建 String to Sign
	signString := strings.Join([]string{
		"HMAC-SHA256",
		date,
		credentialScope,
		hashedCanonicalString,
	}, "\n")

	// 计算签名
	signedKey := getSignedKey(sk, authDate, region, service)
	signature := hex.EncodeToString(hmacSHA256(signedKey, signString))

	// 构建 Authorization 头
	authorization := "HMAC-SHA256" +
		" Credential=" + ak + "/" + credentialScope +
		", SignedHeaders=" + strings.Join(signedHeaders, ";") +
		", Signature=" + signature

	req.Header.Set("Authorization", authorization)

	return nil
}
