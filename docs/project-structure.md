# Project Structure

The project follows a clean monorepo architecture:

```
security-deposit-portal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts             # Mongoose connection & lifecycle
│   │   │   ├── env.ts                  # Zod environment variable validation
│   │   │   └── logger.ts               # Structured logging system
│   │   ├── jobs/
│   │   │   └── index.ts                # Background job scheduler engine
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts      # JWT & RBAC authorization
│   │   │   ├── error.middleware.ts     # Centralized error handler
│   │   │   ├── logging.middleware.ts   # Morgan HTTP logging
│   │   │   ├── notFound.middleware.ts  # 404 handler
│   │   │   └── validate.middleware.ts  # Zod schema validation middleware
│   │   ├── modules/
│   │   │   └── health/
│   │   │       ├── health.controller.ts
│   │   │       ├── health.repository.ts
│   │   │       ├── health.routes.ts
│   │   │       ├── health.service.ts
│   │   │       ├── health.types.ts
│   │   │       └── health.validation.ts
│   │   ├── routes/
│   │   │   └── index.ts                # Top-level API router aggregator
│   │   ├── services/
│   │   │   └── index.ts                # Cross-cutting storage & email services
│   │   ├── types/
│   │   │   └── index.ts                # Shared backend types
│   │   ├── utils/
│   │   │   ├── apiResponse.ts          # Standardized ApiResponse envelope
│   │   │   ├── appError.ts             # Operational AppError class
│   │   │   └── asyncHandler.ts         # Async try/catch wrapper
│   │   ├── app.ts                      # Express application assembly
│   │   └── server.ts                   # Process lifecycle and bootstrap
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   │   └── shield.svg
│   ├── src/
│   │   ├── app/
│   │   │   └── App.tsx                 # QueryClient & Router provider
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx       # Main dashboard layout shell
│   │   │   │   ├── AuthLayout.tsx      # Centered auth card layout shell
│   │   │   │   ├── Navbar.tsx          # Top navigation & user profile
│   │   │   │   └── Sidebar.tsx         # Left sidebar navigation
│   │   │   └── ui/
│   │   │       ├── Avatar.tsx          # User initials/avatar pill
│   │   │       ├── Badge.tsx           # Status and priority badges
│   │   │       ├── Button.tsx          # Shadcn-inspired button atom
│   │   │       ├── Card.tsx            # Card wrapper & header components
│   │   │       ├── Input.tsx           # Form input with icon & error slots
│   │   │       └── Modal.tsx           # Accessible backdrop modal dialog
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx       # Screen 2: Login page
│   │   │   │   └── RegisterPage.tsx    # Screen 3: Sign up page
│   │   │   ├── calendar/
│   │   │   │   └── CalendarPage.tsx    # Screen 10: Task & deadline calendar
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx   # Screen 4: Executive dashboard
│   │   │   ├── landing/
│   │   │   │   └── LandingPage.tsx     # Screen 1: Public landing page
│   │   │   ├── projects/
│   │   │   │   └── ProjectsPage.tsx    # Screens 5 & 8: Projects list & creation
│   │   │   ├── reports/
│   │   │   │   └── ReportsPage.tsx     # Screen 11: Reports & analytics charts
│   │   │   ├── settings/
│   │   │   │   └── SettingsPage.tsx    # Screen 12: Profile & preferences
│   │   │   ├── tasks/
│   │   │   │   └── BoardPage.tsx       # Screens 6 & 7: Kanban board & task modal
│   │   │   └── team/
│   │   │       └── TeamPage.tsx        # Screen 9: Team member directory
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── utils.ts                # cn, formatCurrency, formatDate
│   │   ├── routes/
│   │   │   └── index.tsx               # Client route definitions
│   │   ├── services/
│   │   │   └── apiClient.ts            # Axios client with interceptors
│   │   ├── styles/
│   │   │   └── index.css               # Tailwind CSS tokens & theme
│   │   ├── types/
│   │   │   └── index.ts                # Domain types & API response envelopes
│   │   ├── main.tsx                    # React DOM entrypoint
│   │   └── vite-env.d.ts               # Vite TypeScript declarations
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── docs/
│   ├── architecture.md
│   ├── project-structure.md
│   └── technology-stack.md
├── docker-compose.yml
├── .gitignore
├── package.json
└── README.md
```
