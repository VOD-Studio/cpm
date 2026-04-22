package middleware

import (
	"net/http"
	"strings"

	"coding-plan-manager/backend/internal/config"
	"coding-plan-manager/backend/pkg/jwt"
	"coding-plan-manager/backend/pkg/response"
)

// Auth JWT 鉴权中间件，验证 Bearer token 并注入用户信息到请求头
func Auth(cfg *config.Config, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Error(w, http.StatusUnauthorized, "unauthorized", "缺少 Authorization 头")
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(w, http.StatusUnauthorized, "unauthorized", "Authorization 格式错误")
			return
		}
		claims, err := jwt.ParseAccessToken(parts[1], cfg.JWT.AccessSecret)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "unauthorized", "Token 无效或已过期")
			return
		}
		// 将用户信息注入请求头，供下游 handler 使用
		r.Header.Set("X-User-ID", claims.UserID)
		r.Header.Set("X-Username", claims.Username)
		r.Header.Set("X-Role", claims.Role)
		next(w, r)
	}
}
