#!/bin/bash
set -e

# ===== Coding Plan Manager 部署脚本 =====
# 在服务器上执行: ./deploy.sh

APP_DIR="/opt/cpm"
cd "$APP_DIR"

if [ ! -f .env ]; then
    echo "错误: 未找到 .env 文件"
    echo "请先创建: cp .env.production .env 并填写实际配置"
    exit 1
fi

echo "===== 拉取最新代码 ====="
git pull origin main

echo "===== 构建并启动服务 ====="
docker compose -f docker-compose.prod.yml up -d --build

echo "===== 等待服务启动 ====="
sleep 5

echo "===== 服务状态 ====="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "===== 部署完成 ====="
echo "访问: https://xunrua.top"
echo ""
echo "常用命令:"
echo "  查看日志: docker compose -f docker-compose.prod.yml logs -f"
echo "  重启服务: docker compose -f docker-compose.prod.yml restart"
echo "  停止服务: docker compose -f docker-compose.prod.yml down"
