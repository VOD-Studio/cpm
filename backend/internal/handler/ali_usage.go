package handler

import (
	"encoding/json"
	"net/http"

	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// AliUsageHandler 阿里云用量查询处理器
type AliUsageHandler struct {
	svc *service.AliUsageService
}

// NewAliUsageHandler 创建阿里云用量查询处理器
func NewAliUsageHandler(svc *service.AliUsageService) *AliUsageHandler {
	return &AliUsageHandler{svc: svc}
}

// Query 查询阿里云 Coding Plan 用量
func (h *AliUsageHandler) Query(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Cookie string `json:"cookie"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if req.Cookie == "" {
		response.Error(w, http.StatusBadRequest, "invalid_request", "cookie 不能为空")
		return
	}

	result, err := h.svc.QueryUsage(r.Context(), req.Cookie)
	if err != nil {
		response.Error(w, http.StatusBadGateway, "query_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}
