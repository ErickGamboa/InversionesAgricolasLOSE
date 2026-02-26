# AGENTS.md - Coding Guidelines

## Project Overview
Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui for pineapple reception management ("Inversiones agrícolas LOSE").

## Build Commands
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production (ignores TS errors)
- `npm run lint` - Run ESLint (`eslint .`)
- `npm run start` - Start production server
- **Testing**: No framework configured. When adding tests:
  - Install Vitest: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - Add to package.json: `"test": "vitest"`
  - Single test: `npm test -- <pattern>`
  - Watch mode: `npm test -- --watch <pattern>`
  - Test files: `*.test.ts`, `*.test.tsx`, or `*.spec.ts`

## Environment Variables
Required variables (never commit to git):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only (never expose)

## TypeScript Configuration
- Target: ES6, Module: ESNext, JSX: react-jsx
- Path alias: `@/*` maps to root (e.g., `@/components`)
- Strict mode enabled
- Build ignores TS errors (`ignoreBuildErrors: true` in next.config.mjs)
- Prefer `unknown` over `any`

## Code Style Guidelines

### Naming Conventions
- **Components**: PascalCase (e.g., `TransactionForm`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMobile`)
- **Utilities**: camelCase (e.g., `createClient`)
- **Files**: kebab-case for components/pages, camelCase for utilities
- **Props interfaces**: `ComponentNameProps`
- **Option interfaces**: `[Entity]Option` (e.g., `ClienteOption`)

### TypeScript Types
- Use `interface` for object shapes
- Use `type` for unions/complex types
- Always type props and return values for exports

### Imports Order
1. React/Next imports
2. Third-party libraries
3. Internal UI components (`@/components/ui/*`)
4. Feature components (`@/components/dashboard/*`)
5. Utilities (`@/lib/*`)
6. Hooks (`@/hooks/*`)
7. Types/interfaces

### Component Patterns
- Functional components with named exports
- Client components: `"use client"` at top (before imports)
- Use `cn()` from `@/lib/utils` for class merging
- Support `asChild` prop when wrapping Radix/shadcn
- Local state with hooks; avoid global state

### Styling (Tailwind v4)
- Import: `@import "tailwindcss";` in global CSS
- CSS variables: `--color-primary`, `--color-background`
- Utilities: `hover:`, `focus:`, `sm:`, `md:`, `lg:`
- Container queries: `@container`, `@container-xs`
- Colors: `bg-primary`, `text-foreground`, `border-border`
- Variants: Use `cva` (class-variance-authority)

### Mobile Responsiveness
- Use `flex-col` for mobile, `sm:flex-row` for desktop
- Allow text to wrap with `line-clamp-3` on mobile
- Reduce font sizes: `text-base sm:text-lg`
- Stack buttons vertically on small screens
- Use `border-t sm:border-t-0` to separate sections

### Error Handling
- Wrap async operations in `try/catch`
- User-facing messages in Spanish
- Error extraction: `error instanceof Error ? error.message : "Error desconocido"`
- Use `toast` from `sonner` for notifications

### Forms & Tables
- Controlled inputs with `value` and `onChange`
- Validate on submit
- Use `Spinner` during loading
- Local filtering with `searchTerm` and `.filter()`
- Currency: `toLocaleString('es-CR')` for colones

## Database (Supabase)
- Query: `supabase.from("table").select().eq().order()`
- Client: `@/lib/supabase/client` (sync, browser)
- Server: `@/lib/supabase/server` (async, server components)
- Tables use Spanish names
- Never expose secrets; use env variables
- Use Row Level Security (RLS) policies for data protection

## Localization Requirements
- All user-facing text in Spanish
- Error messages: "Error desconocido", "Guardado exitosamente"
- Date format: `dd MMM, HH:mm` in Spanish
- Currency: CRC prefix (not ₡) for PDF compatibility
- Decimal places: 3 for all monetary values

## Key Conventions

### Currency Handling
- CRC: `es-CR` locale, `CRC` prefix
- USD: `en-US` locale, `$` prefix
- Use `decimal.js` for calculations
- Never use native arithmetic for money

### Deletion Patterns
- Show confirmation with `AlertDialog`
- Message: "¿Está seguro de eliminar...?"
- Include: "Esta acción no se puede deshacer"

### File Structure
- `app/`: Next.js App Router, Spanish kebab-case routes
- `components/ui/`: shadcn components
- `components/dashboard/`: Feature logic
- `lib/`: Utilities and clients
- `hooks/`: Custom React hooks
- `types/`: TypeScript type definitions

## Form Validation (Zod + React Hook Form)
- Define schemas in `lib/schemas/` using Zod
- Use `zodResolver` from `@hookform/resolvers`
- Validate on submit, not on change
- Show inline errors with `FormMessage` component

## Server Actions & API Routes
- Place server actions in `app/actions/` or co-located with components
- Always validate user input with Zod before database operations
- Use `use server` directive for server actions
- Return typed responses for client consumption

## Loading & Empty States
- Use `Skeleton` component while loading data
- Show empty states with helpful messages and actions
- Implement `isLoading` states in forms with `Spinner` button
- Handle suspense with `loading.tsx` in route groups

## Debugging Tips
- Hydration errors: Check for date/time formatting, random values in components
- Use `console.log` sparingly; prefer React DevTools
- Check browser console for Supabase/RLS errors
- Verify env variables are loaded correctly

## Performance
- Use `useMemo` for expensive calculations
- Use `useCallback` for child component props
- Use SWR for data fetching with caching
- Lazy load heavy components with `dynamic()`
- Implement pagination for large lists (>100 items)

## Build Check
Always run `npm run build` or `npm run lint` after changes.

## Code Review Checklist
- [ ] All user-facing text in Spanish
- [ ] No `console.log` in production code
- [ ] Error handling with try/catch and user messages
- [ ] Loading states during async operations
- [ ] Environment variables documented
- [ ] Mobile-responsive layout tested
