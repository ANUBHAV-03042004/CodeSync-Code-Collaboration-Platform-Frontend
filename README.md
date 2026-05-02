# CodeSync Frontend — Angular 17

A full-featured collaborative code editor frontend built with **Angular 17 (standalone)**, **GSAP animations**, and **Jest** testing — wired to all 10 CodeSync microservices.

---

## 📁 Project Structure

```
src/app/
├── core/
│   ├── interceptors/
│   │   ├── auth.interceptor.ts        ← attaches Bearer JWT to every request
│   │   └── error.interceptor.ts       ← global 401/403/500 handler + toast
│   ├── guards/
│   │   ├── auth.guard.ts              ← redirects to /login if no token
│   │   └── role.guard.ts              ← blocks non-admin routes
│   └── models/
│       └── index.ts                   ← all TypeScript interfaces for 10 services
│
├── services/
│   ├── auth.service.ts                ← auth-service (24 endpoints)
│   ├── project.service.ts             ← project-service (14 endpoints)
│   ├── file.service.ts                ← file-service (12 endpoints)
│   ├── collab.service.ts              ← collab-service (REST + STOMP WebSocket)
│   ├── websocket.service.ts           ← shared STOMP connection manager
│   └── other-services.ts             ← execution, version, comment, notification
│
├── features/
│   ├── auth/
│   │   ├── login/                     ← login with GSAP card animation
│   │   ├── register/                  ← register with password strength meter
│   │   └── auth-extra.component.ts    ← oauth2-callback, forgot-password, reset-password
│   ├── dashboard/                     ← stat cards, my projects, public explore
│   ├── projects/                      ← project list (tabs+search), create, detail
│   ├── editor/                        ← Monaco-style editor + execution + collab + comments + version history
│   ├── notifications/                 ← full notification list with real-time push
│   └── admin/                         ← user management table
│
├── shared/
│   └── components/
│       ├── navbar/                    ← sticky navbar + notification bell + user dropdown
│       └── toast/                     ← slide-in toast notifications
│
└── __tests__/                         ← Jest test files
    ├── components.spec.ts             ← Login, Register, Dashboard, Editor, Notifications, Admin
    ├── project-components.spec.ts     ← ProjectCreate, ProjectDetail
    ├── auth-extra.spec.ts             ← OAuth2, ForgotPassword, ResetPassword
    ├── navbar.spec.ts                 ← Navbar + Admin variant
    ├── toast.spec.ts                  ← Toast component
    └── app-and-models.spec.ts        ← AppComponent + model type checks
```

---

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js 18+
- npm 9+

### 2. Install Dependencies

```bash
cd codesync-frontend
npm install
```

### 3. Configure API URLs

Edit `src/environments/environment.ts` for local dev:

```ts
export const environment = {
  production: false,
  apiBase: 'http://localhost:8080',           // your API Gateway port
  wsCollabEndpoint: 'http://localhost:8080/ws/collab/websocket',
  wsNotificationEndpoint: 'http://localhost:8080/ws/notifications/websocket',
  wsExecutionEndpoint: 'http://localhost:8080/ws/execution/websocket'
};
```

Edit `src/environments/environment.prod.ts` for production with your OpenShift gateway URL.

### 4. Start Dev Server

```bash
npm start
# → http://localhost:4200
```

