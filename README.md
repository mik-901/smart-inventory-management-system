# Smart Inventory Management System

This folder contains the full-stack web app requested for your inventory product. Your existing Flutter starter remains untouched in the project root; all new web/backend code lives here.

## Where Everything Goes

- `apps/web` - Next.js + React + TypeScript + Tailwind + shadcn-style UI + Framer Motion + Recharts frontend.
- `apps/api` - Node.js + Express + TypeScript backend with JWT/RBAC middleware, validation, report exports, and Socket.io events.
- `database/schema.sql` - Supabase/PostgreSQL production schema.
- `database/seed.sql` - Demo seed data for users, products, warehouses, stock, orders, returns, audit logs, and notifications.
- `.env.example` - Copy values into `apps/web/.env.local` and `apps/api/.env`.

## Demo Login

The UI includes portfolio demo credentials:

- `admin@demo.com` / `inventory123` - Super Admin
- `manager@demo.com` / `inventory123` - Manager
- `staff@demo.com` / `inventory123` - Warehouse Staff
- `viewer@demo.com` / `inventory123` - Viewer

## Local Setup

```bash
cd smart-inventory-management-system
npm install
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
npm run dev
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:4000`

The app runs in demo mode even before Supabase is connected. To use the real database, create a Supabase project, run `database/schema.sql`, then `database/seed.sql`, and set `DATABASE_URL` in `apps/api/.env`.

## Deployment

- Deploy `apps/web` to Vercel.
- Deploy `apps/api` to Railway.
- Use Supabase PostgreSQL for the database.
- Set the same API/auth/database environment variables in each hosting provider.

## Included Features

- Premium responsive dashboard with KPI cards, charts, AI demand prediction, reorder suggestions, and activity feed.
- Product/SKU management with variants, supplier data, QR codes, barcode fields, batch/expiry fields, and image metadata.
- Inventory adjustments, multi-warehouse stock, transfer flows, low-stock alerts, and realtime-ready Socket.io events.
- Orders, returns, warehouses, users/roles, activity logs, reports, and settings pages.
- CSV/PDF/Excel report export endpoints.
- PWA manifest and service worker for offline shell caching.
- JWT/RBAC middleware, Zod validation, Helmet/CORS hardening, and SQL schema with indexes.
