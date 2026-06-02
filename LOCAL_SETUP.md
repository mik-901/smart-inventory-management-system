# Smart Inventory Management System

Full-stack inventory management system — **runs entirely locally** with no cloud dependencies.

---

## Quick Start

```bash
# 1. Install dependencies (run once)
npm install

# 2. Generate Prisma client (run once, or after schema changes)
cd apps/api && npx prisma generate && cd ../..

# 3. Seed the database with demo data (run once)
cd apps/api && npx tsx prisma/seed.ts && cd ../..

# 4. Start both servers
npm run dev
```

That's it. Open **http://localhost:3000** in your browser.

---

## Servers

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | Next.js 16 frontend |
| **API** | http://localhost:4000 | Express REST API |
| **API Health** | http://localhost:4000/health | Health check endpoint |

Run separately if needed:
```bash
npm run dev:api   # API only  → http://localhost:4000
npm run dev:web   # Web only  → http://localhost:3000
```

---

## Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@demo.com | Inventory123 | Full access |
| **Manager** | manager@demo.com | Inventory123 | Everything except user management |
| **Staff** | staff@demo.com | Inventory123 | Operational (orders, inventory) |
| **Viewer** | viewer@demo.com | Inventory123 | Read-only (dashboard, reports) |

---

## Architecture

```
smart-inventory-management-system/
├── apps/
│   ├── api/                        # Express + Prisma backend (port 4000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # SQLite schema (all 14 models)
│   │   │   ├── dev.db              # Local SQLite database file
│   │   │   └── seed.ts             # Demo data seeder
│   │   └── src/
│   │       ├── modules/            # Feature modules
│   │       │   ├── auth/           # JWT login, register, refresh
│   │       │   ├── products/       # Product CRUD + variants
│   │       │   ├── inventory/      # Stock levels + movements
│   │       │   ├── warehouses/     # Warehouse management
│   │       │   ├── purchase-orders/ # PO workflow
│   │       │   ├── sales-orders/   # SO workflow
│   │       │   ├── transfers/      # Inter-warehouse transfers
│   │       │   ├── returns/        # Returns processing
│   │       │   ├── reports/        # Analytics & export (PDF/Excel/CSV)
│   │       │   ├── dashboard/      # KPI aggregations
│   │       │   ├── notifications/  # In-app notifications
│   │       │   └── users/          # User management (admin only)
│   │       ├── middleware/
│   │       │   ├── auth.ts         # JWT bearer token verification
│   │       │   └── rbac.ts         # Role-based access control
│   │       ├── realtime/
│   │       │   └── socket.ts       # Socket.IO server (realtime events)
│   │       └── config/env.ts       # Zod-validated environment config
│   └── web/                        # Next.js 16 frontend (port 3000)
│       └── src/
│           ├── app/                # App Router pages (login, dashboard, etc.)
│           ├── components/
│           │   ├── ui/             # Radix UI + shadcn components
│           │   ├── layout/         # Sidebar, header, nav
│           │   └── dashboard/      # Dashboard widgets + charts
│           └── lib/
│               ├── auth-context.tsx # JWT auth state (React context)
│               └── api/            # Typed API client modules
└── packages/
    └── shared/                     # Shared types (if any)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, Tailwind CSS, Radix UI, Recharts |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | **SQLite** via Prisma ORM (`apps/api/prisma/dev.db`) |
| Auth | Custom JWT (`jose` library) — HS256, access + refresh tokens |
| Realtime | Socket.IO (inventory alerts, notifications) |
| Export | PDFKit, ExcelJS, csv-stringify |

---

## Database Commands

```bash
# View database in browser GUI
cd apps/api && npx prisma studio

# Re-seed demo data (clears & re-populates)
cd apps/api && npx tsx prisma/seed.ts

# Apply pending migrations
cd apps/api && npx prisma migrate deploy

# Create a new migration after schema changes
cd apps/api && npx prisma migrate dev --name <migration-name>
```

---

## Environment Files

### `apps/api/.env`
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./prisma/dev.db"
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=dev-secret-change-in-production-32chars!
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-32chars!
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_AUDIENCE=smart-inventory
JWT_ISSUER=smart-inventory-api
EMAIL_FROM=noreply@localhost.dev
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Key Source Files

| File | Purpose |
|------|---------|
| [`apps/api/src/app.ts`](apps/api/src/app.ts) | Express app setup, all route mounts |
| [`apps/api/src/middleware/auth.ts`](apps/api/src/middleware/auth.ts) | JWT authentication middleware |
| [`apps/api/src/middleware/rbac.ts`](apps/api/src/middleware/rbac.ts) | Role-based access control |
| [`apps/api/src/modules/auth/auth.routes.ts`](apps/api/src/modules/auth/auth.routes.ts) | Login / register / refresh endpoints |
| [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) | Full database schema |
| [`apps/api/prisma/seed.ts`](apps/api/prisma/seed.ts) | Demo data seeder |
| [`apps/web/src/lib/auth-context.tsx`](apps/web/src/lib/auth-context.tsx) | Frontend auth state |
| [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx) | Root layout (providers) |
| [`package.json`](package.json) | Monorepo scripts |
