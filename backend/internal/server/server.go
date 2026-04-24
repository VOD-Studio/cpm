package server

import (
	"coding-plan-manager/backend/internal/config"
	"coding-plan-manager/backend/internal/handler"
	"coding-plan-manager/backend/internal/middleware"
	"coding-plan-manager/backend/internal/service"
	"coding-plan-manager/backend/pkg/response"
	"encoding/json"
	"net/http"
)

// Server 封装 HTTP 服务器和路由
type Server struct {
	cfg    *config.Config
	router *http.ServeMux
}

// New 创建 HTTP 服务器，初始化路由
func New(cfg *config.Config) *Server {
	s := &Server{
		cfg:    cfg,
		router: http.NewServeMux(),
	}
	s.setupRoutes()
	return s
}

// setupRoutes 注册所有 API 路由
func (s *Server) setupRoutes() {
	// 初始化服务层
	authSvc := service.NewAuthService(s.cfg)
	keySvc := service.NewApiKeyService(s.cfg)
	modelSvc := service.NewModelService()
	usageSvc := service.NewUsageService()

	// 初始化处理器
	authH := handler.NewAuthHandler(authSvc)
	keyH := handler.NewApiKeyHandler(keySvc)
	usageH := handler.NewUsageHandler(usageSvc)
	dashH := handler.NewDashboardHandler(usageSvc)
	glmUsageH := handler.NewGlmUsageHandler(service.NewGlmUsageService())
	volcengineUsageH := handler.NewVolcengineUsageHandler(service.NewVolcengineUsageService())
	aliUsageH := handler.NewAliUsageHandler(service.NewAliUsageService())

	// 用户管理与角色管理
	userAdminSvc := service.NewUserAdminService()
	roleSvc := service.NewRoleService()
	userAdminH := handler.NewUserAdminHandler(userAdminSvc)
	roleH := handler.NewRoleHandler(roleSvc)

	// 公开路由（无需鉴权）
	s.router.HandleFunc("POST /api/v1/auth/register", authH.Register)
	s.router.HandleFunc("POST /api/v1/auth/login", authH.Login)
	s.router.HandleFunc("POST /api/v1/auth/refresh", authH.Refresh)
	s.router.HandleFunc("POST /api/v1/auth/logout", authH.Logout)

	// 受保护路由（需鉴权）
	s.router.HandleFunc("GET /api/v1/auth/me", middleware.Auth(s.cfg, authH.Me))

	// API Key 管理（需要 keys 权限）
	s.router.HandleFunc("GET /api/v1/keys", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:read", keyH.List)))
	s.router.HandleFunc("POST /api/v1/keys", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:write", keyH.Create)))
	s.router.HandleFunc("PUT /api/v1/keys/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:write", func(w http.ResponseWriter, r *http.Request) {
		keyH.Update(w, r, r.PathValue("id"))
	})))
	s.router.HandleFunc("DELETE /api/v1/keys/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:delete", func(w http.ResponseWriter, r *http.Request) {
		keyH.Delete(w, r, r.PathValue("id"))
	})))
	s.router.HandleFunc("POST /api/v1/keys/{id}/test", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:read", func(w http.ResponseWriter, r *http.Request) {
		keyH.Test(w, r, r.PathValue("id"))
	})))
	s.router.HandleFunc("GET /api/v1/keys/{id}/decrypt", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:read", func(w http.ResponseWriter, r *http.Request) {
		keyH.Decrypt(w, r, r.PathValue("id"))
	})))

	// API Key 共享管理
	s.router.HandleFunc("GET /api/v1/keys/{id}/shares", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:write", func(w http.ResponseWriter, r *http.Request) {
		keyH.GetShares(w, r, r.PathValue("id"))
	})))
	s.router.HandleFunc("PUT /api/v1/keys/{id}/shares", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "keys:write", func(w http.ResponseWriter, r *http.Request) {
		keyH.SetShares(w, r, r.PathValue("id"))
	})))

	s.router.HandleFunc("GET /api/v1/models", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		list, err := modelSvc.List(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		writeJSON(w, list)
	}))
	s.router.HandleFunc("GET /api/v1/providers/{id}/models", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		list, err := modelSvc.ListByProvider(r.Context(), r.PathValue("id"))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		writeJSON(w, list)
	}))

	s.router.HandleFunc("GET /api/v1/providers", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		provSvc := service.NewProviderService()
		list, err := provSvc.List(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		writeJSON(w, list)
	}))

	s.router.HandleFunc("GET /api/v1/usage", middleware.Auth(s.cfg, usageH.Summary))
	s.router.HandleFunc("GET /api/v1/usage/by-model", middleware.Auth(s.cfg, usageH.ByModel))
	s.router.HandleFunc("GET /api/v1/usage/by-provider", middleware.Auth(s.cfg, usageH.ByProvider))
	s.router.HandleFunc("GET /api/v1/usage/trends", middleware.Auth(s.cfg, usageH.Trends))
	s.router.HandleFunc("GET /api/v1/dashboard/summary", middleware.Auth(s.cfg, dashH.Summary))

	// GLM 用量查询（后端代理）
	s.router.HandleFunc("POST /api/v1/glm/usage", middleware.Auth(s.cfg, glmUsageH.Query))

	// 火山引擎用量查询（后端代理）
	s.router.HandleFunc("POST /api/v1/volcengine/usage", middleware.Auth(s.cfg, volcengineUsageH.Query))

	// 阿里云用量查询（后端代理）
	s.router.HandleFunc("POST /api/v1/ali/usage", middleware.Auth(s.cfg, aliUsageH.Query))

	// 模型管理
	s.router.HandleFunc("POST /api/v1/models", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "models:write", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ProviderID       string   `json:"provider_id"`
			ModelID          string   `json:"model_id"`
			DisplayName      string   `json:"display_name"`
			Brand            string   `json:"brand"`
			Capabilities     []string `json:"capabilities"`
			MaxContextTokens int      `json:"max_context_tokens"`
			MaxOutputTokens  int      `json:"max_output_tokens"`
			InputPrice       float64  `json:"input_price_per_million"`
			OutputPrice      float64  `json:"output_price_per_million"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
			return
		}
		if req.ProviderID == "" || req.ModelID == "" || req.DisplayName == "" {
			response.Error(w, http.StatusBadRequest, "invalid_request", "平台、模型ID和显示名称不能为空")
			return
		}
		m, err := modelSvc.Create(r.Context(), req.ProviderID, req.ModelID, req.DisplayName, req.Brand, req.Capabilities, req.MaxContextTokens, req.MaxOutputTokens, req.InputPrice, req.OutputPrice)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "create_failed", "创建模型失败")
			return
		}
		response.JSON(w, http.StatusCreated, m)
	})))

	// 更新模型
	s.router.HandleFunc("PUT /api/v1/models/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "models:write", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ProviderID       string   `json:"provider_id"`
			ModelID          string   `json:"model_id"`
			DisplayName      string   `json:"display_name"`
			Brand            string   `json:"brand"`
			Capabilities     []string `json:"capabilities"`
			MaxContextTokens int      `json:"max_context_tokens"`
			MaxOutputTokens  int      `json:"max_output_tokens"`
			InputPrice       float64  `json:"input_price_per_million"`
			OutputPrice      float64  `json:"output_price_per_million"`
			IsAvailable      *bool    `json:"is_available"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
			return
		}
		m, err := modelSvc.Update(r.Context(), r.PathValue("id"), req.ProviderID, req.ModelID, req.DisplayName, req.Brand, req.Capabilities, req.MaxContextTokens, req.MaxOutputTokens, req.InputPrice, req.OutputPrice, req.IsAvailable)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "update_failed", "更新模型失败")
			return
		}
		response.JSON(w, http.StatusOK, m)
	})))

	// 删除模型
	s.router.HandleFunc("DELETE /api/v1/models/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "models:delete", func(w http.ResponseWriter, r *http.Request) {
		if err := modelSvc.Delete(r.Context(), r.PathValue("id")); err != nil {
			response.Error(w, http.StatusInternalServerError, "delete_failed", "删除模型失败")
			return
		}
		response.JSON(w, http.StatusOK, map[string]any{"message": "已删除"})
	})))

	// 平台管理
	s.router.HandleFunc("POST /api/v1/providers", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "providers:write", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name        string `json:"name"`
			Slug        string `json:"slug"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
			return
		}
		if req.Name == "" || req.Slug == "" {
			response.Error(w, http.StatusBadRequest, "invalid_request", "名称和标识不能为空")
			return
		}
		provSvc := service.NewProviderService()
		p, err := provSvc.Create(r.Context(), req.Name, req.Slug, req.Description)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "create_failed", "创建平台失败")
			return
		}
		response.JSON(w, http.StatusCreated, p)
	})))

	// 更新平台
	s.router.HandleFunc("PUT /api/v1/providers/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "providers:write", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name        string `json:"name"`
			Slug        string `json:"slug"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "invalid_request", "请求参数错误")
			return
		}
		provSvc := service.NewProviderService()
		p, err := provSvc.Update(r.Context(), r.PathValue("id"), req.Name, req.Slug, req.Description)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "update_failed", "更新平台失败")
			return
		}
		response.JSON(w, http.StatusOK, p)
	})))

	// 删除平台
	s.router.HandleFunc("DELETE /api/v1/providers/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "providers:delete", func(w http.ResponseWriter, r *http.Request) {
		provSvc := service.NewProviderService()
		if err := provSvc.Delete(r.Context(), r.PathValue("id")); err != nil {
			response.Error(w, http.StatusInternalServerError, "delete_failed", "删除平台失败，可能存在关联的模型或 API Key")
			return
		}
		response.JSON(w, http.StatusOK, map[string]any{"message": "已删除"})
	})))

	// ===== 用户管理路由（需要权限） =====
	s.router.HandleFunc("GET /api/v1/users", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "users:read", userAdminH.ListUsers)))
	s.router.HandleFunc("POST /api/v1/users", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "users:write", userAdminH.CreateUser)))
	s.router.HandleFunc("PUT /api/v1/users/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "users:write", userAdminH.UpdateUser)))
	s.router.HandleFunc("DELETE /api/v1/users/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "users:delete", userAdminH.DeleteUser)))
	s.router.HandleFunc("PUT /api/v1/users/{id}/active", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "users:write", userAdminH.SetActive)))
	s.router.HandleFunc("PUT /api/v1/users/{id}/roles", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "users:write", userAdminH.AssignRoles)))

	// ===== 角色管理路由（需要权限） =====
	s.router.HandleFunc("GET /api/v1/roles", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "roles:read", roleH.List)))
	s.router.HandleFunc("POST /api/v1/roles", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "roles:write", roleH.Create)))
	s.router.HandleFunc("PUT /api/v1/roles/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "roles:write", roleH.Update)))
	s.router.HandleFunc("DELETE /api/v1/roles/{id}", middleware.Auth(s.cfg, middleware.RequirePermission(s.cfg, "roles:delete", roleH.Delete)))
}

// Handler 返回带有 CORS 中间件的 http.Handler
func (s *Server) Handler() http.Handler {
	return middleware.CORS(s.router)
}
