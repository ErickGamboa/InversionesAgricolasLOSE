# AGENTS.md - Inversiones agricolas LOSE

## Purpose
Guidance for coding agents working in this repository.
Stack: Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui, Supabase.

## Repository Facts
- Package manager: npm (`package-lock.json` present; `pnpm-lock.yaml` also present, but use npm unless user asks otherwise).
- App type: Next.js App Router (`app/` directory).
- Build behavior: `next build` ignores TypeScript errors (`ignoreBuildErrors: true` in `next.config.mjs`).
- Path alias: `@/*` maps to workspace root (see `tsconfig.json`).
- ESLint command exists, but no custom eslint config file was found in repo root.
- No test framework is currently configured in `package.json`.

## Cursor / Copilot Rules
- Checked for `.cursor/rules/`, `.cursorrules`, and `.github/copilot-instructions.md`.
- None were found at the time this file was generated.
- If these files are later added, treat their rules as higher-priority, then merge into this guide.

## Commands
- `npm run dev` - Start local development server.
- `npm run build` - Production build (does not fail on TS errors in this project).
- `npm run lint` - Run ESLint across the repo (`eslint .`).
- `npm run start` - Start production server.

## Testing Status And Recommendations
- Current status: no `test` script and no test deps installed.
- Recommended stack: Vitest + Testing Library + jsdom.
- Install once: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`.
- Add script: `"test": "vitest"` in `package.json`.
- Run all tests: `npm test`.
- Run a single test file: `npm test -- path/to/file.test.tsx`.
- Run a single test by name: `npm test -- -t "nombre del caso"`.
- Watch a single test file: `npm test -- --watch path/to/file.test.tsx`.
- Suggested naming: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`.

## Required Environment Variables
Never commit secrets. Use local `.env` files and deployment env settings.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to client code)

## Core Code Style

### Language And Types
- Prefer TypeScript for all new code.
- Keep `strict` mode assumptions; avoid weakening types.
- Use `interface` for object shapes and component props.
- Use `type` for unions, mapped types, utility compositions, and aliases.
- Prefer `unknown` over `any`; narrow before use.
- Type exported functions and component props explicitly.

### Naming
- Components: PascalCase (`TransactionForm`).
- Hooks: camelCase with `use` prefix (`useUserRole`).
- Utility functions: camelCase (`getLocalDateString`).
- Route segments in `app/`: Spanish kebab-case when applicable.
- UI/feature file names: kebab-case (`compras-regulares-form.tsx`).
- Props interfaces: `ComponentNameProps`.
- Option-style interfaces: `[Entidad]Option`.

### Imports
Use stable import grouping and keep related imports together:
1. React/Next imports.
2. Third-party packages.
3. Internal UI components (`@/components/ui/*`).
4. Feature components (`@/components/dashboard/*`).
5. Utilities/clients (`@/lib/*`).
6. Hooks (`@/hooks/*`).
7. Types.

### Formatting And Structure
- Follow existing file style first (quotes and minor spacing vary in current codebase).
- Prefer concise functions and early returns.
- Keep components functional; avoid class components.
- Put `"use client"` as first statement when needed.
- Use `cn()` from `@/lib/utils` for class name merging.
- Only add comments for non-obvious logic.

## React / Next.js Conventions
- Default to Server Components; use Client Components only when hooks/browser APIs are required.
- Keep page/layout exports as default functions in `app/`.
- Co-locate feature UI in `components/dashboard/*`.
- Use loading states for async UI (`Spinner`, `Skeleton`, disabled buttons).
- Add `loading.tsx` for route-level suspense where needed.

## Styling Guidelines (Tailwind v4 + shadcn)
- Global CSS uses `@import "tailwindcss"` and CSS variables.
- Prefer design tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- Use `cva` patterns for variant-heavy reusable UI.
- Keep responsive behavior explicit (`sm:`, `md:`, `lg:`).
- Mobile-first layouts: stack on small screens, expand with breakpoints.
- Preserve current visual language unless task explicitly requests redesign.

## Forms, Validation, And UX
- Prefer controlled inputs in complex business forms.
- Validate on submit; avoid noisy per-keystroke validation unless requested.
- Use Zod + `zodResolver` for robust form validation.
- Show inline errors and toast feedback.
- Keep submit buttons disabled while submitting; show `Spinner`.

## Error Handling
- Wrap async operations in `try/catch`.
- Use user-facing error messages in Spanish.
- Safe extraction pattern:
  - `const message = error instanceof Error ? error.message : "Error desconocido"`
- Prefer graceful fallback UI over throwing raw errors in client components.

## Data And Supabase
- Browser client: `@/lib/supabase/client`.
- Server client: `@/lib/supabase/server`.
- Query style: `supabase.from("tabla").select().eq().order()`.
- Keep table/field naming aligned with existing Spanish schema.
- Respect RLS assumptions; do not bypass security with service role in client code.

## Domain-Specific Rules (Important)
- All user-facing text must be in Spanish.
- Monetary formatting:
  - CRC: `es-CR` locale, `CRC` prefix for PDF compatibility.
  - USD: `en-US` locale, `$` prefix.
  - Use 3 decimal places for business monetary values unless screen-specific convention differs.
- Use `decimal.js` for monetary calculations; avoid native floating-point arithmetic for critical totals.
- Deletion UX should use confirmation dialogs with irreversible-action wording.

## Performance And Reliability
- Use `useMemo` for expensive derived values.
- Use `useCallback` when passing callbacks deep into memoized children.
- Prefer SWR patterns for cacheable client data fetches.
- Lazy-load heavy UI where practical.
- Paginate or chunk very large datasets.

## Pre-PR / Pre-Commit Checks
- Run at least one quality gate after modifications:
  - `npm run lint` (recommended baseline), and/or
  - `npm run build` (for integration-level sanity).
- If tests exist, run impacted test scope, ideally including single-test verification.
- Remove debug `console.log` calls unless intentionally retained.
- Confirm mobile responsiveness for touched UI.

## Agent Execution Checklist
- Read existing patterns in nearby files before editing.
- Keep changes minimal and consistent with local conventions.
- Do not introduce secrets or commit `.env` values.
- Prefer fixing root causes over adding brittle workarounds.
- Document non-obvious decisions in PR/commit notes when relevant.
