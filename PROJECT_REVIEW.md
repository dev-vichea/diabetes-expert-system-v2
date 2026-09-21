# Project review — 2026-09-21

Scope: local setup, frontend routes and authentication, backend routes and
services, assessment persistence and inference tests, database models and
migrations, localization, dependency audit, and deployment configuration.
This is a software review, not validation of clinical accuracy.

## Fixes made

- Added ownership checks for saved assessment JSON, PDF exports, and care-team
  submissions. Previously, a patient with `diagnosis.run` could supply another
  patient's result ID. Clinical users with `patient.view` or
  `diagnosis.review_any` retain access. Regression coverage includes all four
  route aliases, denied submissions, own results, and clinician access.
- Render rule names as escaped React text in the review page, replacing raw
  HTML injection of editable rule names.
- Restrict clinical dashboard data (including patient names) to users with
  `analytics.view` or `patient.view`; previously any authenticated user could
  retrieve it. Existing nurse access through `patient.view` is preserved.
- Restrict avatar cleanup to the current user's filenames inside the avatar
  directory. Profile updates previously allowed an avatar URL that could
  direct cleanup outside that directory or to another user's avatar.
- Replaced Unix-only root build commands with a Vite output-directory option
  that works in Windows PowerShell.
- Corrected the documented frontend variable to `VITE_API_BASE_URL`, the
  minimum Python version to 3.11, and added Windows/SQLite instructions.
- Applied compatible npm dependency updates. Audit findings decreased from
  14 (7 high, 5 moderate, 2 low) to 2 moderate findings affecting React Router.
- Created ignored local backend/frontend `.env` files, using SQLite, demo
  seeding, a generated local secret, and Vite's `/api` proxy.

## Remaining findings

1. **High: production creates publicly documented demo accounts by default.**
   `docker-compose.prod.yml` defaults `SEED_DEMO_DATA` to true;
   `backend/app/config.py` also enables it by default. The seed routine creates
   administrator and clinical accounts with known passwords and reapplies
   built-in role permissions on startup. Production should have separate
   reference-data initialization and explicit administrator provisioning.
   Merely disabling demo seeding on a fresh database also leaves reference
   roles and rules uninitialized.

2. **High: changed permissions do not invalidate existing access tokens.**
   `backend/app/utils/auth.py` authorizes requests from JWT claims.
   `AuthService.decode_token()` checks that a user is active but does not
   refresh role/permission claims from the database. Removing permissions
   from an active user therefore leaves the previous access until token
   expiry (one hour by default). Refresh claims during authorization or
   invalidate tokens when access changes.

3. **Medium: database migrations omit the `facts` and `notifications` tables.**
   The ORM defines these tables, but no migration creates them. Demo seeding
   masks the gap by calling `db.create_all()`. A migration-only installation
   with seeding and automatic table creation disabled will lack these tables.
   Add explicit migrations and test a fresh migration-only database.

4. **Medium: inference catalog overrides use module-level mutable state.**
   `symptom_database.py` stores `_FACT_OVERLAY` and `_OVERLAY_ALIASES` globally;
   assessment services replace them when loading the catalog and clear them
   if a catalog query fails. Concurrent requests can therefore replace or
   clear the overrides while another request uses them. This
   matters because the production server uses multiple threads. Pass an
   immutable catalog into inference or isolate it per request.

5. **Medium: two frontend dependency advisories remain.**
   `npm audit` reports `react-router` and `react-router-dom`; its proposed fix
   upgrades to React Router 7, outside the current declared major version.
   This needs a deliberate upgrade and navigation regression checks.

6. **Low: frontend initial bundle remains large.**
   The root production build reports an approximately 789 kB minified entry
   chunk (191 kB gzip). Translation catalogs and initial imports are useful
   candidates for further splitting.

## Verification

- Frontend production build: passed, including the root Windows build command.
- English/Khmer locale parity: passed.
- Frontend HTTP request: 200 with the application root present.
- Edge headless login-page rendering: passed, with no uncaught JavaScript errors.
- Backend tests and live API checks: pending completion of dependency installation.

Docker/PostgreSQL deployment and cloud hosting have not been run. Native
WeasyPrint/Pango availability and Khmer PDF shaping require separate checks
on the deployment platform.
