# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

No test suite is configured.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
```

## Architecture

**Stack**: Next.js 16 (App Router), React 19, TypeScript, Supabase, Tailwind CSS v4, shadcn/ui, SWR.

This is a pineapple operations management system for an agricultural company in Costa Rica. The UI language is Spanish and numbers are formatted in `es-CR` locale (Costa Rican colones, CRC).

### Supabase Clients

Two separate clients must be used depending on context:
- `lib/supabase/server.ts` — for Server Components and Server Actions (uses `cookies()`)
- `lib/supabase/client.ts` — for Client Components (browser client)

Never put the server client in a global variable; always instantiate it inside the function.

### Auth & Session

`middleware.ts` calls `updateSession` (`lib/supabase/proxy.ts`) on every request to refresh the Supabase session cookie. It also redirects unauthenticated users from `/dashboard/*` to `/auth/login`. `app/dashboard/layout.tsx` performs a secondary server-side auth check and redirects as well.

### Role System

Two roles: `admin` and `operario`. The role is stored in the `perfiles` table (column `rol`) linked to the Supabase auth user by `id`.

- `hooks/use-user-role.ts` — fetches the role client-side; exposes `{ role, loading, isAdmin, isOperario }`
- `components/dashboard/route-guard.tsx` — wraps page content; renders "Acceso denegado" if the user's role is not in `allowedRoles`
- `hooks/use-admin-frontend-guard.ts` — used in admin-only pages to redirect `operario` users to `/dashboard/recepcion`

**Access rules (enforced in sidebar and guards):**
- `admin`: all sections
- `operario`: only "Operaciones en planta" (Recepción de Fruta, Boletas de Recepción) and "Mantenimiento"

### Module Structure

Each functional area follows one of two patterns:

**Maintenance modules** (`/dashboard/mantenimiento/*`): Server Components fetch data, pass it to `MaintenanceTable` (`components/dashboard/maintenance-table.tsx`), a generic client component that handles create/edit/delete via a `fields` config array.

**Transaction modules** (`/dashboard/compras-regulares`, `ventas-plantas`, etc.): Client Components use `useSWR` for data fetching. Pattern: SWR fetch → dedicated table component → `Dialog` with a dedicated form component for create/edit. Admin guard is applied at the top of the page with `useAdminFrontendGuard`.

**Recepción module** (`/dashboard/recepcion`): Card-based UI with two tabs ("En Patio" / "Histórico"). `recepciones` links to `recepcion_bines` (individual bins). State machine: `pendiente` → `finalizado`.

### Key Tables

| Table | Purpose |
|---|---|
| `perfiles` | User roles (linked to Supabase auth) |
| `configuracion` | System settings (e.g. `titulo_sistema` shown in sidebar) |
| `clientes`, `choferes`, `plantas`, `placas`, `tipos_pago` | Lookup/maintenance catalogs |
| `recepciones`, `recepcion_bines` | Fruit reception and individual bins |
| `boletas_recepcion` | Reception vouchers (PDF-exportable) |
| `compras_regulares`, `compras_especiales` | Pineapple purchase records |
| `ventas_plantas`, `transporte_contratado`, `transporte_interno` | Sales and transport records |
| `empleados`, `planillas`, `planillas_historial` | Payroll |
| `tareas_diarias`, `tareas_diarias_estado` | Daily task tracking |

All tables have RLS enabled; policies allow all operations for `authenticated` users.

### Database Migrations

Migration files live in `migrations/`. Apply them via the Supabase MCP tool (`mcp__supabase__apply_migration`) or the Supabase SQL editor. They follow the format `YYYYMMDD_description.sql` and use `BEGIN`/`COMMIT` transactions.

### UI Conventions

- All shadcn/ui components are in `components/ui/`
- Toast notifications: newer code uses `toast` from `sonner` directly; older pages use `useToast` from `hooks/use-toast.ts`. Prefer `sonner` for new code.
- Types for domain objects live in `types/` (`recepcion.ts`, `boleta.ts`, `planilla.ts`, `tareas-diarias.ts`)
- PDF export uses `jspdf` + `jspdf-autotable`
- `decimal.js` is available for precise monetary calculations
