package handler

import (
	"encoding/json"
	"net/http"

	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// UserAdminHandler 用户管理处理器
type UserAdminHandler struct {
	userAdminSvc *service.UserAdminService
}

// NewUserAdminHandler 创建用户管理处理器
func NewUserAdminHandler(userAdminSvc *service.UserAdminService) *UserAdminHandler {
	return &UserAdminHandler{userAdminSvc: userAdminSvc}
}

// ListUsers 查询所有用户
func (h *UserAdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userAdminSvc.ListUsers(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "list_failed", "查询用户列表失败")
		return
	}
	response.JSON(w, http.StatusOK, users)
}

// CreateUser 创建用户
func (h *UserAdminHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	user, err := h.userAdminSvc.CreateUser(r.Context(), req.Username, req.Email, req.Password)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "create_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, user)
}

// UpdateUser 更新用户信息
func (h *UserAdminHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if err := h.userAdminSvc.UpdateUser(r.Context(), id, req.Username, req.Email); err != nil {
		response.Error(w, http.StatusBadRequest, "update_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"message": "更新成功"})
}

// DeleteUser 删除用户
func (h *UserAdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	operatorID := r.Header.Get("X-User-ID")
	if err := h.userAdminSvc.DeleteUser(r.Context(), id, operatorID); err != nil {
		response.Error(w, http.StatusForbidden, "delete_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"message": "已删除"})
}

// SetActive 设置用户启用/禁用状态
func (h *UserAdminHandler) SetActive(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if err := h.userAdminSvc.SetUserActive(r.Context(), id, req.IsActive); err != nil {
		response.Error(w, http.StatusInternalServerError, "update_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"message": "状态已更新"})
}

// AssignRoles 为用户分配角色
func (h *UserAdminHandler) AssignRoles(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req struct {
		RoleIDs []string `json:"role_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if err := h.userAdminSvc.AssignRoles(r.Context(), id, req.RoleIDs); err != nil {
		response.Error(w, http.StatusBadRequest, "assign_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"message": "角色分配成功"})
}
