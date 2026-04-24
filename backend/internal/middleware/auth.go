package middleware

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	"coding-plan-manager/backend/internal/config"
	"coding-plan-manager/backend/internal/repository"
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

// permCache 权限缓存，避免每次请求都查询数据库
var (
	permCache   = make(map[string]cachedPerms)
	permCacheMu sync.RWMutex
)

type cachedPerms struct {
	permissions []string
	expiresAt   time.Time
}

// getUserPermissions 从缓存或数据库获取用户权限
func getUserPermissions(userID string) ([]string, error) {
	permCacheMu.RLock()
	if cached, ok := permCache[userID]; ok && time.Now().Before(cached.expiresAt) {
		permCacheMu.RUnlock()
		return cached.permissions, nil
	}
	permCacheMu.RUnlock()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	perms, err := repository.GetUserPermissions(ctx, userID)
	if err != nil {
		return nil, err
	}

	permCacheMu.Lock()
	permCache[userID] = cachedPerms{
		permissions: perms,
		expiresAt:   time.Now().Add(5 * time.Minute),
	}
	permCacheMu.Unlock()

	return perms, nil
}

// RequirePermission 权限检查中间件，需要先经过 Auth 中间件
func RequirePermission(cfg *config.Config, permission string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("X-User-ID")
		if userID == "" {
			response.Error(w, http.StatusUnauthorized, "unauthorized", "未认证")
			return
		}

		perms, err := getUserPermissions(userID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "internal_error", "权限查询失败")
			return
		}

		// 检查是否有目标权限或通配符 *
		hasPerm := false
		for _, p := range perms {
			if p == "*" || p == permission {
				hasPerm = true
				break
			}
		}

		if !hasPerm {
			response.Error(w, http.StatusForbidden, "forbidden", "没有操作权限")
			return
		}

		next(w, r)
	}
}
