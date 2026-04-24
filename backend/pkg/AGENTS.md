# backend/pkg — Public Utility Packages

<!-- Parent: ../AGENTS.md -->

## Purpose

This directory contains reusable utility packages that provide common functionality across the backend services. Each package is self-contained and can be imported independently.

## Subdirectories

### [crypto/](crypto/)

AES-GCM encryption/decryption utilities.

**Key Functions:**
- `Encrypt(plaintext, hexKey string) (string, error)` - Encrypts plaintext using AES-GCM with a hex-encoded key. Returns hex-encoded ciphertext with nonce prepended.
- `Decrypt(hexCiphertext, hexKey string) (string, error)` - Decrypts hex-encoded ciphertext using AES-GCM. Expects nonce prepended to ciphertext.

**Usage Pattern:**
```go
import "cpm/backend/pkg/crypto"

// Key must be 16, 24, or 32 bytes (hex-encoded = 32, 48, or 64 hex chars)
encrypted, err := crypto.Encrypt("sensitive data", hexKey)
decrypted, err := crypto.Decrypt(encrypted, hexKey)
```

### [jwt/](jwt/)

JWT token generation and parsing using `github.com/golang-jwt/jwt/v5`.

**Key Types:**
- `Claims` - Custom claims struct with `UserID`, `Username`, `Role` fields plus standard registered claims.

**Key Functions:**
- `GenerateAccessToken(userID, username, role, secret string, ttl time.Duration) (string, error)` - Creates access token with custom claims.
- `GenerateRefreshToken(userID, secret string, ttl time.Duration) (string, error)` - Creates refresh token with subject set to userID.
- `ParseAccessToken(tokenStr, secret string) (*Claims, error)` - Validates and extracts claims from access token.
- `ParseRefreshToken(tokenStr, secret string) (string, error)` - Validates refresh token and returns userID.
- `ParseTTL(s string) time.Duration` - Parses duration string, defaults to 15 minutes on error.

**Usage Pattern:**
```go
import "cpm/backend/pkg/jwt"

// Generate tokens
accessToken, _ := jwt.GenerateAccessToken(userID, username, "admin", secret, time.Hour)
refreshToken, _ := jwt.GenerateRefreshToken(userID, secret, 7*24*time.Hour)

// Parse and validate
claims, err := jwt.ParseAccessToken(tokenFromRequest, secret)
userID, err := jwt.ParseRefreshToken(refreshToken, secret)
```

### [response/](response/)

HTTP JSON response helpers.

**Key Types:**
- `APIResponse` - Standard response envelope with `Data`, `Error`, and `Message` fields.

**Key Functions:**
- `JSON(w http.ResponseWriter, status int, data interface{})` - Sends successful JSON response.
- `Error(w http.ResponseWriter, status int, errMsg, detail string)` - Sends error JSON response.

**Usage Pattern:**
```go
import "cpm/backend/pkg/response"

// Success response
response.JSON(w, http.StatusOK, user)

// Error response
response.Error(w, http.StatusBadRequest, "invalid_input", "username is required")
```

## For AI Agents

### Import Paths

All packages use the module path `cpm/backend/`:

```go
import "cpm/backend/pkg/crypto"
import "cpm/backend/pkg/jwt"
import "cpm/backend/pkg/response"
```

### Common Patterns

1. **Authentication Flow:**
   - Use `jwt.GenerateAccessToken()` for login success
   - Use `jwt.ParseAccessToken()` in middleware to extract user context
   - Use `jwt.GenerateRefreshToken()` for long-lived sessions

2. **Sensitive Data Handling:**
   - Use `crypto.Encrypt()` before storing sensitive data
   - Use `crypto.Decrypt()` when retrieving encrypted data
   - Key must be hex-encoded AES key (32/48/64 hex chars for AES-128/192/256)

3. **API Responses:**
   - Always use `response.JSON()` for success responses
   - Always use `response.Error()` for error responses
   - Maintains consistent API response format

### Dependencies

- `crypto/` - Standard library only (`crypto/aes`, `crypto/cipher`, `crypto/rand`)
- `jwt/` - Requires `github.com/golang-jwt/jwt/v5`
- `response/` - Standard library only (`encoding/json`, `net/http`)

### Error Handling

All functions return errors as the second return value. Always check errors:

```go
encrypted, err := crypto.Encrypt(plaintext, key)
if err != nil {
    // Handle error - key format error, encryption failure
}

claims, err := jwt.ParseAccessToken(token, secret)
if err != nil {
    // Handle error - invalid token, expired, wrong signing method
}
```
