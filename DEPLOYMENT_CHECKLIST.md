# 🚀 Quick Deployment Checklist

Use this checklist to ensure everything is configured correctly before deploying.

---

## ✅ Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Created Supabase project
- [ ] Noted database password (saved securely)
- [ ] Copied Session Pooler connection string
- [ ] URL-encoded special characters in password
- [ ] Converted to psycopg format: `postgresql+psycopg://...`
- [ ] Ran database migrations locally:
  ```bash
  cd backend
  export DATABASE_URL="your_supabase_url"
  export FLASK_APP=run.py
  flask db upgrade
  ```
- [ ] Verified tables created in Supabase Dashboard → Database → Tables
- [ ] (Optional) Seeded demo data

### 2. Git Repository
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.env` is in `.gitignore` (never commit secrets!)
- [ ] All changes committed
- [ ] Latest code pushed to main branch

### 3. Vercel Project Setup
- [ ] Imported repository to Vercel
- [ ] Selected correct Git repository
- [ ] Framework preset: `Vite` (auto-detected)
- [ ] Root directory: `./`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### 4. Environment Variables in Vercel
Go to: Project Settings → Environment Variables → Add each:

#### Required Variables (Must Set)
- [ ] `DATABASE_URL` = Your Supabase connection string with `postgresql+psycopg://` prefix
- [ ] `SECRET_KEY` = Generate new: `python -c "import secrets; print(secrets.token_hex(32))"`
- [ ] `VITE_API_BASE_URL` = `/api`

#### Security Variables
- [ ] `FLASK_DEBUG` = `false`
- [ ] `JWT_ALGORITHM` = `HS256`
- [ ] `JWT_ACCESS_EXPIRES_SECONDS` = `3600`
- [ ] `JWT_REFRESH_EXPIRES_SECONDS` = `604800`

#### Database Control (Disable Auto-Creation in Production)
- [ ] `DB_AUTO_CREATE` = `false`
- [ ] `SEED_DEMO_DATA` = `false`
- [ ] `RULES_SEED_VERSION` = `v2`
- [ ] `DB_FALLBACK_ENABLED` = `false`

#### CORS (Update After First Deploy)
- [ ] `CORS_ORIGINS` = First deploy: `http://localhost:5173`
- [ ] After deployment, update to: `https://your-actual-domain.vercel.app,http://localhost:5173`

#### Optional
- [ ] `VITE_API_TIMEOUT_MS` = `20000`

### 5. Deploy
- [ ] Clicked "Deploy" in Vercel
- [ ] Or pushed to git: `git push origin main`
- [ ] Waited for build to complete (~2-5 minutes)
- [ ] Noted Vercel URL: `https://your-app-name.vercel.app`

### 6. Post-Deployment
- [ ] Updated `CORS_ORIGINS` with actual Vercel domain
- [ ] Redeployed for CORS changes to take effect
- [ ] Tested API endpoint: `https://your-app.vercel.app/api`
- [ ] Tested health check: `https://your-app.vercel.app/api/health`
- [ ] Tested frontend: `https://your-app.vercel.app`
- [ ] Tested login with demo account

---

## 🧪 Testing Endpoints

### 1. Test Backend API
```bash
curl https://your-app-name.vercel.app/api
```

Expected response:
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

### 2. Test Health Endpoint
```bash
curl https://your-app-name.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### 3. Test Frontend
Open in browser: `https://your-app-name.vercel.app`

Should see login page without errors.

### 4. Test Login (If Demo Data Seeded)
- Admin: `admin@example.com` / `admin123`
- Doctor: `doctor@example.com` / `doctor123`
- Patient: `patient@example.com` / `patient123`

---

## 🐛 Common Issues Quick Fix

### "Cannot connect to database"
```bash
# Check your DATABASE_URL format:
# ✅ Correct: postgresql+psycopg://postgres.xxx:password@...pooler.supabase.com:5432/postgres
# ❌ Wrong: postgresql://postgres.xxx:password@...supabase.com:5432/postgres
```

### "CORS Error"
1. Add your Vercel domain to `CORS_ORIGINS`
2. Redeploy

### "Module not found"
1. Check `api/requirements.txt` is up to date
2. Redeploy

### "Tables don't exist"
```bash
# Run migrations against Supabase
cd backend
export DATABASE_URL="your_supabase_url"
export FLASK_APP=run.py
flask db upgrade
```

---

## 📝 Environment Variable Template

Copy this to a secure note (never commit!):

```env
# Supabase Connection
DATABASE_URL=postgresql+psycopg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Security (Generate new SECRET_KEY!)
SECRET_KEY=[Generate: python -c "import secrets; print(secrets.token_hex(32))"]
FLASK_DEBUG=false
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRES_SECONDS=3600
JWT_REFRESH_EXPIRES_SECONDS=604800

# Database Control
DB_AUTO_CREATE=false
SEED_DEMO_DATA=false
RULES_SEED_VERSION=v2
DB_FALLBACK_ENABLED=false

# CORS (Update with your actual Vercel domain!)
CORS_ORIGINS=https://your-app-name.vercel.app,http://localhost:5173

# Frontend
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=20000
```

---

## 🎯 Deployment Commands

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# View logs
vercel logs

# Pull environment variables locally
vercel env pull

# Test locally with Vercel dev server
vercel dev
```

---

## ✨ You're Done!

Once all checkboxes are complete, your app should be live at:
**`https://your-app-name.vercel.app`** 🎉

---

## 📞 Need Help?

Refer to the complete guide: `DEPLOYMENT_GUIDE.md`
