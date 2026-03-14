Prompt 1 — Audit and planning
You are working on an existing React frontend for a diabetes expert system with a Flask backend API already running.

Task:
Audit the current frontend structure and produce a UI refactor plan without changing backend behavior.

Requirements:
- Inspect the current React app structure.
- Identify pages, components, routes, duplicated UI, and layout problems.
- Propose a cleaner structure using:
  - shared AppLayout
  - Sidebar
  - Topbar
  - protected routes
  - role-based navigation
- Keep all existing API integrations working.
- Do not rewrite business logic.
- Do not touch Flask code.
- Output:
  1. current issues
  2. proposed folder structure
  3. page map by role: patient, doctor, admin
  4. list of reusable UI components to build first
  5. step-by-step refactor order

Constraints:
- Preserve existing route behavior where possible.
- Prefer incremental refactor over full rewrite.
Prompt 2 — Install and configure UI foundation
Refactor this React app to use Tailwind CSS and shadcn/ui on top of the existing Vite project.

Task:
Set up the frontend design foundation only.

Requirements:
- Install and configure Tailwind CSS for the current Vite React app.
- Install and configure shadcn/ui.
- Add a clean design token baseline for:
  - primary
  - success
  - warning
  - danger
  - muted/background
- Add base typography and spacing rules.
- Create a reusable utility structure for class merging and shared styling.
- Do not redesign pages yet.
- Do not remove existing routes.
- Keep the project runnable after changes.

Output:
- updated package setup
- Tailwind config and global styles
- shadcn/ui initialized
- brief README note explaining how to add future components
Prompt 3 — Build the shared dashboard shell
Create a reusable authenticated dashboard layout for the existing React app.

Task:
Implement the main app shell used after login.

Requirements:
- Build:
  - AppLayout
  - Sidebar
  - Topbar
  - Mobile sidebar/drawer
  - Main content container
- Use React Router layout/nested route structure.
- Add role-aware navigation items for:
  - patient
  - doctor
  - admin
- Keep authorization logic compatible with existing auth state.
- Add active menu highlighting.
- Add a user menu in the topbar with logout action.
- Add responsive behavior for smaller screens.
- Keep styling professional, minimal, medical-dashboard style.

Constraints:
- Do not redesign every page yet.
- Use current route names where possible.
- Preserve current login flow.
Prompt 4 — Clean route architecture
Refactor the current React routing into a clean route architecture.

Task:
Introduce public and protected route groups with role-aware layouts.

Requirements:
- Create route groups for:
  - public routes
  - authenticated routes
- Add:
  - ProtectedRoute
  - RoleGuard
  - Unauthorized page
  - NotFound page
- Use nested routes so all authenticated pages render inside AppLayout.
- Keep existing pages working with minimal behavior change.
- Redirect unauthorized users correctly.
- Preserve token/session behavior already implemented.

Output:
- updated router structure
- reusable route guards
- clean route organization by role
Prompt 5 — Build reusable UI primitives
Create a reusable component system for the frontend before page redesign.

Task:
Build shared presentational components using Tailwind and shadcn/ui.

Requirements:
Create and organize reusable components for:
- PageHeader
- StatCard
- SectionCard
- EmptyState
- LoadingState
- ErrorAlert
- StatusBadge
- DataTable wrapper
- ConfirmDialog
- FormSection
- SearchInput
- FilterBar

Constraints:
- Components must be generic and reusable.
- Keep them visually consistent with a professional medical dashboard.
- Replace obvious duplicated UI where safe.
- Do not change API behavior.
Prompt 6 — Redesign the login page
Redesign the existing login page UI only.

Task:
Improve the login page to look polished and production-ready.

Requirements:
- Keep the current login logic and API integration unchanged.
- Redesign the page with:
  - centered login card
  - system title/subtitle
  - email and password inputs
  - clear error messages
  - loading state on submit
