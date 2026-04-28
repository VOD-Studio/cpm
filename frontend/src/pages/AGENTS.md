<!-- Parent: ../AGENTS.md -->

# Pages Directory

Page-level React components for each route.

## Structure

```
pages/
├── auth/
│   ├── LoginPage.tsx      # User login
│   └── RegisterPage.tsx   # User registration
├── dashboard/
│   └── DashboardPage.tsx  # Home dashboard with stats
├── keys/
│   └── KeysPage.tsx       # API Key management
├── models/
│   └── ModelsPage.tsx     # Model catalog
├── providers/
│   └── ProvidersPage.tsx  # Provider/platform management
├── roles/
│   └── RolesPage.tsx      # Role & permission management
├── settings/
│   └── SettingsPage.tsx   # User settings
├── usage/
│   └── UsagePage.tsx      # Usage analytics
├── users/
│   └── UsersPage.tsx      # User administration
└── AGENTS.md
```

## Page Overview

### Auth Pages (`auth/`)

**LoginPage.tsx**
- Email/password form
- Calls `useAuthStore.login()`
- Redirects to `/dashboard` on success

**RegisterPage.tsx**
- Username/email/password form
- Minimum 8 character password
- Calls `useAuthStore.register()`

### DashboardPage.tsx
- Statistics cards (Keys, Providers, Models)
- Provider overview with key counts
- Key status overview (valid/invalid/untested)
- Model brand distribution
- Uses React Query for data fetching

### KeysPage.tsx
**Features:**
- CRUD operations for API Keys
- Key reveal/copy functionality
- Base URL management (multi-protocol support)
- Model association
- Key sharing between users
- GLM usage query integration
- Permission-based actions (keys:write, keys:delete)

**Modals:**
- `AddKeyModal` - Create new key
- `EditKeyModal` - Update existing key
- `ShareKeyModal` - Share key with users
- `KeyUsageQuery` - GLM usage charts

### ModelsPage.tsx
- Model catalog with brand grouping
- Platform filtering
- CRUD with permissions (models:write, models:delete)
- Model capabilities tags
- Pricing display (input/output per million)

### ProvidersPage.tsx
- Platform/provider management
- Model count per provider
- CRUD with permissions (providers:write, providers:delete)

### RolesPage.tsx
- Role CRUD with permission matrix
- Permission groups: Dashboard, API Key, Models, Providers, Users, Roles, Settings, Usage
- System role protection (cannot edit/delete)
- `PermSelector` component for permission UI

### UsersPage.tsx
- User administration table
- Role assignment
- Activate/deactivate users
- Protected admin handling
- Permissions: users:read, users:write, users:delete

### UsagePage.tsx
- Usage analytics with charts (Recharts)
- Period filtering (7d/30d/90d)
- Trend line charts
- Model token bar charts
- Token distribution pie chart
- Platform usage query panels:
  - GLM (智谱)
  - Volcengine (火山引擎)
  - Ali (阿里云)

### SettingsPage.tsx
- Current user info display
- Application version

## Common Patterns

**Data Fetching:**
- React Query (`useQuery`) for GET operations
- `useMutation` for CUD operations
- Query invalidation after mutations

**State Management:**
- Local state with `useState` for modals, filters
- Zustand `useAuthStore` for auth state

**Form Handling:**
- `react-hook-form` for complex forms
- Native controlled inputs for simple forms

**Notifications:**
- `sonner` toast for success/error messages

**Permissions:**
- `hasPermission()` check before showing action buttons
- Permission format: `resource:action` (e.g., `keys:write`)

**Styling:**
- Tailwind CSS with CSS variables
- Responsive design (mobile-first)
- Glass-morphism cards with `backdrop-blur-sm`
