package handler

import (
	"encoding/json"
	"net/http"

	"coding-plan-manager/backend/internal/repository"
	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
)

// AuthHandler 认证相关处理器
type AuthHandler struct {
	authSvc *service.AuthService
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

// Register 用户注册接口
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	if req.Username == "" || req.Email == "" || req.Password == "" {
		response.Error(w, http.StatusBadRequest, "invalid_request", "用户名、邮箱和密码不能为空")
		return
	}
	if len(req.Password) < 8 {
		response.Error(w, http.StatusBadRequest, "invalid_request", "密码至少 8 位")
		return
	}
	accessToken, refreshToken, user, err := h.authSvc.Register(r.Context(), req.Username, req.Email, req.Password)
	if err != nil {
		response.Error(w, http.StatusConflict, "register_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, map[string]any{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
	})
}

// Login 用户登录接口
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	accessToken, refreshToken, user, err := h.authSvc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "login_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
	})
}

// Refresh 刷新 Token 接口
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
		return
	}
	access, refresh, err := h.authSvc.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "refresh_failed", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"access_token":  access,
		"refresh_token": refresh,
	})
}

// Logout 退出登录（客户端清除 token 即可）
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]any{"message": "已退出登录"})
}

// Me 获取当前用户信息（含权限）
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	user, err := h.authSvc.GetUser(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "user_not_found", "用户不存在")
		return
	}
	// 查询用户权限
	perms, _ := repository.GetUserPermissions(r.Context(), userID)
	if perms == nil {
		perms = []string{}
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"id":          user.ID,
		"username":    user.Username,
		"email":       user.Email,
		"role":        user.Role,
		"is_active":   user.IsActive,
		"permissions": perms,
		"created_at":  user.CreatedAt,
		"updated_at":  user.UpdatedAt,
	})
}
