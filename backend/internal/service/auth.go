package service

import (
	"context"
	"errors"

	"coding-plan-manager/backend/internal/config"
	"coding-plan-manager/backend/internal/model"
	"coding-plan-manager/backend/internal/repository"
	"coding-plan-manager/backend/pkg/jwt"

	"golang.org/x/crypto/bcrypt"
)

// AuthService 认证服务，处理注册/登录/token 刷新
type AuthService struct {
	cfg *config.Config
}

// NewAuthService 创建认证服务实例
func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{cfg: cfg}
}

// Register 用户注册，返回 token 对和用户信息
func (s *AuthService) Register(ctx context.Context, username, email, password string) (string, string, *model.User, error) {
	// 检查邮箱是否已注册
	if _, err := repository.GetUserByEmail(ctx, email); err == nil {
		return "", "", nil, errors.New("邮箱已被注册")
	}
	// 密码加密
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", "", nil, err
	}
	// 创建用户
	user, err := repository.CreateUser(ctx, username, email, string(hash))
	if err != nil {
		return "", "", nil, err
	}
	// 生成 token
	accessTTL := jwt.ParseTTL(s.cfg.JWT.AccessTTL)
	refreshTTL := jwt.ParseTTL(s.cfg.JWT.RefreshTTL)
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Username, user.Role, s.cfg.JWT.AccessSecret, accessTTL)
	if err != nil {
		return "", "", nil, err
	}
	refreshToken, err := jwt.GenerateRefreshToken(user.ID, s.cfg.JWT.RefreshSecret, refreshTTL)
	if err != nil {
		return "", "", nil, err
	}
	return accessToken, refreshToken, user, nil
}

// Login 用户登录，验证密码并返回 token
func (s *AuthService) Login(ctx context.Context, email, password string) (string, string, *model.User, error) {
	user, err := repository.GetUserByEmail(ctx, email)
	if err != nil {
		return "", "", nil, errors.New("邮箱或密码错误")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", nil, errors.New("邮箱或密码错误")
	}
	accessTTL := jwt.ParseTTL(s.cfg.JWT.AccessTTL)
	refreshTTL := jwt.ParseTTL(s.cfg.JWT.RefreshTTL)
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Username, user.Role, s.cfg.JWT.AccessSecret, accessTTL)
	if err != nil {
		return "", "", nil, err
	}
	refreshToken, err := jwt.GenerateRefreshToken(user.ID, s.cfg.JWT.RefreshSecret, refreshTTL)
	if err != nil {
		return "", "", nil, err
	}
	return accessToken, refreshToken, user, nil
}

// RefreshToken 刷新 access token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	userID, err := jwt.ParseRefreshToken(refreshToken, s.cfg.JWT.RefreshSecret)
	if err != nil {
		return "", "", errors.New("无效的 refresh token")
	}
	user, err := repository.GetUserByID(ctx, userID)
	if err != nil {
		return "", "", errors.New("用户不存在")
	}
	accessTTL := jwt.ParseTTL(s.cfg.JWT.AccessTTL)
	refreshTTL := jwt.ParseTTL(s.cfg.JWT.RefreshTTL)
	newAccess, err := jwt.GenerateAccessToken(user.ID, user.Username, user.Role, s.cfg.JWT.AccessSecret, accessTTL)
	if err != nil {
		return "", "", err
	}
	newRefresh, err := jwt.GenerateRefreshToken(user.ID, s.cfg.JWT.RefreshSecret, refreshTTL)
	if err != nil {
		return "", "", err
	}
	return newAccess, newRefresh, nil
}

// GetUser 根据 ID 获取用户信息
func (s *AuthService) GetUser(ctx context.Context, userID string) (*model.User, error) {
	return repository.GetUserByID(ctx, userID)
}
