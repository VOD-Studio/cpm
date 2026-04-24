# Backend Command Directory

<!-- Parent: ../AGENTS.md -->

## Purpose

Application entry point for the Coding Plan Manager backend service. Contains the `main` package that bootstraps and runs the HTTP server.

## Structure

```
cmd/
└── server/
    └── main.go      # Application entry point
```

## Subdirectories

### server/

Contains the single `main.go` entry point that orchestrates application startup.

**Startup Sequence:**
1. Load configuration from environment (`config.Load()`)
2. Initialize database connection (`repository.InitDB()`)
3. Run database migrations (`runMigrations()`)
4. Create HTTP server with routes (`server.New()`)
5. Listen for shutdown signals (SIGINT, SIGTERM)
6. Graceful shutdown on signal

**Key Dependencies:**
- `internal/config` - Configuration loading
- `internal/repository` - Database layer
- `internal/server` - HTTP routing and handlers

## For AI Agents

### Startup Flow

```
main()
  │
  ├─► config.Load()                    # Load env config
  │
  ├─► repository.InitDB(dsn)           # Connect to SQLite
  │
  ├─► runMigrations(cfg)               # Execute 12 migration files
  │     └─► 001_create_users
  │     └─► 002_create_providers
  │     └─► 003_create_api_keys
  │     └─► 004_create_models
  │     └─► 005_create_usage_records
  │     └─► 006_add_base_urls_and_brand
  │     └─► 007_create_api_key_models
  │     └─► 008_add_max_output_tokens_and_zhipu_models
  │     └─► 009_add_volcengine_models
  │     └─► 010_fix_ali_models_tokens
  │     └─► 011_create_roles
  │     └─► 012_api_key_shares
  │
  ├─► server.New(cfg)                  # Create HTTP server
  │
  └─► httpServer.ListenAndServe()      # Start serving requests
```

### Graceful Shutdown

- Signal handler listens for `SIGINT` (Ctrl+C) and `SIGTERM`
- On signal: closes HTTP server, closes DB connection
- Ensures in-flight requests complete before exit

### Migration Files

Located in `migrations/` or `backend/migrations/` (auto-detected). Each migration is idempotent - errors like "already exists" are logged and ignored.

### Running the Server

```bash
# From project root
go run ./backend/cmd/server

# Or from backend directory
cd backend && go run ./cmd/server
```

### Configuration

Server behavior controlled by environment variables (see `internal/config`):
- `SERVER_PORT` - HTTP listen port (default: 8080)
- `DATABASE_PATH` - SQLite database file path

## Notes

- Single binary output, no subpackages in cmd/
- All business logic lives in `internal/`
- Migrations are embedded in startup, not a separate tool
