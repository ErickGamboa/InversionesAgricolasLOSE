# AGENTS.md - Coding Guidelines

## Project Overview
Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui for pineapple reception management ("Inversiones agrícolas LOSE").

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (ignores TS errors)
- `npm run lint` - Run ESLint (`eslint .`)
- `npm run start` - Start production server
- **Testing**: No framework configured. When adding tests:
  - Install Vitest/Jest first
  - Single test: `npm test -- <pattern>`
  - Watch mode: `npm test -- --watch <pattern>`

## TypeScript Configuration
- Target: ES6, Module: ESNext, JSX: react-jsx
- Path alias: `@/*` maps to root
- Strict mode enabled
- **Note**: Build ignores TS errors (`ignoreBuildErrors: true`)
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
- Client: `@/lib/supabase/client` (sync)
- Server: `@/lib/supabase/server` (async)
- Tables use Spanish names
- Never expose secrets; use env variables

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

## Performance
- Use `useMemo` for expensive calculations
- Use `useCallback` for child component props
- Use SWR for data fetching with caching
- Lazy load heavy components

## Build Check
Always run `npm run build` or `npm run lint` after changes.
