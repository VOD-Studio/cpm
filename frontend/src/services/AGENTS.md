<!-- Parent: ../AGENTS.md -->

# Services Directory

API service layer for backend communication.

## Structure

```
services/
└── api.ts    # Axios instance and API modules
```

## API Architecture

### Axios Instance
- **Base URL:** `/api/v1`
- **Request Interceptor:** Auto-attaches `Authorization: Bearer <token>`
- **Response Interceptor:** Auto-unwraps `{data: ...}` response wrapper
- **Token Refresh:** Automatic 401 handling with refresh token flow

### API Modules

#### authApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| login | POST /auth/login | User login |
| register | POST /auth/register | User registration |
| refresh | POST /auth/refresh | Token refresh |
| logout | POST /auth/logout | User logout |
| me | GET /auth/me | Get current user |

#### providerApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| list | GET /providers | List all providers |
| get | GET /providers/:id | Get provider |
| create | POST /providers | Create provider |
| update | PUT /providers/:id | Update provider |
| delete | DELETE /providers/:id | Delete provider |

#### apiKeyApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| list | GET /keys | List user's keys |
| create | POST /keys | Create key |
| update | PUT /keys/:id | Update key |
| delete | DELETE /keys/:id | Delete key |
| test | POST /keys/:id/test | Test key validity |
| decrypt | GET /keys/:id/decrypt | Reveal plain key |
| getShares | GET /keys/:id/shares | Get shared users |
| setShares | PUT /keys/:id/shares | Set shared users |

#### modelApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| list | GET /models | List all models |
| getByProvider | GET /providers/:id/models | Models by provider |
| create | POST /models | Create model |
| update | PUT /models/:id | Update model |
| delete | DELETE /models/:id | Delete model |

#### usageApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| summary | GET /usage | Usage summary |
| byKey | GET /usage/by-key | Usage by key |
| byModel | GET /usage/by-model | Usage by model |
| byProvider | GET /usage/by-provider | Usage by provider |
| trends | GET /usage/trends | Usage trends |
| record | POST /usage/record | Record usage |

#### dashboardApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| summary | GET /dashboard/summary | Dashboard stats |

#### glmUsageApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| query | POST /glm/usage | Query GLM usage |

#### volcengineUsageApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| query | POST /volcengine/usage | Query Volcengine usage |

#### aliUsageApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| query | POST /ali/usage | Query Aliyun usage |

#### userAdminApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| list | GET /users | List users |
| create | POST /users | Create user |
| update | PUT /users/:id | Update user |
| delete | DELETE /users/:id | Delete user |
| setActive | PUT /users/:id/active | Set active status |
| assignRoles | PUT /users/:id/roles | Assign roles |

#### roleApi
| Method | Endpoint | Description |
|--------|----------|-------------|
| list | GET /roles | List roles |
| create | POST /roles | Create role |
| update | PUT /roles/:id | Update role |
| delete | DELETE /roles/:id | Delete role |

## Error Handling

- Automatic token refresh on 401
- Toast notifications for auth errors
- Promise rejection for component-level handling

## Usage Example

```tsx
import { apiKeyApi } from '@/services/api'

// In React Query
const { data } = useQuery({
  queryKey: ['keys'],
  queryFn: () => apiKeyApi.list().then(r => r.data),
})

// In Mutation
const mutation = useMutation({
  mutationFn: (id: string) => apiKeyApi.delete(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['keys'] }),
})
```
