package handler

import (
	"net/http"

	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// DashboardHandler 仪表盘处理器
type DashboardHandler struct {
	usageSvc *service.UsageService
}

// NewDashboardHandler 创建仪表盘处理器
func NewDashboardHandler(usageSvc *service.UsageService) *DashboardHandler {
	return &DashboardHandler{usageSvc: usageSvc}
}

// Summary 仪表盘汇总数据（用量统计 + 按平台/模型聚合）
func (h *DashboardHandler) Summary(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	summary, err := h.usageSvc.GetSummary(r.Context(), userID, "", "")
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "fetch_failed", "获取仪表盘数据失败")
		return
	}
	byModel, _ := h.usageSvc.GetByModel(r.Context(), userID, "", "")
	response.JSON(w, http.StatusOK, map[string]any{
		"summary":         summary,
		"usage_by_model":  byModel,
		"usage_by_provider": []any{},
	})
}
