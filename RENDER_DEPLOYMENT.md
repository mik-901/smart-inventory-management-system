# Render Deployment Guide

## Project Overview
This is a full-stack inventory management system with:
- **Frontend**: Next.js deployed on Vercel
- **Backend**: Express.js Node.js server deployed on Render
- **Database**: PostgreSQL on Render

---

## Prerequisites
1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. Environment variables ready for your backend

---

## Step 1: Push Code to GitHub

If not already done:
```bash
git init
git add .
git commit -m "Smart Inventory Management System"
git branch -M main
git remote add origin https://github.com/your-username/smart-inventory-management-system.git
git push -u origin main
```

---

## Step 2: Create PostgreSQL Database on Render

### Option A: Create Database via Render Dashboard
1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **PostgreSQL**
3. Enter these details:
   - **Name**: `smart-inventory-db`
   - **Database**: `smart_inventory`
   - **User**: `postgres` (default)
   - **Region**: Select the same region as your web service (Oregon recommended)
   - **Plan**: Starter (free tier)
4. Click **Create Database**
5. Copy the **Internal Database URL** (you'll need this)

### Option B: Create via render.yaml
The `render.yaml` file in the root directory includes database configuration. Render will auto-create the database when deploying.

---

## Step 3: Deploy Backend Web Service

### Via render.yaml (Recommended)
1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Select **Deploy existing code**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `smart-inventory-api`
   - **Runtime**: Node
   - **Region**: `oregon` (or your preferred region)
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
6. Click **Create Web Service**

### Via Dashboard (Manual Setup)
If you prefer manual configuration:

1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `smart-inventory-api`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Environment**: `production`
4. Click **Create Web Service**

---

## Step 4: Set Environment Variables

### In Render Dashboard:
1. Go to your web service → **Environment**
2. Add the following environment variables:

```
NODE_ENV = production
PORT = 4000
DATABASE_URL = postgresql://user:password@host:port/smart_inventory

CORS_ORIGIN = https://your-vercel-app.vercel.app
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

### If using render.yaml:
Environment variables are already configured in the file. You just need to set the values in the Render dashboard.

---

## Step 5: Initialize Database Schema

### Using Render Web Service Terminal:
1. Go to your web service in Render
2. Click **Shell** tab
3. Connect to the database:
```bash
psql $DATABASE_URL < ../../../database/schema.sql
psql $DATABASE_URL < ../../../database/seed.sql
```

### Using psql from Your Local Machine:
```bash
psql "postgresql://user:password@host:port/smart_inventory" < database/schema.sql
psql "postgresql://user:password@host:port/smart_inventory" < database/seed.sql
```

---

## Step 6: Update Frontend Environment Variables

If using Vercel for frontend, update your environment variables:

**In Vercel Dashboard** → Project Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://your-smart-inventory-api.onrender.com
NEXT_PUBLIC_APP_URL = https://your-vercel-app.vercel.app
```

---

## Deployment Workflow

### Every Time You Push to GitHub:
1. Push changes to `main` branch:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. Render automatically detects changes and redeploys

3. Check deployment status:
   - Go to your service in Render dashboard
   - Click **Logs** tab to see build and deployment logs
   - Once deployment is complete, visit your service URL

---

## Monitoring & Debugging

### View Logs:
1. Web Service → **Logs** tab
2. Check build logs and runtime logs

### Database Connection Issues:
```bash
# Test connection from service shell
psql $DATABASE_URL -c "SELECT version();"
```

### Check Service Health:
- Render shows uptime and status in the dashboard
- Free tier services auto-pause after 15 minutes of inactivity

---

## Pricing & Limitations

### Free Tier (Starter):
- **Uptime**: 99.9%
- **Auto-pause**: After 15 minutes of inactivity (wakes up on request)
- **Compute**: 0.5 CPU, 512 MB RAM
- **Database**: Shared PostgreSQL (1 GB)
- **Cost**: FREE

### Paid Tiers:
- **Pro**: $7/month for web service (always on)
- **Premium Database**: Starting at $15/month

### Upgrading:
Go to service settings and select a paid plan to avoid auto-pause and get guaranteed uptime.

---

## Useful Render.com Commands

### View Real-time Logs:
```bash
# After logging in to Render CLI
render logs --service-id <your-service-id>
```

### Deploy via CLI:
```bash
npm install -g render
render deploy --service-id <your-service-id>
```

---

## Troubleshooting

### Service Won't Start
- Check **Logs** in Render dashboard
- Verify `NODE_ENV=production` is set
- Ensure build command succeeds: `npm install && npm run build`

### Database Connection Failed
- Verify `DATABASE_URL` environment variable is set
- Check database is running (not deleted)
- Ensure IP whitelist allows connections (Render's servers should be whitelisted automatically)

### Port Issues
- Ensure PORT environment variable is set to `4000`
- Render assigns dynamic ports; your env var should use process.env.PORT

### CORS Errors
- Update `CORS_ORIGIN` to your Vercel frontend URL
- Backend should have correct CORS middleware configuration

---

## Next Steps

1. ✅ Create PostgreSQL database
2. ✅ Deploy web service via render.yaml or dashboard
3. ✅ Set environment variables
4. ✅ Initialize database with schema and seed data
5. ✅ Update frontend API URL in Vercel
6. ✅ Test the application

For more info, visit: [Render.com Documentation](https://render.com/docs)
