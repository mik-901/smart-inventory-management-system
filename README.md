# 📦 Smart Inventory Management System

> Full-stack enterprise inventory management — runs **100% locally**, zero cloud dependencies.

Built with **Next.js 16**, **Express**, **Prisma**, and **SQLite**. Features real-time stock updates via Socket.IO, role-based access control, multi-warehouse support, purchase/sales orders, transfers, returns, and rich analytics.

---

## ⚡ Quick Start

```bash
# 1. Clone & install
git clone https://github.com/mik-901/smart-inventory-management-system.git
cd smart-inventory-management-system
npm install

# 2. Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# 3. Seed the database with demo data
cd apps/api && npx tsx prisma/seed.ts && cd ../..

# 4. Start both servers
npm run dev
```

Open **http://localhost:3000** → log in with any demo account below.

---

## 🔐 Demo Accounts

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@demo.com` | `Inventory123` | Full access — users, settings, all modules |
| **Manager** | `manager@demo.com` | `Inventory123` | All operations except user management |
| **Staff** | `staff@demo.com` | `Inventory123` | Orders, inventory, transfers, returns |
| **Viewer** | `viewer@demo.com` | `Inventory123` | Read-only — dashboard, products, reports |

---

## 🌱 Seed Data

Running `npx tsx prisma/seed.ts` populates the database with realistic demo data:

### Users — 4
| Name | Email | Role |
|------|-------|------|
| Aarav Mehta | admin@demo.com | admin |
| Maya Kapoor | manager@demo.com | manager |
| Rohan Singh | staff@demo.com | staff |
| Priya Sharma | viewer@demo.com | viewer |

### Categories — 4
`Electronics` · `Clothing` · `Food & Beverages` · `Office Supplies`

### Suppliers — 2
| Name | City |
|------|------|
| TechDistrib India Pvt Ltd | Mumbai |
| GlobalTex Exporters | Delhi |

### Warehouses — 3
| Name | City | Capacity |
|------|------|----------|
| Mumbai Central Hub | Mumbai | 10,000 units |
| Delhi Distribution Center | Delhi | 8,000 units |
| Bangalore Tech Park | Bangalore | 5,000 units |

### Products — 8
| SKU | Name | Category | Cost | Selling |
|-----|------|----------|------|---------|
| SKU-ELEC-0001 | Wireless Bluetooth Earbuds | Electronics | ₹1,200 | ₹2,499 |
| SKU-ELEC-0002 | USB-C Charging Cable 2m | Electronics | ₹150 | ₹399 |
| SKU-ELEC-0003 | 10000mAh Power Bank | Electronics | ₹600 | ₹1,299 |
| SKU-CLTH-0001 | Cotton Crew Neck T-Shirt | Clothing | ₹250 | ₹699 |
| SKU-CLTH-0002 | Denim Slim Fit Jeans | Clothing | ₹600 | ₹1,499 |
| SKU-FOOD-0001 | Premium Green Tea 100g | Food & Beverages | ₹180 | ₹450 |
| SKU-OFFC-0001 | A4 Copier Paper Ream | Office Supplies | ₹200 | ₹350 |
| SKU-OFFC-0002 | Ballpoint Pen Pack (10) | Office Supplies | ₹80 | ₹150 |

### Inventory — 14 records across 3 warehouses
Includes intentional **low-stock** scenarios to trigger reorder alerts.

### Sample Orders
- **Purchase Order** `PO-2026-00001` — Electronics restock, confirmed, ₹1,50,000
- **Sales Order** `SO-2026-00001` — Bulk retail order, confirmed, ₹24,990
- **Transfer** `TR-2026-00001` — Mumbai → Delhi, draft

### Settings
`company_name` · `currency` (INR) · `low_stock_threshold` · `timezone` (Asia/Kolkata)

---

## 🖥️ Servers

| Service | URL | Command |
|---------|-----|---------|
| Web App | http://localhost:3000 | `npm run dev:web` |
| API | http://localhost:4000 | `npm run dev:api` |
| API Health | http://localhost:4000/health | — |
| Prisma Studio | http://localhost:5555 | `cd apps/api && npx prisma studio` |

Run both together:
```bash
npm run dev          # API + Web concurrently
npm run dev:api      # API only
npm run dev:web      # Web only
```

---

## 🗄️ Database Commands

```bash
# Open database GUI in browser
cd apps/api && npx prisma studio

# Re-seed (clears all data and re-populates)
cd apps/api && npx tsx prisma/seed.ts

# Apply migrations
cd apps/api && npx prisma migrate deploy

# Create new migration after schema changes
cd apps/api && npx prisma migrate dev --name <name>

