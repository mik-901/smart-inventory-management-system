# Vercel Deployment Guide

## Project Overview
This is a full-stack inventory management system with:
- **Frontend**: Next.js 16+ with React, TypeScript, Tailwind CSS
- **Backend**: Express.js server (needs separate deployment)
- **Database**: PostgreSQL/Supabase

## Frontend Deployment to Vercel (Next.js)

### Prerequisites
1. Vercel account (vercel.com)
2. GitHub, GitLab, or Bitbucket repository
3. Clerk authentication keys (optional - for auth features)

### Step 1: Push to Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Smart Inventory Management System"
git branch -M main
git remote add origin https://github.com/your-username/smart-inventory-management-system.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to vercel.com and sign in
2. Click "New Project" → "Import Git Repository"
3. Select your GitHub/GitLab/Bitbucket repo
4. **Framework Preset**: Next.js
5. **Root Directory**: Select `apps/web`
6. Click "Deploy"

### Step 3: Set Environment Variables on Vercel
1. Go to your Vercel project settings → "Environment Variables"
2. Add these variables:

```
NEXT_PUBLIC_API_URL = https://your-backend-api.com
NEXT_PUBLIC_APP_URL = https://your-project-name.vercel.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_xxxxx (from Clerk)
CLERK_SECRET_KEY = sk_live_xxxxx (from Clerk)
```

### Step 4: Configure Root Directory (if needed)
If the build fails, go to Project Settings → General:
- Set **Root Directory** to `apps/web`
- Set **Build Command** to `npm run build`
- Set **Install Command** to `npm install`

---

## Backend Deployment (Express.js)

The Express backend needs to be deployed separately. Options:

### Option A: Deploy to Railway (Recommended)
1. Create Railway account (railway.app)
2. Connect your GitHub repository
3. Create a new project → Select your repo
4. Select `apps/api` as the root directory
5. Add environment variables:

```
DATABASE_URL = postgresql://user:pass@host:port/dbname
PORT = 4000
CORS_ORIGIN = https://your-vercel-app.vercel.app
NODE_ENV = production
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = xxxxx
CLERK_JWKS_URL = https://xxxxx.clerk.accounts.com/.well-known/jwks.json
JWT_AUDIENCE = smart-inventory
JWT_ISSUER = https://xxxxx.clerk.accounts.com
SMTP_HOST = your-smtp-host
SMTP_PORT = 587
SMTP_USER = your-email@example.com
SMTP_PASS = your-smtp-password
EMAIL_FROM = noreply@yourdomain.com
```

### Option B: Deploy to Heroku
Similar steps - create a new app and connect your GitHub repo.

### Option C: Deploy to Render (Recommended Free Tier)
1. Create Render account (render.com)
2. Go to **New +** → **Web Service**
3. Connect your GitHub repository
4. Configuration:
   - **Name**: `smart-inventory-api`
   - **Root Directory**: `apps/api`
   - **Runtime**: Node
   - **Region**: oregon (or your preference)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Click **Create Web Service**
6. Add the same environment variables as Railway (see above)
7. (Optional) Create PostgreSQL database in Render or use external provider

**Key Differences from Railway:**
- Free tier includes auto-pause (wakes on request after 15 min inactivity)
- Can deploy from `render.yaml` in root directory (already included)
- Built-in PostgreSQL available at $15/month
- No credit card required for free tier

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed Render setup guide.

---

## Database Setup

### Using Supabase (Recommended)
1. Create a Supabase project at supabase.com
2. Create a new database
3. Run `database/schema.sql` in the SQL editor
4. Run `database/seed.sql` to load demo data
5. Copy the connection string to your backend `DATABASE_URL`

### Using Local PostgreSQL
```bash
createdb smart_inventory
psql smart_inventory < database/schema.sql
psql smart_inventory < database/seed.sql
```

---

## Features Enabled After Deployment

✅ Premium responsive dashboard
✅ Product/SKU management with QR codes
✅ Multi-warehouse inventory tracking
✅ Order & returns management
✅ Real-time Socket.io events
✅ CSV/PDF/Excel report exports
✅ JWT/RBAC authentication
✅ Activity logging & audit trails
✅ PWA support with offline caching

---

## Demo Credentials
```
Admin: admin@demo.com / inventory123
Manager: manager@demo.com / inventory123
Staff: staff@demo.com / inventory123
Viewer: viewer@demo.com / inventory123
```

---

## Troubleshooting

### Build Fails on Vercel
- Check Node.js version: Project Settings → General → Node.js Version (20.15+)
- Clear build cache: Settings → General → Clear Cache

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` matches your deployed backend
- Check CORS settings in `apps/api/src/app.ts`

### Environment Variables Not Loading
- Use `NEXT_PUBLIC_` prefix for frontend variables
- Backend vars don't need prefix but must be set in Railway/Heroku

---

## Local Development
```bash
npm install
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

## Additional Resources
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
