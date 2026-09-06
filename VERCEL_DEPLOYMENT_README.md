# 🚀 Deploy to Vercel - Quick Start

This is a streamlined guide to get your Diabetes Expert System live on Vercel with Supabase in **under 15 minutes**.

---

## 📦 What You're Deploying

**Architecture:**
```
Frontend (React + Vite) → Vercel CDN
         ↓
    /api routes → Vercel Serverless Functions (Python Flask)
         ↓
    Supabase PostgreSQL Database
```

**Benefits:**
- ✅ **Free hosting** (generous free tiers)
- ✅ **Global CDN** for fast frontend
- ✅ **Serverless scaling** for backend
- ✅ **Automatic HTTPS**
- ✅ **Auto-deploy on git push**
- ✅ **Managed database** with backups

---

## 🎯 Quick Start (3 Steps)

### Step 1: Setup Supabase (5 minutes)

1. **Create account**: https://supabase.com/dashboard
2. **New project**:
   - Name: `diabetes-expert-system`
   - Database password: **Save this!**
   - Region: Choose closest to users
3. **Get connection string**:
   - Settings → Database → Connection String
   - Copy **"Session mode"** URI
   - Format: `postgresql://postgres.xxx:[PASSWORD]@...pooler.supabase.com:5432/postgres`
4. **Initialize database**:
   ```bash
   # From project root
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   
   # Replace with your Supabase URL (add postgresql+psycopg:// prefix)
   export DATABASE_URL="postgresql+psycopg://postgres.xxx:[PASSWORD]@...pooler.supabase.com:5432/postgres"
   export FLASK_APP=run.py
   
   # Create tables
   flask db upgrade
   ```

### Step 2: Deploy to Vercel (3 minutes)

1. **Push code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Import your repository
   - Framework: `Vite` (auto-detected)
   - **Don't deploy yet!** → Click "Configure Project"

3. **Add environment variables** (see table below)

4. **Deploy!** → Click "Deploy"

### Step 3: Configure & Test (2 minutes)

1. **Note your URL**: `https://your-app-name.vercel.app`
2. **Update CORS**: Add your URL to `CORS_ORIGINS` in Vercel env vars
3. **Redeploy** (Vercel will auto-redeploy)
4. **Test**: 
   - Visit: `https://your-app-name.vercel.app/api` (should show API info)
   - Visit: `https://your-app-name.vercel.app` (should show login)

---

## 🔑 Vercel Environment Variables

Copy these to **Vercel → Settings → Environment Variables**:

### Core Variables (Required)

| Variable | Value | How to Get |
|----------|-------|------------|
| `DATABASE_URL` | `postgresql+psycopg://postgres.xxx:[PASS]@...` | From Supabase (Session mode URI) |
| `SECRET_KEY` | `<random-64-char-hex>` | Run: `python generate_secret_key.py` |
| `VITE_API_BASE_URL` | `/api` | Just use `/api` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | Your Vercel domain (update after deploy) |

### Security Variables (Required)

| Variable | Value |
|----------|-------|
| `FLASK_DEBUG` | `false` |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_ACCESS_EXPIRES_SECONDS` | `3600` |
| `JWT_REFRESH_EXPIRES_SECONDS` | `604800` |

### Database Control (Required)

| Variable | Value |
|----------|-------|
| `DB_AUTO_CREATE` | `false` |
| `SEED_DEMO_DATA` | `false` |
| `RULES_SEED_VERSION` | `v2` |
| `DB_FALLBACK_ENABLED` | `false` |

**Pro Tip**: Run `python generate_secret_key.py` to generate secure keys and encode passwords!

---

## 🧪 Testing After Deployment

### 1. Test API Health
```bash
curl https://your-app-name.vercel.app/api
```

**Expected**:
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

### 2. Test Frontend
Open in browser: `https://your-app-name.vercel.app`

Should see login page without console errors.

### 3. Test Login
If you seeded demo data locally, try:
- **Admin**: `admin@example.com` / `admin123`
- **Doctor**: `doctor@example.com` / `doctor123`

---

## 🛠 Helper Scripts

I've created 3 helper scripts to make deployment easier:

### 1. Generate Secure Keys
```bash
python generate_secret_key.py
```
Generates SECRET_KEY and helps URL-encode your Supabase password.

### 2. Test Supabase Connection
```bash
python test_supabase_connection.py
```
Verifies your DATABASE_URL works before deploying.

### 3. Check Deployment Status
Visit your Vercel dashboard to see real-time deployment logs.

---

## 🐛 Common Issues

### "Cannot connect to database"
- ✅ Check DATABASE_URL starts with `postgresql+psycopg://`
- ✅ Verify password is URL-encoded (use `generate_secret_key.py`)
- ✅ Use **Session mode** pooler URL, not Transaction mode
- ✅ Check Supabase project isn't paused (free tier auto-pauses after 7 days)

### "CORS Error" in browser
- ✅ Add your Vercel domain to `CORS_ORIGINS`
- ✅ Format: `https://your-app.vercel.app,http://localhost:5173`
- ✅ Redeploy after updating

### "Tables don't exist"
You forgot to run migrations! See Step 1 above.

### API returns 404
- ✅ Check `vercel.json` exists in project root
- ✅ Check `api/index.py` exists
- ✅ Redeploy

### First request is slow (5-10 seconds)
This is normal! Vercel serverless functions have "cold starts". Subsequent requests are fast.

---

## 📚 Full Documentation

- 📖 **Complete Guide**: See `DEPLOYMENT_GUIDE.md` (detailed 10-part guide)
- ✅ **Checklist**: See `DEPLOYMENT_CHECKLIST.md` (step-by-step checklist)
- 🔧 **Helper Scripts**: `generate_secret_key.py` and `test_supabase_connection.py`

---

## 🚀 Deployment Commands

```bash
# Deploy to production
vercel --prod

# Deploy preview (test branch)
vercel

# View logs
vercel logs

# Pull environment variables locally
vercel env pull
```

---

## 💰 Cost (Both Free Tier!)

**Vercel Free Tier:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ✅ Global CDN

**Supabase Free Tier:**
- ✅ 500MB database
- ✅ 2GB bandwidth/month
- ✅ Unlimited API requests
- ⚠️ Auto-pauses after 7 days inactivity

**Tip**: Use a service like [Uptime Robot](https://uptimerobot.com) (free) to ping your API every 5 minutes to prevent Supabase from pausing.

---

## 🎉 You're Done!

Your app is now live at:
### **https://your-app-name.vercel.app**

Every git push to main automatically deploys. Easy! 🚀

---

## 📞 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed explanations
2. Use `test_supabase_connection.py` to debug database issues
3. Check Vercel logs: Dashboard → Your Project → Functions → Logs
4. Check Supabase logs: Dashboard → Logs

---

## 🔒 Security Reminder

- ✅ Never commit `.env` files (already in `.gitignore`)
- ✅ Use strong SECRET_KEY (not `hellohibyebye`!)
- ✅ Use strong database password
- ✅ Keep `FLASK_DEBUG=false` in production
- ✅ Only allow your domains in `CORS_ORIGINS`

---

**Happy Deploying! 🎊**
