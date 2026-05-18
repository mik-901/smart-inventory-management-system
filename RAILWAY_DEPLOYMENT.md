# Railway Deployment Guide - Complete Setup

This guide walks you through deploying the Smart Inventory Management System entirely on Railway.

## Why Railway?

✅ **Single Platform**: API, Frontend, and Database all in one place  
✅ **Automatic CORS Configuration**: No cross-origin issues  
✅ **Better Performance**: Services communicate internally  
✅ **Simpler Environment Variables**: Automatic DNS resolution  
✅ **Cost-Effective**: Free tier with reasonable limits  

---

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Code pushed to GitHub (public or private)
3. **Environment Variables Ready**: Listed below

---

## Step 1: Create GitHub Repository

```bash
git init
git add .
git commit -m "Smart Inventory Management System - Railway Ready"
git branch -M main
git remote add origin https://github.com/your-username/smart-inventory-management-system.git
git push -u origin main
```

---

## Step 2: Deploy on Railway

### Option A: Via Railway Dashboard (Recommended)

1. **Sign In**: Go to [railway.app](https://railway.app) and sign in with GitHub
2. **New Project**: Click **"New Project"** → **"Deploy from GitHub repo"**
3. **Select Repository**: Choose your smart-inventory-management-system repo
4. **Configure Services**:
   - Railway will auto-detect the monorepo structure
   - Select the workspace root to deploy both API and web simultaneously

### Option B: Via Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## Step 3: Set Environment Variables

After initial deployment, configure environment variables for each service:

### Database Service (PostgreSQL)
Railway creates this automatically. Copy the **Internal Database URL** for the API service.

### API Service Variables

Go to **Dashboard** → **API Service** → **Variables**:

```
NODE_ENV=production
PORT=4000
DATABASE_URL=<auto-filled from PostgreSQL service>
CORS_ORIGIN=https://<your-web-domain>.railway.app
JWT_SECRET=<generate-a-random-32-char-string>
JWT_AUDIENCE=smart-inventory
JWT_ISSUER=smart-inventory-api
EMAIL_FROM=noreply@<your-domain>.com
SUPABASE_URL=<optional-if-using-supabase>
SUPABASE_SERVICE_ROLE_KEY=<optional>
CLERK_JWKS_URL=<optional-if-using-clerk>
SMTP_HOST=<your-smtp-server>
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
```

### Web Service Variables

Go to **Dashboard** → **Web Service** → **Variables**:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://<your-api-domain>.railway.app
NEXT_PUBLIC_APP_URL=https://<your-web-domain>.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<optional-if-using-clerk>
CLERK_SECRET_KEY=<optional>
```

---

## Step 4: Database Setup

### Initialize Database Schema

1. **Get Railway SSH Access**:
   ```bash
   railway connect postgres
   ```

2. **Run Migrations**:
   ```bash
   psql -h <railway-db-host> -U postgres -d smart_inventory -f database/schema.sql
   psql -h <railway-db-host> -U postgres -d smart_inventory -f database/seed.sql
   ```

Or use the web dashboard to run SQL:
1. Go to **PostgreSQL Service** → **Query Console**
2. Paste the SQL from `database/schema.sql`
3. Click **Run**

---

## Step 5: Custom Domains (Optional)

1. Go to **Dashboard** → **Service** → **Settings**
2. Click **Custom Domain**
3. Enter your domain (e.g., `api.yourdomain.com` or `app.yourdomain.com`)
4. Configure DNS records as shown in Railway dashboard

---

## Step 6: Verify Deployment

### Test API Health
```bash
curl https://<your-api-domain>.railway.app/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "service": "smart-inventory-api",
  "database": "configured",
  "environment": "production",
  "timestamp": "2026-05-18T..."
}
```

### Test Login
1. Visit: `https://<your-web-domain>.railway.app`
2. Login with demo credentials:
   - Email: `admin@demo.com`
   - Password: `inventory123`
3. If dashboard loads → Deployment successful ✅

---

## Step 7: Enable HTTPS and Security

Railway automatically provides HTTPS for all deployed services. Verify:

1. Visit your app URL in browser
2. Check for the 🔒 lock icon in the address bar
3. All API requests automatically use HTTPS

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://app.yourdomain.com` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | `https://api.yourdomain.com` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (if using) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key |
| `CLERK_JWKS_URL` | Clerk authentication URL |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email configuration |

---

## Troubleshooting

### App Loads Slowly
- **Check**: API → **Logs** tab for slow queries
- **Solution**: Add database indexes, optimize queries
- **Monitor**: Use Railway's built-in **Analytics** tab

### API Returns 401 Unauthorized
- **Check**: Verify `CORS_ORIGIN` matches your web URL exactly
- **Solution**: Update in API service variables
- **Note**: Changes take 30-60 seconds to propagate

### Database Connection Errors
- **Check**: Verify `DATABASE_URL` is set in API variables
- **Solution**: Copy the **Internal Database URL** from PostgreSQL service
- **Test**: Run `psql` command to verify connection

### Features Not Working
- **Check**: API Logs for specific error messages
- **Solution**: Verify all required environment variables are set
- **Debug**: Test API endpoints with curl or Postman

---

## Scaling & Performance

### Upgrade from Starter Plan (Optional)

1. Go to **Service** → **Settings** → **Plan**
2. Select desired tier:
   - **Starter**: Free, auto-pause after 15 min inactivity
   - **Standard**: \$5/month minimum, always active
   - **Pro**: \$12/month minimum, priority support

### Monitor Performance

1. Go to **Dashboard** → **Analytics**
2. Check:
   - **CPU Usage**: Should be < 50% normally
   - **Memory Usage**: Should be < 70%
   - **Network**: Monitor for spikes
   - **Logs**: Check for errors or warnings

---

## Deployment Best Practices

1. **Never Commit Secrets**: Use environment variables for all sensitive data
2. **Regular Backups**: Export database monthly via Railway dashboard
3. **Monitor Logs**: Check logs daily for errors
4. **Test Locally First**: Use `npm run dev` to test before deploying
5. **Stage Changes**: Test in Railway staging environment first

---

## Useful Commands

```bash
# View logs
railway logs

# SSH into service
railway connect

# Run database shell
railway connect postgres

# View running services
railway status

# Restart service
railway up --force
```

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Community**: https://railway.app/community
- **Email**: support@railway.app

---

## Next Steps

1. ✅ Deploy API and Web services
2. ✅ Configure environment variables
3. ✅ Initialize database with schema
4. ✅ Test login and basic features
5. ✅ Set up custom domain (optional)
6. ✅ Configure email (SMTP) for notifications
7. ✅ Enable monitoring and alerts
8. ✅ Set up automated backups

Enjoy your Railway deployment! 🚂
