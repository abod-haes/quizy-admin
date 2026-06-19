You are working in a React + Vite + TypeScript admin dashboard.

Task:
1) Generate CRUD module using make-crud for endpoint: `project-map-areas`.
2) Use API contract + postman as source of truth.
3) After generation, refactor module to match project standards.

Requirements:

- Module name/route: `/project-map-areas`
- Endpoints:
  - GET /api/v1/admin/project-map-areas
  - POST /api/v1/admin/project-map-areas
  - GET /api/v1/admin/project-map-areas/{id}
  - PUT|PATCH /api/v1/admin/project-map-areas/{id}
  - DELETE /api/v1/admin/project-map-areas/{id}
  - PATCH /api/v1/admin/project-map-areas/reorder

- Filters (ONLY allowed by contract):
  - `project_id`
  - `svg_element_id`
- Filter behavior:
  - keep pending filters in dialog
  - apply button sends query to backend and refetches
  - reset restores defaults

- Pagination:
  - send `page` and `perPage` in query
  - on page/perPage change, refetch with new query
  - use server meta/links values for total/current/last page

- Table:
  - custom table style, full available height
  - scroll only in table body
  - header background must be `bg-accent`
  - must support loading state with skeleton rows while list query is loading
  - pass `isLoading={listQuery.isLoading}` from page to table component
  - DO NOT show `sort_order` column
  - keep actions menu (view/edit/delete)
  - show translations by current locale first

- Reorder:
  - display ordering via drag & drop in SAME table
  - toggle button: first click enters ordering mode, second click saves
  - save using `PATCH /project-map-areas/reorder` with payload:
    `{ items: [{ id, sort_order }] }`

- Form:
  - in edit mode, show professional skeleton loading while detail query is loading
  - loading UI should use shared skeleton component (consistent with other modules)
  - `project_id` as select from projects endpoint (relation select)
  - `svg_element_id` as text input (not select)
  - `meta` as dynamic key/value rows (add/remove)
  - `translations` as rows: `lang`, `label`
  - supported langs: ar, en, fr
  - prevent duplicate translation language
  - keep `sort_order` field only in edit mode

- View page:
  - show professional skeleton loading while detail query is loading
  - loading UI should use shared skeleton component (consistent with other modules)
  - professional details layout
  - show translations nicely
  - show meta as key/value cards
  - dates formatted as date only (NO time)

- Localization:
  - add/update `ar` and `en` locale files for this module
  - update Arabic sidebar label for project map areas

- Date formatting:
  - all created_at/updated_at in tables and views = date only (without time)

- Keep consistency with existing shared components/hooks/utilities.
- Don't create new parallel table system if shared one already exists.
