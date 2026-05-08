# Vercel Frontend Deployment Guide

## Complete Step-by-Step Setup

### Prerequisites
- ✅ GitHub repository with your code pushed
- ✅ Backend deployed (Render/Railway)
- ✅ Vercel account (vercel.com)

---

## Step 1: Get Your Backend URL

From Render dashboard:
- Go to your service **smart-inventory-api**
- Copy the URL (looks like: `https://smart-inventory-api-xxxxx.onrender.com`)

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Select your GitHub repository
5. Click **Import**
6. Configure project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
7. Click **Deploy**

### Option B: Via Vercel CLI

```bash
npm install -g vercel
cd apps/web
vercel
```

---

## Step 3: Set Environment Variables in Vercel

After deployment completes:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
NEXT_PUBLIC_API_URL=https://smart-inventory-api-xxxxx.onrender.com
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

Replace:
- `https://smart-inventory-api-xxxxx.onrender.com` with your actual Render backend URL
- `your-vercel-app` with your actual Vercel project name

4. Click **Save**
5. Click **Deployments** → **Redeploy** on the latest deployment

---

## Step 4: Verify Backend Connection

1. Visit your Vercel URL: `https://your-vercel-app.vercel.app`
2. Try logging in with demo credentials:
   - Email: `admin@demo.com`
   - Password: `inventory123`
3. If login works, backend is connected ✅

### If Login Fails

Check these:

1. **CORS is enabled on backend**
   - In Render → Environment variables
   - `CORS_ORIGIN` should be your Vercel URL or `*`

2. **Backend URL is correct**
   - In Vercel → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` with correct URL

3. **Database is accessible**
   - Backend should connect to Supabase
   - Check Render logs for database errors

---

## Environment Variables Reference

### Frontend (.env.local in apps/web)

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Backend (.env in apps/api)

```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres:password@host:port/postgres
CORS_ORIGIN=https://your-app.vercel.app
```

---

## Deployment Checklist

- [ ] Backend deployed to Render/Railway
- [ ] Database connected (Supabase)
- [ ] Backend test endpoint works: `https://your-backend.onrender.com/health`
- [ ] Frontend pushed to GitHub
- [ ] Vercel connected to GitHub repo
- [ ] Frontend root directory set to `apps/web`
- [ ] `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] `CORS_ORIGIN` set to Vercel URL on backend
- [ ] Frontend deployed successfully
- [ ] Login with demo credentials works
- [ ] Dashboard loads with real data

---

## After Successful Deployment

### Features Now Available:
✅ Real-time dashboard with live inventory data
✅ Product management with QR codes
✅ Multi-warehouse tracking
✅ Order & returns processing
✅ PDF/CSV/Excel report exports
✅ Real-time notifications via Socket.io
✅ Activity audit logs
✅ Role-based access control

### Demo Users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | inventory123 |
| Manager | manager@demo.com | inventory123 |
| Staff | staff@demo.com | inventory123 |
| Viewer | viewer@demo.com | inventory123 |

---

## Monitoring & Debugging

### View Vercel Logs:
1. Project → **Deployments** → Select latest
2. Click **Logs** tab
3. Search for errors

### Check Backend Logs:
1. Render dashboard → Service → **Logs** tab
2. Look for errors during API calls

### Test API Connectivity:
```bash
# From Vercel function logs or locally
curl -H "Authorization: Bearer <token>" \
  https://your-backend.onrender.com/api/dashboard
```

---

## Troubleshooting

### "Cannot connect to API"
- Verify backend URL in `NEXT_PUBLIC_API_URL`
- Check CORS_ORIGIN on backend
- Test: `curl https://your-backend.onrender.com/health`

### "Build fails on Vercel"
- Check Node.js version (should be 18+)
- Verify `apps/web` is set as root directory
- Check for TypeScript errors: `npm run typecheck`

### "Login doesn't work"
- Backend DATABASE_URL is correct
- CORS is not blocking requests
- Check Render logs for auth errors

### "Slow performance"
- Backend might be on free tier (auto-pausing)
- Upgrade Render plan for always-on service
- Check database query performance

---

## Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| Vercel | **$0-20/mo** | Free tier included, pay per use |
| Render Web | **$0-7/mo** | Free with auto-pause, $7 for always-on |
| Render/Supabase DB | **$0-15/mo** | Free tier shared, $15+ for dedicated |
| **Total** | **$0-42/mo** | Free tier available for testing |

---

## Next: Go Live!

1. ✅ Push final changes to main branch
2. ✅ Vercel auto-deploys on push
3. ✅ Share your URL with users
4. ✅ Monitor Vercel Analytics & Render metrics
5. ✅ Upgrade to paid plans when ready for production

For more info: [Vercel Documentation](https://vercel.com/docs)
