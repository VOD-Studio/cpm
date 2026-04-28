<!-- Parent: ../AGENTS.md -->

# Stores Directory

Zustand state management stores.

## Structure

```
stores/
└── auth.ts    # Authentication state
```

## Auth Store (`auth.ts`)

### State Interface

```typescript
interface AuthState {
  user: User | null           // Current user data
  permissions: string[]       // User's permission list
  isAuthenticated: boolean    // Auth status
  isLoading: boolean          // Loading state for checkAuth

  // Actions
  login: (email, password) => Promise<void>
  register: (username, email, password) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  hasPermission: (permission) => boolean
}
```

### Actions

**login(email, password)**
- Calls `authApi.login()`
- Stores tokens in localStorage
- Fetches user data and permissions
- Sets `isAuthenticated: true`

**register(username, email, password)**
- Calls `authApi.register()`
- Stores tokens in localStorage
- Sets initial empty permissions

**logout()**
- Calls `authApi.logout()` (fire-and-forget)
- Removes tokens from localStorage
- Dispatches `auth:logout` event for React Query cache clear
- Resets state

**checkAuth()**
- Validates existing token
- Fetches user data if token exists
- Called on app initialization

**hasPermission(permission)**
- Returns `true` if user has `*` (super admin) or exact permission
- Returns `false` for empty/missing permissions

### Persistence

Tokens stored in `localStorage`:
- `access_token` - JWT access token
- `refresh_token` - JWT refresh token

### Usage

```tsx
import { useAuthStore } from '@/stores/auth'

// In component
const { user, isAuthenticated, hasPermission, logout } = useAuthStore()

// Check permission
if (hasPermission('keys:write')) {
  // Show edit button
}

// Select specific state (optimization)
const user = useAuthStore(s => s.user)
```

### Integration Points

- **API Layer:** Tokens attached via axios interceptor
- **Router:** `checkAuth()` called in route guards
- **Components:** Permission checks in UI rendering
- **React Query:** Cache cleared on logout via `auth:logout` event
