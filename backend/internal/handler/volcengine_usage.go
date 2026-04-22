package handler

import (
	"encoding/json"
	"net/http"

	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// VolcengineUsageHandler 火山引擎用量查询处理器
type VolcengineUsageHandler struct {
	svc *service.VolcengineUsageService
}

// NewVolcengineUsageHandler 创建火山引擎用量查询处理器
func NewVolcengineUsageHandler(svc *service.VolcengineUsageService) *VolcengineUsageHandler {
	return &VolcengineUsageHandler{svc: svc}
}

// Query 查询火山引擎 Coding Plan 用量
func (h *VolcengineUsageHandler) Query(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AK string `json:"ak"`
		SK string `json:"sk"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if req.AK == "" || req.SK == "" {
		response.Error(w, http.StatusBadRequest, "invalid_request", "ak 和 sk 不能为空")
		return
	}

	result, err := h.svc.QueryUsage(r.Context(), req.AK, req.SK)
	if err != nil {
		response.Error(w, http.StatusBadGateway, "query_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}
