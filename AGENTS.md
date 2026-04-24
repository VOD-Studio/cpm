<!-- Generated: 2026-04-25 | Updated: 2026-04-25 -->

# Coding Plan Manager (CPM)

## Purpose
多平台 AI API Key 管理工具，用于统一管理 Anthropic、OpenAI、Google、智谱GLM、阿里云、火山引擎等 AI 平台的 API Key 和 Endpoint，展示可用模型及全面用量统计。

## Key Files
| File | Description |
|------|-------------|
| `docker-compose.yml` | 三服务编排配置 (postgres, backend, frontend) |
| `Makefile` | 开发快捷命令 (up, down, logs, dev-backend, dev-frontend) |
| `.env.example` | 环境变量模板 |
| `README.md` | 项目文档，包含部署指南和 API 接口说明 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `backend/` | Go 后端服务 (see `backend/AGENTS.md`) |
| `frontend/` | React 前端应用 (see `frontend/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 使用 `make up` 启动所有服务，`make down` 停止
- 本地开发：`make dev-db` 启动数据库，然后分别启动前后端
- 环境变量必须配置：`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`
- 生产部署前必须修改 `.env` 中的所有密钥

### Testing Requirements
- 后端测试：`cd backend && go test ./...`
- 前端测试：`cd frontend && npm test` (待添加测试框架)

### Common Patterns
- 前后端分离架构，通过 REST API 通信
- 后端三层架构：Handler → Service → Repository
- 前端状态管理：Zustand (全局) + TanStack Query (服务端状态)

## Dependencies

### External
- Docker & Docker Compose — 容器化部署
- Go 1.25 — 后端语言
- Node.js 20+ — 前端构建
- PostgreSQL 16 — 数据库

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend (React SPA)                    │
│   Pages → Services → Stores (Zustand)                  │
│   Port: 3000 (Nginx)                                   │
└─────────────────────────────────────────────────────────┘
                        ↓ REST API
┌─────────────────────────────────────────────────────────┐
│                 Backend (Go HTTP Server)                │
│   Handler → Service → Repository                        │
│   Middleware: JWT认证 + RBAC权限                        │
│   Port: 8080                                           │
└─────────────────────────────────────────────────────────┘
                        ↓ pgx/v5
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL 16                           │
│   users | roles | api_keys | providers | usage_records  │
│   Port: 5432                                           │
└─────────────────────────────────────────────────────────┘
```

## Supported Platforms
| 平台 | 功能 |
|------|------|
| Anthropic | API Key 管理、模型浏览、用量统计 |
| OpenAI | API Key 管理、模型浏览、用量统计 |
| Google (Gemini) | API Key 管理、模型浏览、用量统计 |
| 智谱GLM | API Key 管理、模型浏览、用量统计 |
| 阿里云 | Coding Plan 用量查询 |
| 火山引擎 | Coding Plan 用量查询 |

<!-- MANUAL: -->
