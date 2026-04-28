<!-- Parent: ../AGENTS.md -->

# Config Package

应用配置加载与管理，从环境变量读取配置。

## 文件概览

### config.go

#### Config
顶层配置结构：
- `Server` - 服务器配置
- `Database` - 数据库配置
- `JWT` - JWT 配置
- `Crypto` - 加密配置

#### ServerConfig
服务器配置：
- `Port` - 监听端口（默认 8080）

#### DatabaseConfig
数据库配置：
- `Host` - 主机地址（默认 localhost）
- `Port` - 端口（默认 5432）
- `User` - 用户名（默认 postgres）
- `Password` - 密码（默认 postgres）
- `DBName` - 数据库名（默认 coding_plan_manager）
- `SSLMode` - SSL 模式（默认 disable）

#### JWTConfig
JWT 配置：
- `AccessSecret` - Access Token 签名密钥
- `RefreshSecret` - Refresh Token 签名密钥
- `AccessTTL` - Access Token 有效期（默认 15m）
- `RefreshTTL` - Refresh Token 有效期（默认 168h = 7天）

#### CryptoConfig
加密配置：
- `EncryptionKey` - API Key 加密密钥（32字节 AES 密钥）

#### Load
加载配置：
- 从环境变量读取所有配置项
- 未设置时使用默认值

#### DatabaseConfig.DSN
生成 PostgreSQL 连接字符串：
```
host=<host> port=<port> user=<user> password=<password> dbname=<dbname> sslmode=<sslmode>
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| SERVER_PORT | 8080 | 服务端口 |
| DB_HOST | localhost | 数据库主机 |
| DB_PORT | 5432 | 数据库端口 |
| DB_USER | postgres | 数据库用户 |
| DB_PASSWORD | postgres | 数据库密码 |
| DB_NAME | coding_plan_manager | 数据库名 |
| DB_SSLMODE | disable | SSL 模式 |
| JWT_ACCESS_SECRET | change-me-access-secret | Access Token 密钥 |
| JWT_REFRESH_SECRET | change-me-refresh-secret | Refresh Token 密钥 |
| JWT_ACCESS_TTL | 15m | Access Token 有效期 |
| JWT_REFRESH_TTL | 168h | Refresh Token 有效期 |
| ENCRYPTION_KEY | 0123456789abcdef... | 加密密钥 |

## 安全建议

生产环境必须修改：
- JWT_ACCESS_SECRET / JWT_REFRESH_SECRET - 使用强随机字符串
- ENCRYPTION_KEY - 使用 32 字节随机密钥
- DB_PASSWORD - 使用强密码
