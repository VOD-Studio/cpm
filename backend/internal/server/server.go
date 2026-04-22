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

	// 公开路由（无需鉴权）
	s.router.HandleFunc("POST /api/v1/auth/register", authH.Register)
	s.router.HandleFunc("POST /api/v1/auth/login", authH.Login)
	s.router.HandleFunc("POST /api/v1/auth/refresh", authH.Refresh)
	s.router.HandleFunc("POST /api/v1/auth/logout", authH.Logout)

	// 受保护路由（需鉴权）
	s.router.HandleFunc("GET /api/v1/auth/me", middleware.Auth(s.cfg, authH.Me))
	s.router.HandleFunc("GET /api/v1/keys", middleware.Auth(s.cfg, keyH.List))
	s.router.HandleFunc("POST /api/v1/keys", middleware.Auth(s.cfg, keyH.Create))
	s.router.HandleFunc("PUT /api/v1/keys/{id}", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		keyH.Update(w, r, r.PathValue("id"))
	}))
	s.router.HandleFunc("DELETE /api/v1/keys/{id}", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		keyH.Delete(w, r, r.PathValue("id"))
	}))
	s.router.HandleFunc("POST /api/v1/keys/{id}/test", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		keyH.Test(w, r, r.PathValue("id"))
	}))
	s.router.HandleFunc("GET /api/v1/keys/{id}/decrypt", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		keyH.Decrypt(w, r, r.PathValue("id"))
	}))

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

	// 模型管理（管理员添加模型）
	s.router.HandleFunc("POST /api/v1/models", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		role := r.Header.Get("X-Role")
		if role != "admin" {
			response.Error(w, http.StatusForbidden, "forbidden", "仅管理员可添加模型")
			return
		}
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
	}))

	// 更新模型
	s.router.HandleFunc("PUT /api/v1/models/{id}", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
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
	}))

	// 删除模型
	s.router.HandleFunc("DELETE /api/v1/models/{id}", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		if err := modelSvc.Delete(r.Context(), r.PathValue("id")); err != nil {
			response.Error(w, http.StatusInternalServerError, "delete_failed", "删除模型失败")
			return
		}
		response.JSON(w, http.StatusOK, map[string]any{"message": "已删除"})
	}))

	// 平台管理（添加自定义平台，如 Ali、火山、GLM 等）
	s.router.HandleFunc("POST /api/v1/providers", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
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
	}))

	// 更新平台
	s.router.HandleFunc("PUT /api/v1/providers/{id}", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
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
	}))

	// 删除平台
	s.router.HandleFunc("DELETE /api/v1/providers/{id}", middleware.Auth(s.cfg, func(w http.ResponseWriter, r *http.Request) {
		provSvc := service.NewProviderService()
		if err := provSvc.Delete(r.Context(), r.PathValue("id")); err != nil {
			response.Error(w, http.StatusInternalServerError, "delete_failed", "删除平台失败，可能存在关联的模型或 API Key")
			return
		}
		response.JSON(w, http.StatusOK, map[string]any{"message": "已删除"})
	}))
}

// Handler 返回带有 CORS 中间件的 http.Handler
func (s *Server) Handler() http.Handler {
	return middleware.CORS(s.router)
}
