.PHONY: up down logs build restart dev-frontend dev-backend dev-db psql

# 一键启动（构建 + 后台运行）
up:
	docker compose up -d --build
	@echo ""
	@echo "===== 服务已启动 ====="
	@echo "前端: http://localhost:$(shell grep FRONTEND_PORT .env 2>/dev/null | cut -d= -f2 || echo 3000)"
	@echo "后端: http://localhost:$(shell grep BACKEND_PORT .env 2>/dev/null | cut -d= -f2 || echo 8080)"
	@echo "数据库: localhost:$(shell grep DB_PORT .env 2>/dev/null | cut -d= -f2 || echo 5432)"

# 一键停止并移除容器
down:
	docker compose down

# 停止并清除数据卷（重置数据库）
clean:
	docker compose down -v
	@echo "已清除所有容器和数据卷"

# 查看日志
logs:
	docker compose logs -f

# 仅重新构建镜像
build:
	docker compose build

# 重启所有服务
restart:
	docker compose restart

# ===== 本地开发命令（不使用 Docker） =====

# 仅启动数据库
dev-db:
	docker compose up -d postgres
	@echo "数据库已启动: localhost:5432"

# 本地启动后端
dev-backend:
	cd backend && go run cmd/server/main.go

# 本地启动前端
dev-frontend:
	cd frontend && npm run dev

# 连接数据库
psql:
	docker compose exec postgres psql -U postgres -d coding_plan_manager
