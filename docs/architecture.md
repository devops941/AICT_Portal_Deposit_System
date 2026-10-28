# AICTE Security Deposit & FDR Lifecycle Management Portal
## Architecture Specification (Phase 0)

### 1. High-Level System Architecture

The AICTE Security Deposit & FDR Lifecycle Portal is designed as a decoupled, multi-tier enterprise web application built on the MERN stack with strict TypeScript typing across both frontend and backend domains.

```
┌───────────────────────────────────────────────────────────┐
│                    Client Browser                         │
│  React 18 + Vite + TypeScript + Tailwind + shadcn UI      │
│  TanStack Query (Cache) + React Router + Recharts         │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTPS / REST (JSON)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                 Node.js / Express Backend                 │
│  Helmet + CORS + Morgan Logging                           │
│  Zod Request Validation Pipeline                          │
│  JWT Authentication & RBAC Authorization Middleware       │
│  Standardized Error & Response Envelopes                  │
└──────────────┬──────────────────────────────┬─────────────┘
               │                              │
               ▼ Mongoose ORM                 ▼
┌─────────────────────────────┐  ┌──────────────────────────┐
│   MongoDB Replica Set       │  │   Redis Cache & Jobs     │
│   (ACID Multi-Doc Tx)       │  │   (Queue & Lock Engine)  │
└─────────────────────────────┘  └──────────────────────────┘
```

---

### 2. Backend Architecture Design

The backend uses a modular, 6-layer feature architecture. Every feature module is isolated and follows a strict separation of concerns:

```
src/modules/<feature>/
├── <feature>.routes.ts       # Express router definitions and route-level middlewares
├── <feature>.controller.ts   # HTTP request mapping, parameter extraction, ApiResponse dispatch
├── <feature>.service.ts      # Pure business logic, transaction orchestration, domain rules
├── <feature>.repository.ts   # Database queries, Mongoose model access, projection, filtering
├── <feature>.validation.ts   # Zod validation schemas for body, query, and params
└── <feature>.types.ts        # Domain entities, input DTOs, and output interfaces
```

#### Centralized Error-Handling System
- **`AppError`**: Custom error class with HTTP status code, operational classification, error codes, and field validation maps.
- **`errorHandler`**: Express error middleware that translates Mongoose validation errors, Mongo duplicate keys, Zod schema violations, and JWT expiration into uniform JSON responses without leaking system stack traces in production.
- **Process Protection**: Hooks on `unhandledRejection` and `uncaughtException` ensure unexpected errors are logged and processes exit safely.

#### Standardized API Response Envelope
All API endpoints return responses in the uniform format:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2026-10-27T10:45:00.000Z"
}
```

#### Request Validation System
- Input validation uses **Zod** with the `validateRequest` middleware.
- Validates `req.body`, `req.query`, and `req.params` before hitting controllers.
- Invalid requests immediately receive a 422 Unprocessable Entity status with detailed field error messages.

---

### 3. Frontend Architecture Design

The frontend utilizes a feature-based architecture organized around domain workflows:

```
frontend/src/
├── app/            # Global providers (TanStack QueryClient, App root)
├── assets/         # Static visual assets, SVG icons, illustrations
├── components/     # UI design system
│   ├── common/     # Reusable domain-neutral elements
│   ├── layout/     # Sidebar, Navbar, AppLayout, AuthLayout shells
│   └── ui/         # Base atoms (Button, Card, Input, Badge, Avatar, Modal)
├── features/       # Modular application features
│   ├── landing/    # Public informational portal (Screen 1)
│   ├── auth/       # Login & Register views (Screens 2 & 3)
│   ├── dashboard/  # Executive analytics dashboard (Screen 4)
│   ├── projects/   # FDR portfolios and management (Screens 5 & 8)
│   ├── tasks/      # Kanban lifecycle board & detail modals (Screens 6 & 7)
│   ├── team/       # Institutional & Bank member directory (Screen 9)
│   ├── calendar/   # Maturity & milestone calendar (Screen 10)
│   ├── reports/    # Financial & audit analytics (Screen 11)
│   └── settings/   # Account, security & preferences (Screen 12)
├── hooks/          # Custom reusable React hooks
├── lib/            # Utilities (cn, currency and date formatting)
├── routes/         # React Router v6 tree with public, auth, and protected layouts
├── services/       # Axios API clients, auth interceptors, data services
├── styles/         # Tailwind CSS tokens, theme variables, custom scrollbars
└── types/          # Domain entity interfaces and API envelopes
```

---

### 4. Database & Transactional Integrity

- **Mongoose Connection Management**: Configured with automated reconnect, connection error logging, and graceful teardown on `SIGINT` / `SIGTERM`.
- **ACID Transactions**: Includes replica set detection (`isReplicaSet`) enabling multi-document session transactions for financial state transfers (e.g. deposit encashment, verification sign-offs).
