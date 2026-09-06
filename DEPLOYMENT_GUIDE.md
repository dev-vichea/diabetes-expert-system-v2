# 🚀 Complete Deployment Guide: Vercel + Supabase

This guide walks you through deploying your Diabetes Expert System to Vercel with Supabase database.

## 📋 Prerequisites

- [Vercel Account](https://vercel.com/signup) (free tier works)
- [Supabase Account](https://supabase.com) (free tier works)
- [Vercel CLI](https://vercel.com/docs/cli) (optional but recommended)
- Git repository (GitHub, GitLab, or Bitbucket)

---

## Part 1: Setting Up Supabase Database 🗄️

### Step 1.1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in:
   - **Name**: `diabetes-expert-system`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
4. Click **"Create new project"** (takes ~2 minutes)

### Step 1.2: Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **"URI"** tab
4. Find the **"Session mode"** connection string (for connection pooling)
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
6. **Important**: Replace `[PASSWORD]` with your actual database password

### Step 1.3: Format for psycopg (Python)

Your app uses `psycopg` (not `psycopg2`), so the connection string needs `postgresql+psycopg://` prefix:

```
postgresql+psycopg://postgres.pujclmfwdkuaxmhbllza:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**URL Encode Special Characters**: If your password contains special characters like `@`, `#`, `:`, use URL encoding:
- `@` → `%40`
- `#` → `%23`
- `:` → `%3A`
- `)` → `%29`

Example: Password `hello:world)` becomes `hello%3Aworld%29`

### Step 1.4: Initialize Database Schema (One-Time Setup)

You need to run migrations to create tables. Do this locally first:

```bash
# From project root
cd backend

# Activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your Supabase DATABASE_URL temporarily
export DATABASE_URL="postgresql+psycopg://postgres.xxx:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"

# Run migrations
export FLASK_APP=run.py
flask db upgrade

# Optional: Seed demo data (admin accounts, sample rules)
export DB_AUTO_CREATE=true
export SEED_DEMO_DATA=true
python run.py
# Press Ctrl+C after it starts (seeding happens on startup)
```

**Verify in Supabase**:
- Go to **Database** → **Tables** in Supabase dashboard
- You should see tables like: `users`, `patients`, `diagnoses`, `rules`, `audit_logs`, etc.

---

## Part 2: Deploying to Vercel 🌐

### Step 2.1: Prepare Your Repository

1. Make sure your code is pushed to GitHub/GitLab/Bitbucket
2. Ensure `.env` is in `.gitignore` (don't commit secrets!)

```bash
# Check git status
git status

# If you have uncommitted changes
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2.2: Import Project to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..." → Project**
3. Import your Git repository
4. Configure:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (from root package.json)
   - **Output Directory**: `dist`
5. **Don't deploy yet!** Click **"Configure Project"** to add environment variables first

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# From project root
vercel login
vercel
# Follow prompts - select your settings
```

### Step 2.3: Configure Environment Variables in Vercel

Go to your project in Vercel → **Settings** → **Environment Variables**

Add the following variables (copy from `.env.vercel` as reference):

#### Backend Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DATABASE_URL` | `postgresql+psycopg://postgres.[REF]:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres` | Production, Preview, Development |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` | Production, Preview, Development |
| `FLASK_DEBUG` | `false` | Production |
| `JWT_ALGORITHM` | `HS256` | All |
| `JWT_ACCESS_EXPIRES_SECONDS` | `3600` | All |
| `JWT_REFRESH_EXPIRES_SECONDS` | `604800` | All |
| `DB_AUTO_CREATE` | `false` | All |
| `SEED_DEMO_DATA` | `false` | All |
| `RULES_SEED_VERSION` | `v2` | All |
| `DB_FALLBACK_ENABLED` | `false` | All |

#### CORS Configuration

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `CORS_ORIGINS` | `https://your-app-name.vercel.app,http://localhost:5173` | All |

**Note**: Replace `your-app-name` with your actual Vercel domain after first deployment.

#### Frontend Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_BASE_URL` | `/api` | All |
| `VITE_API_TIMEOUT_MS` | `20000` | All |

**Important**: 
- Click **"Add"** for each variable
- Select appropriate environments (Production, Preview, Development)
- Click **"Save"** after adding all variables

### Step 2.4: Deploy!

1. Go to **Deployments** tab
2. Click **"Redeploy"** or trigger a new deployment
3. Or simply push to your git repository:
   ```bash
   git push origin main
   ```

Vercel will:
1. Install frontend dependencies (`npm install`)
2. Build React app (`npm run build`)
3. Copy frontend `dist/` to root
4. Start Python serverless function at `/api`

### Step 2.5: Update CORS After First Deploy

1. Note your Vercel URL: `https://your-app-name.vercel.app`
2. Go back to **Environment Variables**
3. Update `CORS_ORIGINS` to include your actual domain:
   ```
   https://your-actual-domain.vercel.app,http://localhost:5173
   ```
4. Redeploy for changes to take effect

---

## Part 3: Verify Deployment ✅

### Test Backend API

Visit: `https://your-app-name.vercel.app/api`

Should return:
```json
{
  "success": true,
  "data": {
    "name": "Diabetes Expert System API",
    "version": "2.0",
    "status": "online"
  }
}
```

### Test Health Endpoint

Visit: `https://your-app-name.vercel.app/api/health`

Should return:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### Test Frontend

Visit: `https://your-app-name.vercel.app`

You should see the login page. Try logging in with demo accounts (if seeded):
- **Admin**: `admin@example.com` / `admin123`
- **Doctor**: `doctor@example.com` / `doctor123`
- **Patient**: `patient@example.com` / `patient123`

---

## Part 4: Common Issues & Troubleshooting 🔧

### Issue 1: "Failed to connect to database"

**Cause**: Wrong DATABASE_URL or Supabase connection issue

**Solutions**:
1. Verify DATABASE_URL format: `postgresql+psycopg://...`
2. Check Supabase project is running (not paused on free tier)
3. Verify password is URL-encoded properly
4. Use **Session mode** pooler URL (not Transaction mode)
5. Check Supabase **Database Settings** → verify connection pooling is enabled

### Issue 2: "CORS Error" in Browser Console

**Cause**: Frontend domain not in CORS_ORIGINS

**Solution**:
1. Add your Vercel domain to `CORS_ORIGINS` environment variable
2. Format: `https://your-app.vercel.app,http://localhost:5173`
3. Redeploy after updating

### Issue 3: "Module not found" errors

**Cause**: Missing dependencies in `api/requirements.txt`

**Solution**:
1. Verify `api/requirements.txt` includes all backend dependencies
2. Compare with `backend/requirements.txt`
3. If missing, copy dependencies and redeploy

### Issue 4: "Tables don't exist" errors

**Cause**: Database migrations not run

**Solution**:
Run migrations locally against Supabase:
```bash
cd backend
export DATABASE_URL="your_supabase_url"
export FLASK_APP=run.py
flask db upgrade
```

### Issue 5: API Routes Return 404

**Cause**: Vercel routing misconfiguration

**Solution**:
1. Verify `vercel.json` has proper rewrites:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api"
       },
       {
         "source": "/api",
         "destination": "/api"
       },
       {
         "source": "/((?!api/).*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
2. Ensure `api/index.py` exists
3. Redeploy

### Issue 6: Slow Cold Starts

**Cause**: Vercel serverless functions have cold starts (especially on free tier)

**Solutions**:
- First request may take 5-10 seconds (normal for serverless)
- Consider upgrading to Vercel Pro for faster cold starts
- Keep database queries optimized
- Add loading states in frontend

---

## Part 5: Environment-Specific Configuration 🔀

### Development (Local)
```bash
# backend/.env
DATABASE_URL=sqlite:///dev_local.db  # Or your local PostgreSQL
FLASK_DEBUG=true
CORS_ORIGINS=http://localhost:5173

# frontend/.env
VITE_API_BASE_URL=http://localhost:5001/api
```

### Production (Vercel + Supabase)
```bash
# Vercel Environment Variables
DATABASE_URL=postgresql+psycopg://...supabase.com:5432/postgres
FLASK_DEBUG=false
CORS_ORIGINS=https://your-app.vercel.app
VITE_API_BASE_URL=/api  # Same-origin API
```

---

## Part 6: Continuous Deployment 🔄

### Automatic Deployments

Vercel automatically deploys when you push to Git:

1. **Production Branch** (usually `main`):
   ```bash
   git push origin main
   ```
   → Deploys to: `https://your-app.vercel.app`

2. **Preview Branches** (any other branch):
   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   ```
   → Deploys to: `https://your-app-git-feature-new-feature.vercel.app`

### Manual Redeployment

Via CLI:
```bash
vercel --prod  # Deploy to production
vercel         # Deploy preview
```

Via Dashboard:
- Go to **Deployments** tab
- Click **"..."** → **"Redeploy"**

---

## Part 7: Monitoring & Logs 📊

### View Vercel Logs

1. Go to your project in Vercel Dashboard
2. Click **"Deployments"** → Select a deployment
3. Click **"Functions"** tab → Select `/api`
4. View real-time logs

### View Supabase Logs

1. Go to Supabase Dashboard
2. Click **"Logs"** in sidebar
3. Select **"Postgres Logs"** or **"Database"**
4. Monitor queries and connections

---

## Part 8: Security Checklist ✅

- [ ] Strong `SECRET_KEY` generated (not `hellohibyebye`!)
- [ ] Database password is strong and URL-encoded
- [ ] `.env` files are in `.gitignore`
- [ ] `FLASK_DEBUG=false` in production
- [ ] CORS only allows your domains
- [ ] Supabase Row Level Security (RLS) enabled (optional but recommended)
- [ ] JWT expiry times are reasonable
- [ ] Regular backups enabled in Supabase

---

## Part 9: Cost Optimization 💰

### Vercel Free Tier Limits
- ✅ 100GB bandwidth/month
- ✅ 100 deployments/day
- ✅ Serverless function execution
- ⚠️ Cold starts on API routes

### Supabase Free Tier Limits
- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ 60 concurrent connections
- ⚠️ Project pauses after 7 days inactivity (unpause manually)

**Tip**: Keep Supabase active by pinging `/api/health` periodically (use Uptime Robot or similar)

---

## Part 10: Custom Domain (Optional) 🌐

### Add Custom Domain to Vercel

1. Go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `diabetes-diagnosis.example.com`
4. Follow DNS configuration instructions
5. Add domain to `CORS_ORIGINS` environment variable
6. Redeploy

---

## Quick Reference Commands 📝

```bash
# Deploy to Vercel
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull

# Test locally with Vercel environment
vercel dev

# Database migrations
cd backend
export DATABASE_URL="your_supabase_url"
export FLASK_APP=run.py
flask db upgrade
```

---

## Support & Resources 🆘

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Flask on Vercel Guide](https://vercel.com/docs/frameworks/flask)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## Summary

You now have:
- ✅ Supabase PostgreSQL database (free hosted)
- ✅ Backend API running on Vercel serverless functions
- ✅ Frontend React app on Vercel CDN
- ✅ Automatic deployments from Git
- ✅ Production-ready configuration

**Your app is live at**: `https://your-app-name.vercel.app` 🎉