- Add subtle branding appropriate for a medical expert system.
- Keep it simple and professional, not flashy.
- Make it responsive.

Constraints:
- No backend changes.
- No auth-flow changes except small UI-safe improvements.
Prompt 7 — Redesign dashboards by role
Redesign the current dashboard experience for each role.

Task:
Create role-specific dashboards for patient, doctor, and admin.

Requirements:
- Patient dashboard should show:
  - quick action to start assessment
  - recent result
  - history shortcut
- Doctor dashboard should show:
  - patient stats
  - recent assessments
  - knowledge base shortcut
  - alerts/priority cases placeholder
- Admin dashboard should show:
  - user counts
  - role summary
  - recent activity/log placeholder
- Use reusable cards and page sections.
- Keep current data wiring if available; otherwise use safe placeholders that can be connected later.

Constraints:
- Do not invent backend endpoints that do not exist.
- Prefer fallback UI with placeholders instead of breaking the app.
Prompt 8 — Redesign the assessment form
Refactor the diagnosis/assessment form into a clean multi-step experience.

Task:
Improve the UX of the existing diabetes assessment input flow.

Requirements:
- Convert the current form into steps:
  1. patient info
  2. symptoms
  3. lab results
  4. risk factors
  5. review and submit
- Preserve existing submission payload and backend compatibility.
- Add inline validation and helpful labels.
- Add previous/next navigation.
- Add progress indicator.
- Keep the layout readable and uncluttered.
- Use reusable form components and section containers.

Constraints:
- Do not change diagnosis API contract unless necessary.
- If current payload differs from step structure, adapt internally before submit.
Prompt 9 — Redesign the diagnosis result page
Redesign the diagnosis result page into a report-style interface.

Task:
Improve the result presentation after an assessment is submitted.

Requirements:
Show:
- diagnosis summary card
- certainty score badge
- key findings
- triggered rules or explanation trace
- recommendation section
- urgency/status indicator
- back/history action buttons
- clean two-column desktop layout and stacked mobile layout

Constraints:
- Reuse current backend response fields.
- If explanation fields are missing, render a graceful fallback.
- Do not change backend logic.
- Focus on visual clarity and scanability.
Prompt 10 — Redesign the knowledge base page
Refactor the doctor/admin knowledge base page into a clean management interface.

Task:
Improve the rule-management UI without changing backend endpoints.

Requirements:
- Create a polished page with:
  - page header
  - searchable/filterable rules table
  - status badges
  - category filter
  - add/edit rule modal or side panel
  - delete confirmation dialog
- Display rule fields clearly:
  - name
  - category
  - priority
  - certainty factor
  - status
  - updated metadata if available
- Keep existing CRUD calls intact.

Constraints:
- No backend changes.
- Do not overcomplicate the form builder yet.
- Prefer a clean admin dashboard style.
Prompt 11 — Add loading, empty, and error states everywhere
Improve resilience and UX consistency across the React frontend.

Task:
Add standardized loading, empty, and error states to all major pages.

Requirements:
- Audit major pages and async data flows.
- Add shared LoadingState, EmptyState, and ErrorAlert usage where missing.
- Ensure no page renders raw undefined/null states.
- Improve API failure messaging for users.
- Keep messages concise and user-friendly.
- Do not change backend behavior.

Output:
- consistent UX states across login, dashboards, assessment, results, and knowledge base pages
Prompt 12 — Final polish and cleanup
Perform a frontend polish pass after the UI refactor.

Task:
Clean up the React frontend for consistency and maintainability.

Requirements:
- Remove dead components and duplicated styling.
- Standardize spacing, button variants, card headers, and table presentation.
- Ensure responsive behavior is acceptable across key pages.
- Check route transitions and navigation consistency.
- Keep all existing functionality working.
- Produce a short summary of:
  - what changed
  - remaining UI debt
  - recommended next UI tasks

Constraints:
- No backend changes.
- No feature expansion beyond UI cleanup.