package handler

import (
	"net/http"

	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// UsageHandler 用量统计处理器
type UsageHandler struct {
	usageSvc *service.UsageService
}

// NewUsageHandler 创建用量统计处理器
func NewUsageHandler(usageSvc *service.UsageService) *UsageHandler {
	return &UsageHandler{usageSvc: usageSvc}
}

// Summary 获取用量汇总
func (h *UsageHandler) Summary(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	summary, err := h.usageSvc.GetSummary(r.Context(), userID, start, end)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "fetch_failed", "获取用量统计失败")
		return
	}
	response.JSON(w, http.StatusOK, summary)
}

// ByModel 按模型聚合用量
func (h *UsageHandler) ByModel(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	records, err := h.usageSvc.GetByModel(r.Context(), userID, start, end)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "fetch_failed", "获取模型用量失败")
		return
	}
	response.JSON(w, http.StatusOK, records)
}

// ByProvider 按平台聚合用量
func (h *UsageHandler) ByProvider(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	records, err := h.usageSvc.GetByProvider(r.Context(), userID, start, end)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "fetch_failed", "获取平台用量失败")
		return
	}
	response.JSON(w, http.StatusOK, records)
}

// Trends 获取用量趋势
func (h *UsageHandler) Trends(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	period := r.URL.Query().Get("period")
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	records, err := h.usageSvc.GetTrends(r.Context(), userID, period, start, end)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "fetch_failed", "获取趋势数据失败")
		return
	}
	response.JSON(w, http.StatusOK, records)
}
