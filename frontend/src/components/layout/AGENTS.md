<!-- Parent: ../AGENTS.md -->

# Layout Components

Application layout and navigation components.

## Components

### MainLayout.tsx
Root application shell providing:

**Features:**
- Responsive sidebar navigation (desktop fixed, mobile drawer)
- Permission-based navigation filtering
- User info display and logout action
- Active route highlighting

**Dependencies:**
- `useAuthStore` - Auth state, user info, permissions, logout
- `react-router` - NavLink, useNavigate, useLocation, Outlet
- `lucide-react` - Navigation icons

**Navigation Items:**
| Route | Label | Icon | Permission |
|-------|-------|------|------------|
| /dashboard | 仪表盘 | LayoutDashboard | - |
| /keys | API Key 管理 | Key | - |
| /models | 模型浏览 | Cpu | - |
| /providers | 平台管理 | Server | - |
| /users | 用户管理 | Users | users:read |
| /roles | 角色管理 | Shield | roles:read |
| /settings | 设置 | Settings | - |

**Styling:**
- Tailwind with CSS variables for theming
- Indigo accent color (`indigo-400`, `indigo-500`)
- Glass-morphism effect with backdrop blur

## Usage

```tsx
// In router configuration
<Route element={<MainLayout />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  // ... other routes
</Route>
```
