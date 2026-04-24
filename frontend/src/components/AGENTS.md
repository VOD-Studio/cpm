<!-- Parent: ../AGENTS.md -->

# Components Directory

UI components for the CPM (Coding Plan Manager) frontend application.

## Structure

```
components/
├── layout/          # Layout components
│   └── MainLayout.tsx
└── AGENTS.md        # This file
```

## Component Categories

### Layout Components (`layout/`)
- **MainLayout.tsx** - Root application shell with responsive sidebar navigation
  - Desktop: Fixed left sidebar (w-60)
  - Mobile: Drawer with overlay
  - Permission-based nav item filtering via `hasPermission()`
  - Auth state from `useAuthStore`

## Design Patterns

- **Tailwind CSS** with CSS variables for theming:
  - `--color-bg-primary`, `--color-bg-secondary`
  - `--color-border`
- **Lucide React** for icons
- **React Router** NavLink for navigation
- **Zustand** for auth state management

## Adding New Components

1. Create feature-specific subdirectories (e.g., `components/forms/`, `components/charts/`)
2. Follow naming convention: `PascalCase.tsx` for component files
3. Use path alias `@/` for imports
4. Apply consistent styling with CSS variables
