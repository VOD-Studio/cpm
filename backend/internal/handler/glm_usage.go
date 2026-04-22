package handler

import (
	"encoding/json"
	"net/http"

	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// GlmUsageHandler GLM 用量查询处理器
type GlmUsageHandler struct {
	svc *service.GlmUsageService
}

// NewGlmUsageHandler 创建 GLM 用量查询处理器
func NewGlmUsageHandler(svc *service.GlmUsageService) *GlmUsageHandler {
	return &GlmUsageHandler{svc: svc}
}

// Query 查询 GLM Coding Plan 用量
func (h *GlmUsageHandler) Query(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BaseURL   string `json:"base_url"`
		AuthToken string `json:"auth_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if req.BaseURL == "" || req.AuthToken == "" {
		response.Error(w, http.StatusBadRequest, "invalid_request", "base_url 和 auth_token 不能为空")
		return
	}

	result, err := h.svc.QueryUsage(r.Context(), req.BaseURL, req.AuthToken)
	if err != nil {
		response.Error(w, http.StatusBadGateway, "query_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}
