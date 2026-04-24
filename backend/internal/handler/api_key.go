package handler

import (
	"encoding/json"
	"net/http"

	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// ApiKeyHandler API Key 管理处理器
type ApiKeyHandler struct {
	keySvc *service.ApiKeyService
}

// NewApiKeyHandler 创建 API Key 处理器
func NewApiKeyHandler(keySvc *service.ApiKeyService) *ApiKeyHandler {
	return &ApiKeyHandler{keySvc: keySvc}
}

// List 获取用户所有 API Key
func (h *ApiKeyHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	keys, err := h.keySvc.List(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "fetch_failed", "获取 API Key 列表失败")
		return
	}
	response.JSON(w, http.StatusOK, keys)
}

// Create 创建新 API Key（支持多个 Base URL 和模型关联）
func (h *ApiKeyHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	var req struct {
		ProviderID string   `json:"provider_id"`
		Name       string   `json:"name"`
		Key        string   `json:"key"`
		BaseURLs   any      `json:"base_urls"`
		PlanType   string   `json:"plan_type"`
		ModelIDs   []string `json:"model_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if req.ProviderID == "" || req.Name == "" || req.Key == "" {
		response.Error(w, http.StatusBadRequest, "invalid_request", "平台、名称和 Key 不能为空")
		return
	}
	// 将 base_urls 序列化为 JSON 字符串
	baseURLsJSON := "[]"
	if req.BaseURLs != nil {
		b, err := json.Marshal(req.BaseURLs)
		if err == nil {
			baseURLsJSON = string(b)
		}
	}
	key, err := h.keySvc.Create(r.Context(), userID, req.ProviderID, req.Name, req.Key, baseURLsJSON, req.PlanType, req.ModelIDs)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "create_failed", "创建 API Key 失败")
		return
	}
	response.JSON(w, http.StatusCreated, key)
}

// Update 更新 API Key 信息
func (h *ApiKeyHandler) Update(w http.ResponseWriter, r *http.Request, id string) {
	userID := r.Header.Get("X-User-ID")
	var req struct {
		Name       string   `json:"name"`
		Key        string   `json:"key"`
		BaseURLs   any      `json:"base_urls"`
		PlanType   string   `json:"plan_type"`
		IsActive   *bool    `json:"is_active"`
		ModelIDs   []string `json:"model_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	// 将 base_urls 序列化为 JSON 字符串
	baseURLsJSON := ""
	if req.BaseURLs != nil {
		b, err := json.Marshal(req.BaseURLs)
		if err == nil {
			baseURLsJSON = string(b)
		}
	}
	key, err := h.keySvc.Update(r.Context(), id, userID, req.Name, req.Key, baseURLsJSON, req.PlanType, req.IsActive, req.ModelIDs)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "update_failed", "更新 API Key 失败")
		return
	}
	response.JSON(w, http.StatusOK, key)
}

// Delete 删除 API Key
func (h *ApiKeyHandler) Delete(w http.ResponseWriter, r *http.Request, id string) {
	userID := r.Header.Get("X-User-ID")
	if err := h.keySvc.Delete(r.Context(), id, userID); err != nil {
		response.Error(w, http.StatusInternalServerError, "delete_failed", "删除 API Key 失败")
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"message": "已删除"})
}

// Test 测试 API Key 连通性
func (h *ApiKeyHandler) Test(w http.ResponseWriter, r *http.Request, id string) {
	userID := r.Header.Get("X-User-ID")
	status, err := h.keySvc.Test(r.Context(), id, userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "test_failed", "测试失败")
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"status": status})
}

// Decrypt 获取 API Key 原文（解密后返回，供前端查看/复制）
func (h *ApiKeyHandler) Decrypt(w http.ResponseWriter, r *http.Request, id string) {
	userID := r.Header.Get("X-User-ID")
	plain, err := h.keySvc.Decrypt(r.Context(), id, userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "not_found", "Key 不存在或解密失败")
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"key": plain})
}

// GetShares 获取 Key 的共享用户列表
func (h *ApiKeyHandler) GetShares(w http.ResponseWriter, r *http.Request, id string) {
	userID := r.Header.Get("X-User-ID")
	users, err := h.keySvc.GetKeyShares(r.Context(), id, userID)
	if err != nil {
		response.Error(w, http.StatusForbidden, "forbidden", err.Error())
		return
	}
	if users == nil {
		users = []model.User{}
	}
	response.JSON(w, http.StatusOK, users)
}

// SetShares 设置 Key 共享给哪些用户
func (h *ApiKeyHandler) SetShares(w http.ResponseWriter, r *http.Request, id string) {
	userID := r.Header.Get("X-User-ID")
	var req struct {
		UserIDs []string `json:"user_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if err := h.keySvc.SetKeyShares(r.Context(), id, userID, req.UserIDs); err != nil {
		response.Error(w, http.StatusForbidden, "forbidden", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"message": "共享设置已更新"})
}
