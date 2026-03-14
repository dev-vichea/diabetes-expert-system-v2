# Coding Conventions

## Naming
- Python files, modules, functions, and variables use `snake_case`.
- Python classes use `PascalCase`.
- React components use `PascalCase`; page files end with `Page.jsx`.
- Constants use `UPPER_SNAKE_CASE`.

## Backend boundaries
- `routes/` handles HTTP parsing and delegates to services.
- `services/` holds business logic, token flow, and validation.
- `repositories/` encapsulates database persistence.
- `models/` defines SQLAlchemy schema entities.
- `utils/` contains shared middleware/helpers.

## Auth and RBAC
- Use hashed passwords only; never store plaintext passwords.
- Use access + refresh JWTs with revocation support.
- Route decorators must enforce permissions (`require_auth(..., permissions=[...])`) and roles where needed.
- Keep role-permission mappings centralized in seeding logic.

## Database and migrations
- Schema changes must update models and add migration files under `backend/migrations/versions/`.
- Apply with `flask db upgrade`.

## API contract
- Success: `{ "success": true, "data": ..., "message"?: "..." }`.
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details"?: {...} } }`.

## Frontend API usage
- Use `src/api/client.js` for auth headers and refresh handling.
- Store auth tokens via centralized token helpers only.
- Protect pages using both role and permission checks in `App.jsx`.

## Testing baseline
- Maintain tests for login, refresh/logout, protected routes, diagnosis, and rules/admin flows.
- Run `pytest` before merging backend changes.