# Regenerate Prisma client after schema changes
cd apps/api && npx prisma generate
```

The database lives at `apps/api/prisma/dev.db` (SQLite file — no server needed).

---

## 🏗️ Architecture

```
smart-inventory-management-system/   ← npm workspaces monorepo
├── apps/
│   ├── api/                         ← Express + Prisma + Socket.IO (port 4000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        ← 14-model SQLite schema
│   │   │   ├── dev.db               ← SQLite database file
│   │   │   ├── seed.ts              ← Demo data seeder
│   │   │   └── migrations/          ← Prisma migration history
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/            ← Login, register, refresh (JWT)
│   │       │   ├── products/        ← Product CRUD + variants + barcode
│   │       │   ├── inventory/       ← Stock levels + movements + adjustments
│   │       │   ├── warehouses/      ← Multi-warehouse management
│   │       │   ├── purchase-orders/ ← PO workflow (draft → confirmed → received)
│   │       │   ├── sales-orders/    ← SO workflow (draft → shipped → delivered)
│   │       │   ├── transfers/       ← Inter-warehouse stock transfers
│   │       │   ├── returns/         ← Returns processing (sale & purchase)
│   │       │   ├── reports/         ← Analytics + PDF/Excel/CSV export
│   │       │   ├── dashboard/       ← KPI aggregations
│   │       │   ├── suppliers/       ← Supplier management
│   │       │   ├── users/           ← User management (admin only)
│   │       │   ├── notifications/   ← In-app notification centre
│   │       │   ├── activity/        ← Audit log viewer
│   │       │   └── settings/        ← App-wide settings
│   │       ├── middleware/
│   │       │   ├── auth.ts          ← JWT bearer token verification
│   │       │   ├── rbac.ts          ← Role-based access control
│   │       │   └── audit.ts         ← Mutation audit logging
│   │       ├── realtime/
│   │       │   └── socket.ts        ← Socket.IO (inventory & notification events)
│   │       └── config/env.ts        ← Zod-validated environment config
│   └── web/                         ← Next.js 16 App Router (port 3000)
│       └── src/
│           ├── app/                 ← Pages: login, dashboard, products, orders…
│           ├── components/
│           │   ├── ui/              ← Radix UI + shadcn base components
│           │   ├── layout/          ← Sidebar, header, navigation
│           │   └── dashboard/       ← KPI cards, charts (Recharts)
│           └── lib/
│               ├── auth-context.tsx ← JWT auth state (React context)
│               ├── navigation.ts    ← RBAC-aware nav config
│               └── api/             ← Typed API client per module
└── packages/
    └── shared/                      ← Shared TypeScript types
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v3, Radix UI, shadcn/ui |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend | Node.js 20+, Express, TypeScript |
| ORM | Prisma 6 |
| Database | **SQLite** (`dev.db` — zero config) |
| Auth | Custom JWT via `jose` (HS256, access + refresh tokens) |
| Realtime | Socket.IO 4 |
| Exports | PDFKit · ExcelJS · csv-stringify |
| Barcode | html5-qrcode · qrcode.react |
| Monorepo | npm workspaces |

---

## 🌍 Environment Files

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

## 📋 All npm Scripts

```bash
npm run dev          # Start API + Web concurrently
npm run dev:api      # Start API only
npm run dev:web      # Start Web only
npm run build        # Build all workspaces
npm run build:api    # Build API only
npm run lint         # Lint all workspaces
npm run typecheck    # TypeScript check all workspaces
```

---

## 📡 API Endpoints (port 4000)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (public) |
| `POST` | `/auth/login` | Login → returns JWT tokens |
| `POST` | `/auth/register` | Register new account |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/auth/me` | Current user info |
| `GET/POST` | `/products` | Product list / create |
| `GET/PUT/DELETE` | `/products/:id` | Product detail / update / delete |
| `GET/POST` | `/inventory` | Inventory levels |
| `POST` | `/inventory/adjust` | Manual stock adjustment |
| `GET/POST` | `/warehouses` | Warehouse list / create |
| `GET/POST` | `/purchase-orders` | Purchase order list / create |
| `PUT` | `/purchase-orders/:id/receive` | Mark PO as received |
| `GET/POST` | `/sales-orders` | Sales order list / create |
| `GET/POST` | `/transfers` | Transfer list / create |
| `POST` | `/transfers/:id/complete` | Complete transfer |
| `GET/POST` | `/returns` | Returns list / create |
| `GET` | `/dashboard` | KPI metrics |
| `GET` | `/reports/inventory` | Inventory report (PDF/Excel/CSV) |
| `GET` | `/notifications` | Notification centre |
| `GET/PUT` | `/settings` | App settings |
| `GET` | `/users` | User list (admin only) |

All routes except `/health` and `/auth/*` require `Authorization: Bearer <token>`.

---

## 🔒 Role Permissions

| Module | Admin | Manager | Staff | Viewer |
|--------|-------|---------|-------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ✅ | ✅ |
| Warehouses | ✅ | ✅ | ✅ | ✅ |
| Purchase Orders | ✅ | ✅ | ✅ | ❌ |
| Sales Orders | ✅ | ✅ | ✅ | ❌ |
| Transfers | ✅ | ✅ | ✅ | ❌ |
| Returns | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ | ✅ |
| Users | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Activity Log | ✅ | ✅ | ❌ | ✅ |
