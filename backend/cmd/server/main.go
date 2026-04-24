package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"coding-plan-manager/backend/internal/config"
	"coding-plan-manager/backend/internal/repository"
	"coding-plan-manager/backend/internal/server"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库连接
	if err := repository.InitDB(cfg.Database.DSN()); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer repository.CloseDB()
	log.Println("数据库连接成功")

	// 运行数据库迁移
	if err := runMigrations(cfg); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}
	log.Println("数据库迁移完成")

	// 创建 HTTP 服务器
	srv := server.New(cfg)
	addr := fmt.Sprintf(":%s", cfg.Server.Port)

	httpServer := &http.Server{
		Addr:    addr,
		Handler: srv.Handler(),
	}

	// 优雅关闭
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("正在关闭服务器...")
		httpServer.Close()
	}()

	log.Printf("服务器启动，监听 %s\n", addr)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("服务器启动失败: %v", err)
	}
	log.Println("服务器已关闭")
}

// runMigrations 执行 SQL 迁移文件
// 自动检测迁移文件目录（支持从 backend/ 或项目根目录运行）
func runMigrations(cfg *config.Config) error {
	migrationFiles := []string{
		"001_create_users",
		"002_create_providers",
		"003_create_api_keys",
		"004_create_models",
		"005_create_usage_records",
		"006_add_base_urls_and_brand",
		"007_create_api_key_models",
		"008_add_max_output_tokens_and_zhipu_models",
		"009_add_volcengine_models",
		"010_fix_ali_models_tokens",
		"011_create_roles",
		"012_api_key_shares",
	}
	// 检测迁移文件目录
	migrationDir := "migrations"
	if _, err := os.Stat(migrationDir); os.IsNotExist(err) {
		migrationDir = "backend/migrations"
	}
	for _, m := range migrationFiles {
		sqlBytes, err := os.ReadFile(fmt.Sprintf("%s/%s.up.sql", migrationDir, m))
		if err != nil {
			return fmt.Errorf("读取迁移文件 %s 失败: %w", m, err)
		}
		if _, err := repository.DB.Exec(context.Background(), string(sqlBytes)); err != nil {
			// 忽略 "already exists" 类错误（幂等）
			log.Printf("迁移 %s: %v（可能已存在，继续）", m, err)
		}
	}
	return nil
}
