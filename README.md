# Diabetes Expert System 🩺

A professional, full-stack web application designed to leverage an expert system for diabetes diagnosis, management recommendations, and clinical workflow tracking. Built with a modern **React (Vite+Tailwind)** frontend and a robust **Flask** backend, fortified by secure role-based access control (RBAC), and backed by a **Supabase PostgreSQL** database.

---

## 🎯 Key Features

### 🧠 Expert System Core
- **Forward Chaining Inference Engine**: Processes patient symptoms, lab results, and risk factors through a deterministic rule-engine.
- **Explainable AI (XAI) Output**: Every diagnosis includes a detailed, transparent explanation trace—from fact preparation to rule triggers, confidence calculation, and final recommendations.
- **Certainty Factor Integration**: Weighs clinical inputs dynamically to provide a confidence score for each diagnosis.

### 🛡 Security & Access Control (RBAC)
- **Role-Based Roles**: Customized access for `admin`, `doctor`, and `patient`.
- **JWT Authentication**: Secured session management with short-lived access tokens, refresh tokens, and active revocation tracking.
- **Admin Control Panel**: Comprehensive dashboard to manage users, configure roles, inspect permissions, and monitor system activity and audit logs.

### 🏥 Clinical Workflow
- **Patient Management**: Doctors can track patient histories, manage profiles, and review sequential lab results and symptoms.
- **Diagnosis Assessment**: Interactive, multi-step assessment forms enforcing stringent medical input validation.
- **Medical Review System**: Capabilities for clinical staff to flag urgent cases, add qualitative review notes, and annotate auto-generated diagnoses.

### 📚 Knowledge Base Management
- **Rule Editor**: A dedicated UI for medical professionals (or admins) to create, modify, and archive diagnostic rules without touching code.
- **Versioning & Auditing**: Every change to the rule set is snapshotted (`rule_versions`) and logged (`audit_logs`) to ensure compliance and traceability.

---

## 🛠 Tech Stack

**Frontend:**
- React 18 / Vite
- Tailwind CSS / shadcn/ui (Accessible, modern UI components)
- React Router (Guarded routing based on user claims)

**Backend:**
- Python 3 / Flask
- SQLAlchemy ORM / Alembic (Database Migrations)
- psycopg / PostgreSQL (Hosted via Supabase)
- Flask-JWT-Extended / Werkzeug (Auth & Security)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A [Supabase](https://supabase.com) account & PostgreSQL instance (or local PostgreSQL)

### 1. Backend Setup

1. **Navigate to the backend directory and install dependencies:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your `DATABASE_URL` to your full **Supabase Session Pooler URL** (ensure you use `postgresql+psycopg://...`). Example:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   FLASK_RUN_PORT=5001
   ```

3. **Initialize the Database:**
   Apply migrations to build the schema in your Supabase database.
   ```bash
   export FLASK_APP=run.py
   flask db upgrade
   ```

4. **Run the API Server:**
   ```bash
   python run.py
   ```
   *The backend will typically start on `http://127.0.0.1:5001`.*

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL` points to your running backend (e.g., `http://127.0.0.1:5001/api`).

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *The frontend will typically start on `http://localhost:5173`.*

---

## 🔑 Demo Accounts (If Seeded)

If you enabled `SEED_DEMO_DATA=true` in your backend environment, the following accounts will be pre-provisioned:

| Role        | Email                  | Password     |
|-------------|------------------------|--------------|
| Superadmin  | superadmin@example.com | `superadmin123` |
| Admin       | admin@example.com      | `admin123`   |
| Doctor      | doctor@example.com     | `doctor123`  |
| Patient     | patient@example.com    | `patient123` |

---

## 🧪 Testing and Verification

**Backend Tests:**
```bash
cd backend
source .venv/bin/activate
pytest
```

**Frontend Build:**
```bash
cd frontend
npm run build
```

---

*This system is intended for research, demonstration, and clinical assistance prototyping. Always consult a certified healthcare professional for actual medical diagnosis and treatment.*
