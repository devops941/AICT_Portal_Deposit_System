# AICTE Security Deposit & FDR Lifecycle Management Portal

Enterprise-grade MERN Stack web application designed for the lifecycle tracking, verification, bank endorsement, and release management of AICTE institutional Fixed Deposit Receipts (FDR) and Security Deposits.

---

## 🎨 Visual Interface & Design System

The application features the **TaskFlow** modern design system:
- **Color Palette**: Violet / Indigo primary (`#6366f1` / `#7c3aed`), crisp slate backgrounds, and emerald/amber/rose status accents.
- **Components**: Rounded cards (`rounded-2xl`), subtle borders, soft drop shadows, and responsive layouts.
- **Pages Implemented (Screens 1 - 12)**:
  1. **Landing Page (`/`)**: Public hero, features, and demo preview.
  2. **Login Page (`/login`)**: Centered authentication card with email/password and SSO.
  3. **Sign Up Page (`/register`)**: Account creation card with validation hints.
  4. **Dashboard (`/dashboard`)**: Stat metrics, Recharts doughnut chart, upcoming deadlines, activity feed, and checklist.
  5. **Projects List (`/projects`)**: Filterable project cards with progress bars and avatar stacks.
  6. **Kanban Board (`/board`, `/tasks`)**: Multi-column board (To Do, In Progress, Review, Done) with task tags.
  7. **Task Details Modal**: Deep inspection of priorities, assignees, dates, files, and comments.
  8. **Create Project Modal**: Workspace setup with name, dates, members, and color picker.
  9. **Team Management (`/team`)**: Clean member directory with role badges and invite modal.
  10. **Calendar View (`/calendar`)**: Interactive month calendar with task pills.
  11. **Reports & Analytics (`/reports`)**: Area completion charts, tasks by status, and team progress.
  12. **Profile Settings (`/settings`)**: Account details, avatar upload, and preferences.

---

## ⚙️ Prerequisites

- **Node.js**: v20+ (tested on Node v24.19.0)
- **MongoDB**: v6+ running locally on port 27017 or via Docker Compose
- **npm**: v10+

---

## 🚀 Quick Start Guide

### 1. Installation

Install all backend and frontend dependencies:

```bash
# Root shortcut
npm run install:all

# Or individually
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Variables

Create `.env` files from the provided templates:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers

Run backend and frontend concurrently:

```bash
# Start backend (Port 5000)
npm run dev:backend

# Start frontend (Port 5173) in a separate terminal
npm run dev:frontend
```

Once running:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **System Health & DB Ping**: [http://localhost:5000/api/health/system](http://localhost:5000/api/health/system)

---

## 🐳 Docker Deployment

To spin up MongoDB, Redis, Backend, and Frontend containers simultaneously:

```bash
docker-compose up -d
```

---

## 🏛️ Architecture Highlights

### Backend (Node.js + Express + TypeScript)
- **Modular 6-Layer Architecture**: Every feature contains routes, controller, service, repository, validation, and types.
- **Centralized Error Handling**: `AppError` and `errorHandler` handle validation, database, and operational errors cleanly.
- **Standardized API Envelope**: Uniform JSON schema with status, message, data, meta, and timestamp.
- **Request Validation**: Zod-based `validateRequest` middleware.
- **Database Resilience**: Mongoose connection management with graceful shutdown on SIGINT/SIGTERM.

### Frontend (React + TypeScript + Vite)
- **Feature-Driven Architecture**: Clear folder separation for `dashboard`, `auth`, `projects`, `tasks`, `calendar`, `reports`, and `settings`.
- **State Management**: TanStack Query for server state caching.
- **Type Safety**: TypeScript definitions matching API response contracts.

---

## 🧪 Validation & Type Checking

To verify TypeScript compilation across both projects:

```bash
npm run typecheck
```

To build production bundles:

```bash
npm run build
```