### 5. Run Tests

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
```

### 6. Build for Production

```bash
npm run build
# Output in dist/codesync-frontend/
```

---

## 🗺️ Routes

| Route | Component | Guard |
|---|---|---|
| `/login` | LoginComponent | — |
| `/register` | RegisterComponent | — |
| `/forgot-password` | ForgotPasswordComponent | — |
| `/reset-password?token=xxx` | ResetPasswordComponent | — |
| `/oauth2/callback?token=xxx` | Oauth2CallbackComponent | — |
| `/dashboard` | DashboardComponent | authGuard |
| `/projects` | ProjectListComponent | authGuard |
| `/projects/new` | ProjectCreateComponent | authGuard |
| `/projects/:id` | ProjectDetailComponent | authGuard |
| `/editor/:projectId` | EditorComponent | authGuard |
| `/notifications` | NotificationsComponent | authGuard |
| `/admin` | AdminDashboardComponent | authGuard + roleGuard |

---

## 🔌 API Mapping

| Angular Service | Spring Boot Service | Port | Protocol |
|---|---|---|---|
| `auth.service.ts` | auth-service | 8081 | REST |
| `project.service.ts` | project-service | 8082 | REST |
| `file.service.ts` | file-service | 8083 | REST |
| `collab.service.ts` | collab-service | 8084 | REST + STOMP |
| `execution.service` (in other-services.ts) | execution-service | 8085 | REST + STOMP |
| `version.service` | version-service | 8086 | REST |
| `comment.service` | comment-service | 8087 | REST |
| `notification.service` | notification-service | 8088 | REST + STOMP |

All calls go through API Gateway on port **8080**.

---

## ⚡ GSAP Animations Used

| Component | Animation |
|---|---|
| Login / Register | Card fade-up + scale on entry, shake on error |
| Dashboard | Header slide-down, stat cards stagger-scale, sections fade-up |
| ProjectList | Grid cards stagger fade when tab/search changes |
| ProjectCreate | Card scale-up on entry |
| ProjectDetail | Hero section fade-up |
| Navbar | Slide-down from top on mount |
| Admin | Stat pills scale-in, table fade-up |
| Notifications | Items slide-in from left staggered |
| Toast | Slide-in from right, slide-out on dismiss |
| Editor | Sidebar slide-in from left, tabs fade-down |

---

## 🧪 Test Coverage

**Services (HTTP):** 100 tests across all 10 service classes
- Every REST endpoint verified with `HttpTestingController`
- Token storage and clearing
- WebSocket connection/disconnect lifecycle

**Guards:**
- `authGuard`: token present → allow, no token → redirect
- `roleGuard`: ADMIN → allow, USER → redirect
- JWT payload decoding

**Interceptors:**
- JWT header attachment
- 401 → clear tokens + redirect
- No header when no token

**Components:**
- Form validation (valid/invalid states, markAllAsTouched)
- Service call verification
- Navigation after success/error
- Loading state management
- All UI logic branches (icons, colors, filters, tabs)

---

## 🛠️ What You Need to Do

### Immediate (to run the app):

1. **Run your 10 backend services** (Eureka + API Gateway + 8 services)
2. **Set the correct port** in `environment.ts` for your API Gateway
3. `npm install && npm start`

### To Integrate Monaco Editor (for production-grade editor):

```bash
npm install ngx-monaco-editor-v2
```

Replace the `<textarea>` in `editor.component.ts` with:

```ts
// In AppConfig providers:
provideMonacoEditor()

// In EditorComponent template:
<ngx-monaco-editor
  [options]="monacoOptions"
  [(ngModel)]="editorContent"
  (onInit)="onMonacoInit($event)">
</ngx-monaco-editor>
```

### To add OAuth2 (GitHub/Google):

The `LoginComponent` already generates correct OAuth2 URLs (`/oauth2/authorization/github`).
Spring Security handles the redirect. The `Oauth2CallbackComponent` reads `?token=` from the callback URL.

Make sure your Spring Security config redirects to:
```
http://localhost:4200/oauth2/callback?token=<JWT>
```

### CORS:

Add `http://localhost:4200` to your Spring Boot CORS config or API Gateway.

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `@stomp/stompjs` | WebSocket STOMP client for collab/notifications/execution |
| `sockjs-client` | SockJS transport layer for STOMP |
| `gsap` | Animation library |
| `@angular/material` | (Optional) — installed for future component use |
| `jest` + `jest-preset-angular` | Unit testing |

---

## 🔐 Authentication Flow

```
User fills login form
  → POST /api/v1/auth/login
  → JWT stored in localStorage (access_token, refresh_token, user)
  → authInterceptor attaches Bearer token to all subsequent requests
  → authGuard protects all private routes
  → On 401 → clear storage, redirect to /login
  → OAuth2: /oauth2/authorization/github → Spring handles → callback with ?token=JWT
```
