# Diabetes Expert System (React + Flask)

Phase 9 baseline: secure JWT auth/RBAC, full diagnosis workflow, Tailwind-based dashboard UI, and complete admin control panel for access governance and activity monitoring.

## Security Stack
- Password hashing: `werkzeug.security` (`generate_password_hash`, `check_password_hash`)
- JWT auth: access token + refresh token
- Token revocation: `revoked_tokens` table (logout + refresh rotation)
- RBAC: role and permission claims enforced in backend middleware and React route guards

## Expert System Core
- Structured rule loading (`rule_loading`) with active-rule filtering and parser validation
- Safe condition parser (`rule_parser`) with strict AST allow-list (no calls/attrs/subscripts)
- Fact preparation (`fact_preparation`) for symptoms, labs, and risk factors
- Forward chaining inference (`forward_chaining`) with derived facts and per-iteration trace
- Certainty combination (`confidence`) with priority weighting (`high`, `medium`, `low`)
- Recommendation selection (`recommendations`) from fired-rule evidence
- Explainable diagnosis output via `explanation_trace` sections:
  - `rule_loading`
  - `fact_preparation`
  - `inference`
  - `confidence_calculation`
  - `recommendations`

## Knowledge Base Management
- Rule CRUD for doctor/admin:
  - create, read, update, archive
  - category + status filtering
- Rule editor fields:
  - name
  - conditions
  - conclusion
  - certainty factor
  - priority
  - status
  - explanation
  - recommendation
- Rule categories:
  - `symptoms`
  - `diagnosis`
  - `complications`
  - `recommendations`
- Rule versioning via `rule_versions` snapshots
- Rule audit trail via `audit_logs` entries

## Diagnosis Workflow
- Multi-step assessment form in frontend
- Medical input validation for labs, symptoms, and risk factors
- Expert system execution on submission
- Stored diagnosis records include:
  - diagnosis result
  - certainty score
  - triggered rules
  - explanation trace
  - recommendations
  - urgent flag and reason
- Doctor/admin review support:
  - review note annotation
  - urgent case flag updates
  - reviewer + reviewed timestamp

## Role Access Model
- `admin`: manages users and permissions
- `doctor`: manages patient records, symptoms/labs, knowledge base, and diagnosis review
- `patient`: submits diagnosis and views own profile/history/results

## Admin Control Panel
- User management:
  - list/filter/search users
  - create user accounts
  - assign role per user
  - enable/disable accounts
- Role management:
  - list roles
  - create roles
  - update role metadata
  - assign permissions to roles
- Access catalog:
  - list all permissions from backend
- Activity monitoring:
  - 7-day summary (event volume, active actors, top actions/entities)
  - recent event stream
- Audit trail viewer:
  - filter by action, entity type, actor user id
- System statistics dashboard:
  - users (total/active/inactive/by-role)
  - patients total
  - rules (total/by-status)
  - diagnosis metrics (total/urgent/reviewed/recent)
  - audit events in last 24h

## Implemented Schema
Core tables from Phase 2 plus:
- `revoked_tokens`

## Demo Accounts
`superadmin@example.com / superadmin123`
`admin@example.com / admin123`
`doctor@example.com / doctor123`
`patient@example.com / patient123`

## Local Setup

### 1. Backend environment file
```bash
cd backend
cp .env.example .env
```

### 2. Choose backend database mode

PostgreSQL mode (default):
- Start PostgreSQL and create database `diabetes_expert_system`.
- Keep:
  - `DB_FALLBACK_ENABLED=false`
  - `DATABASE_URL=postgresql+psycopg://...`

Fallback mode (local convenience when PostgreSQL is unavailable):
- Set:
  - `DB_FALLBACK_ENABLED=true`
  - optional `DB_FALLBACK_URL=sqlite:///dev_fallback.db` (or leave unset to use app default absolute path)
- With fallback active, backend will:
  - switch to SQLite when primary DB connection fails,
  - auto-create schema (`DB_FALLBACK_AUTO_CREATE=true`),
  - auto-seed demo data (`DB_FALLBACK_SEED=true`).

### 3. Backend run
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
FLASK_APP=run.py flask db upgrade
python run.py
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### UI Foundation (Tailwind + shadcn/ui)
- Tailwind is configured in `frontend/tailwind.config.js`.
- shadcn/ui is initialized via `frontend/components.json`.
- Add new shadcn components from `frontend/` with:
```bash
npx shadcn@latest add button
```
- Shared class merge utility is available at `@/lib/utils` (`cn(...)`).

## Auth Endpoints
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Patient Module Endpoints
- `GET /api/patients/` (doctor/admin, search/filter support)
- `POST /api/patients/` (doctor/admin, registration)
- `GET /api/patients/<id>` (doctor/admin, profile)
- `PATCH /api/patients/<id>` (doctor/admin, profile updates)
- `GET /api/patients/<id>/history` (doctor/admin, linked timeline)
- `POST /api/patients/<id>/symptoms` / `GET /api/patients/<id>/symptoms`
- `POST /api/patients/<id>/lab-results` / `GET /api/patients/<id>/lab-results`
- `GET /api/patients/mine` and `GET /api/patients/mine/history` (patient)

## RBAC-Protected Endpoints (examples)
- Admin:
  - `GET /api/admin/users`
  - `POST /api/admin/users`
  - `PATCH /api/admin/users/<id>`
  - `PATCH /api/admin/users/<id>/status`
  - `GET /api/admin/roles`
  - `POST /api/admin/roles`
  - `PATCH /api/admin/roles/<id>`
  - `GET /api/admin/permissions`
  - `PATCH /api/admin/users/<id>/roles`
  - `GET /api/admin/audit-logs`
  - `GET /api/admin/activity`
  - `GET /api/admin/stats`
- Doctor/Admin:
  - `GET /api/patients/`
  - `POST /api/patients/`
  - `GET /api/rules/`
  - `POST /api/rules/`
  - `GET /api/rules/<id>`
  - `PATCH /api/rules/<id>`
  - `DELETE /api/rules/<id>`
  - `GET /api/rules/<id>/versions`
  - `GET /api/rules/<id>/audit`
  - `GET /api/diagnosis/review`
  - `PATCH /api/diagnosis/<id>/review`
- Patient:
  - `POST /api/diagnosis/`
  - `GET /api/diagnosis/mine`
  - `GET /api/patients/mine`
  - `GET /api/patients/mine/history`

Note: doctor/admin diagnosis submissions now require `patient_id`.

## Migration Workflow
```bash
cd backend
source .venv/bin/activate
FLASK_APP=run.py flask db migrate -m "describe change"
FLASK_APP=run.py flask db upgrade
```

## Verification
Backend tests:
```bash
cd backend
source .venv/bin/activate
pytest
```

Frontend build:
```bash
cd frontend
npm run build
```
