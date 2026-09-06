# 🏗️ Deployment Architecture

## Overview

Your Diabetes Expert System uses a modern full-stack architecture optimized for Vercel deployment.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                    (https://your-app.vercel.app)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      VERCEL PLATFORM                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 VERCEL CDN (Global Edge)                  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │   Static Frontend (React + Vite)                │    │  │
│  │  │   - HTML, CSS, JS bundles                       │    │  │
│  │  │   - Served from /dist                           │    │  │
│  │  │   - Ultra-fast global delivery                  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                         │                                 │  │
│  │                         │ API Calls (/api/*)              │  │
│  │                         ↓                                 │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │   Backend API (Flask Python)                    │    │  │
│  │  │   - Serverless Function: /api/index.py          │    │  │
│  │  │   - Auto-scales on demand                       │    │  │
│  │  │   - Cold start: ~3-5s, warm: <500ms             │    │  │
│  │  │                                                  │    │  │
│  │  │   Routes:                                        │    │  │
│  │  │   • /api/auth/login                             │    │  │
│  │  │   • /api/auth/register                          │    │  │
│  │  │   • /api/diagnoses                              │    │  │
│  │  │   • /api/patients                               │    │  │
│  │  │   • /api/rules                                  │    │  │
│  │  │   • ... (all Flask routes)                      │    │  │
│  │  └─────────────────────┬───────────────────────────┘    │  │
│  └────────────────────────┼───────────────────────────────┘  │
│                           │ Database Queries                  │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            │ PostgreSQL Connection
                            │ (Session Pooler)
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                        │  │
│  │                                                         │  │
│  │  Tables:                                                │  │
│  │  • users (RBAC: admin, doctor, patient)                │  │
│  │  • patients (medical records)                          │  │
│  │  • diagnoses (expert system results)                   │  │
│  │  • rules (inference engine rules)                      │  │
│  │  • audit_logs (compliance tracking)                    │  │
│  │  • rule_versions (version control)                     │  │
│  │  • ... (20+ tables)                                    │  │
│  │                                                         │  │
│  │  Features:                                              │  │
│  │  • Connection pooling (max 60 concurrent)              │  │
│  │  • Automatic backups                                   │  │
│  │  • Point-in-time recovery                              │  │
│  │  • Real-time logs                                      │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### 1. Static Content (Frontend)
```
User → Vercel CDN → React App (dist/)
                  → Cached globally
                  → ~50ms response time
```

### 2. API Requests
```
User → Browser JavaScript
    → Fetch: /api/diagnoses
    → Vercel Router (vercel.json rewrites)
    → Serverless Function: /api/index.py
    → Flask App routes
    → SQLAlchemy ORM
    → Supabase PostgreSQL
    → Response back through chain
```

### Example: Login Flow
```
1. User enters credentials in browser
2. Frontend: POST /api/auth/login
3. Vercel routes to /api serverless function
4. Flask validates credentials
5. Queries Supabase: SELECT * FROM users WHERE email=?
6. Generates JWT tokens
7. Returns: { access_token, refresh_token }
8. Frontend stores tokens in localStorage
9. Subsequent requests include: Authorization: Bearer <token>
```

---

## 📁 File Structure on Vercel

### Build Output
```
dist/                          # Frontend (Served by Vercel CDN)
├── index.html                 # React app entry
├── assets/
│   ├── index-abc123.js        # React bundle
│   ├── index-abc123.css       # Tailwind styles
│   └── logo-xyz789.png        # Static assets
└── ...

api/                           # Backend (Serverless Function)
├── index.py                   # Flask app entry
├── requirements.txt           # Python dependencies
└── ...
```

### How Vercel Handles Routes

**vercel.json Configuration:**
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"           // All /api/* → serverless function
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"    // Everything else → React app
    }
  ]
}
```

**Result:**
- ✅ `/` → React app
- ✅ `/login` → React app (client-side routing)
- ✅ `/dashboard` → React app (client-side routing)
- ✅ `/api/health` → Flask serverless function
- ✅ `/api/auth/login` → Flask serverless function

---

## 🔐 Security Layers

### 1. Transport Security
- ✅ **HTTPS Only** (enforced by Vercel)
- ✅ **TLS 1.3** (modern encryption)
- ✅ **Automatic SSL certificates**

### 2. Authentication
- ✅ **JWT Tokens** (short-lived access + refresh tokens)
- ✅ **Password Hashing** (Werkzeug bcrypt)
- ✅ **Token Rotation** (refresh mechanism)
- ✅ **Secure Headers** (Flask-CORS)

### 3. Authorization (RBAC)
- ✅ **Role-based access control** (admin, doctor, patient)
- ✅ **Route protection** (decorator: @role_required)
- ✅ **Resource ownership** (patients can only see their data)

### 4. Database Security
- ✅ **Connection pooling** (prevents connection exhaustion)
- ✅ **Parameterized queries** (SQLAlchemy prevents SQL injection)
- ✅ **Environment variables** (secrets not in code)
- ✅ **Supabase firewall** (network isolation)

### 5. Application Security
- ✅ **CORS restrictions** (only allowed origins)
- ✅ **Rate limiting** (Flask-Limiter)
- ✅ **Input validation** (Pydantic/custom validators)
- ✅ **Audit logging** (all critical actions logged)

---

## ⚡ Performance Optimization

### Frontend (React + Vite)
- **Code Splitting**: Lazy load routes
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Minified JS/CSS
- **CDN Delivery**: Global edge network
- **Caching**: Aggressive browser caching

### Backend (Flask Serverless)
- **Connection Pooling**: Reuse DB connections
- **Query Optimization**: Indexed queries, eager loading
- **Response Caching**: API-level caching (where appropriate)
- **Lightweight Dependencies**: Minimal imports

### Database (Supabase)
- **Session Pooler**: Connection reuse (60 max concurrent)
- **Indexes**: On frequently queried columns
- **Query Planning**: Optimized PostgreSQL execution plans

---

## 📈 Scalability

### Automatic Scaling
```
Low Traffic:      1 serverless function instance  →  ~$0/month
Medium Traffic:   5-10 instances auto-spawn       →  Still free tier
High Traffic:     50+ instances (auto-scales)     →  Pay per invocation
```

### Bottlenecks & Limits

| Resource | Free Tier Limit | Mitigation |
|----------|-----------------|------------|
| Vercel Bandwidth | 100GB/month | Optimize assets, use CDN |
| Vercel Functions | 100GB-hours | Optimize function execution time |
| Supabase DB | 500MB storage | Prune old data, optimize schema |
| Supabase Bandwidth | 2GB/month | Cache responses, optimize queries |
| Concurrent DB Connections | 60 | Use connection pooling |

---

## 🔧 Environment Configuration

### Local Development
```env
DATABASE_URL=sqlite:///dev_local.db
FLASK_DEBUG=true
CORS_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5001/api
```

### Vercel Production
```env
DATABASE_URL=postgresql+psycopg://...supabase.com:5432/postgres
FLASK_DEBUG=false
CORS_ORIGINS=https://your-app.vercel.app
VITE_API_BASE_URL=/api  # Same-origin!
```

**Key Difference**: Production uses `/api` (same-origin) to avoid CORS issues!

---

## 🚀 Deployment Pipeline

### Automatic CI/CD
```
Developer → Git Push to main
          ↓
    GitHub Repository
          ↓
    Vercel Webhook (instant trigger)
          ↓
    Vercel Build Server:
      1. npm install (install frontend deps)
      2. npm run build (build React app)
      3. Copy dist/ to root
      4. Prepare Python runtime for /api
          ↓
    Deploy to Vercel Edge Network
          ↓
    Live in < 2 minutes! ✅
```

### Build Process
```bash
# What happens when you deploy:

1. Install frontend dependencies
   $ cd frontend && npm install

2. Build React production bundle
   $ npm run build
   # Output: frontend/dist/

3. Copy to root
   $ cp -r frontend/dist dist/

4. Prepare Python serverless function
   # Vercel installs api/requirements.txt automatically
   # Creates isolated Python runtime for /api/index.py

5. Deploy to global edge network
   # Frontend: Distributed to 100+ edge locations
   # Backend: Deployed to regional serverless functions
```

---

## 📊 Monitoring & Observability

### Vercel Dashboard
- **Real-time Logs**: See all API requests
- **Error Tracking**: Catch serverless function errors
- **Analytics**: Page views, performance metrics
- **Deployment History**: Rollback anytime

### Supabase Dashboard
- **Database Metrics**: Connections, query performance
- **Logs**: SQL queries, errors
- **Table Editor**: View/edit data directly
- **API Logs**: Track database API usage

### Application Logs
- **Audit Logs**: Every user action logged to `audit_logs` table
- **Security Events**: Failed logins, permission denials
- **System Events**: Rule changes, user management

---

## 🛡️ High Availability

### Vercel
- ✅ **99.99% uptime SLA** (paid plans)
- ✅ **Global edge network** (100+ locations)
- ✅ **Automatic failover**
- ✅ **DDoS protection**

### Supabase
- ✅ **Managed PostgreSQL** (AWS RDS underneath)
- ✅ **Automated backups** (daily)
- ✅ **Point-in-time recovery** (7 days on free tier)
- ✅ **Connection pooling** (prevent exhaustion)

---

## 💡 Best Practices

### 1. Keep Functions Small
- ✅ Minimize dependencies in `api/requirements.txt`
- ✅ Lazy load heavy modules
- ✅ Cache expensive operations

### 2. Optimize Database Queries
- ✅ Use indexes on foreign keys
- ✅ Eager load relationships (avoid N+1 queries)
- ✅ Limit result sets with pagination

### 3. Handle Cold Starts
- ✅ Show loading states in UI
- ✅ Keep first requests simple (health check warmup)
- ✅ Consider Vercel Pro for instant warm starts

### 4. Monitor Costs
- ✅ Stay within free tier limits
- ✅ Prune old audit logs periodically
- ✅ Optimize asset sizes (images, bundles)

---

## 📚 Learn More

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [Flask on Vercel](https://vercel.com/docs/frameworks/flask)

---

**Architecture designed for**: Scale, Performance, Security, Cost-efficiency ✨
