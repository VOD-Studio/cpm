package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB 全局数据库连接池
var DB *pgxpool.Pool

// InitDB 初始化数据库连接池
func InitDB(dsn string) error {
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return fmt.Errorf("解析数据库配置失败: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("创建连接池失败: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("数据库连接失败: %w", err)
	}
	DB = pool
	return nil
}

// CloseDB 关闭数据库连接池
func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}
