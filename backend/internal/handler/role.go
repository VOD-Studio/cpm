package handler

import (
	"encoding/json"
	"net/http"

	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// RoleHandler 角色管理处理器
type RoleHandler struct {
	roleSvc *service.RoleService
}

// NewRoleHandler 创建角色管理处理器
func NewRoleHandler(roleSvc *service.RoleService) *RoleHandler {
	return &RoleHandler{roleSvc: roleSvc}
}

// List 查询所有角色
func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	roles, err := h.roleSvc.List(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "list_failed", "查询角色列表失败")
		return
	}
	response.JSON(w, http.StatusOK, roles)
}

// Create 创建角色
func (h *RoleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string   `json:"name"`
		DisplayName string   `json:"display_name"`
		Description string   `json:"description"`
		Permissions []string `json:"permissions"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if req.Name == "" || req.DisplayName == "" {
		response.Error(w, http.StatusBadRequest, "invalid_request", "角色名称和显示名称不能为空")
		return
	}
	role, err := h.roleSvc.Create(r.Context(), req.Name, req.DisplayName, req.Description, req.Permissions)
	if err != nil {
		response.Error(w, http.StatusConflict, "create_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, role)
}

// Update 更新角色
func (h *RoleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req struct {
		DisplayName string   `json:"display_name"`
		Description string   `json:"description"`
		Permissions []string `json:"permissions"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	role, err := h.roleSvc.Update(r.Context(), id, req.DisplayName, req.Description, req.Permissions)
	if err != nil {
		response.Error(w, http.StatusForbidden, "update_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, role)
}

// Delete 删除角色
func (h *RoleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.roleSvc.Delete(r.Context(), id); err != nil {
		response.Error(w, http.StatusForbidden, "delete_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"message": "已删除"})
}
