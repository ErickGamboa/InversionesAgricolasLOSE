# AGENTS.md - Coding Guidelines for Agents

## Project Overview
Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 project using shadcn/ui components for a pineapple reception management system.

## Build Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (ignores TS errors per next.config)
- `npm run lint` - Run ESLint on entire codebase (eslint .)
- `npm run start` - Start production server
- **Testing**: No test framework configured. When adding tests with Jest/Vitest:
  - Single test: `npm test -- <test-file-pattern>`
  - Single test with watch: `npm test -- --watch <pattern>`

## TypeScript Configuration
- Target: ES6, Module: ESNext
- Strict mode enabled
- Path alias: `@/*` maps to root directory
- JSX: react-jsx transform
- Build ignores TypeScript errors (configured in next.config.mjs)

## Code Style Guidelines

### TypeScript
- Always type props and return values for exported functions
- Use `interface` for object shapes, `type` for unions/complex types
- Props interface named as `ComponentNameProps` (e.g., `TransactionFormProps`)
- Option interfaces for dropdown data: `[Entity]Option` (e.g., `ClienteOption`)
- Use `unknown` over `any` when type is uncertain

### Imports Order
1. React/Next imports
2. Third-party libraries (lucide-react, sonner, radix-ui, etc.)
3. Internal components (@/components/ui/*)
4. Internal utilities (@/lib/*)
5. Types/interfaces

### Component Patterns
- Functional components with named exports
- Client components: `"use client"` directive at top (before imports)
- Server components: default, no directive needed
- Use `cn()` utility from @/lib/utils for conditional class merging
- Support `asChild` prop for composition flexibility

### Naming Conventions
- Components: PascalCase (e.g., `TransactionForm`)
- Hooks: camelCase with `use` prefix (e.g., `useMobile`)
- Utilities: camelCase (e.g., `createClient`)
- Types/Interfaces: PascalCase (e.g., `SelectOption`)
- File names: kebab-case for components, camelCase for utilities

### Styling (Tailwind CSS v4)
- Import syntax: `@import 'tailwindcss'` in CSS files
- CSS variables: `--color-primary`, `--color-background`
- Utility states: `hover:`, `focus:`, `disabled:`
- Container queries: `@container` and `@container-xs`
- Colors: `bg-primary`, `text-foreground`, `border-border`
- Spacing: `gap-4`, `px-3`, `h-9`, `w-full`
- Responsive: `sm:`, `md:`, `lg:`, `xl:` prefixes
- Component variants: Use `cva` from class-variance-authority

### Error Handling
- Wrap async operations in try/catch blocks
- User-facing messages: Spanish language ("Error desconocido")
- Error extraction: `const message = error instanceof Error ? error.message : "Error desconocido"`
- User notifications: Use `toast` from sonner library
- Always check Supabase query errors and handle them

### State Management
- Local state: `useState`, `useEffect`, `useCallback`
- Form data: Managed with local state (controlled inputs)
- Loading states: Use `Loader2` icon with `animate-spin` class
- Supabase clients: Create per component (don't share instances)
- Server client: Async `@/lib/supabase/server`
- Client client: Sync `@/lib/supabase/client`

### Form Patterns
- Controlled inputs with `value` and `onChange` handlers
- Use shadcn/ui components: `Input`, `Select`, `Button`, `Card`, `Label`
- Form validation: On submit, not per-field
- Reset form state after successful save
- Loading state during submission with spinner

### Database (Supabase)
- Query pattern: `supabase.from("table").select().eq().order()`
- Always check for errors: `const { data, error } = await query`
- Handle null/empty states gracefully
- Use proper typing for database responses

### MCP (Model Context Protocol)
- Supabase MCP: `https://mcp.supabase.com/mcp`
- Config files: `.cursor/mcp.json`, `.opencode/mcp.json`
- Use for: Database schema queries, table management, SQL execution
- **Security**: Never use on production data - development only
- Authentication: Required via browser on first use

### UI Components (shadcn/ui)
- Location: `@/components/ui/`
- Use `cn()` for conditional class merging
- Variants: Defined with `cva` (class-variance-authority)
- Composition: Support `asChild` prop
- Re-export from index when creating new components

### Comments
- Prefer self-documenting code over comments
- Minimal comments for non-obvious logic
- JSDoc for complex utility functions only
- No inline comments explaining obvious code

### File Structure
- `app/` - Next.js app router pages and layouts
- `app/dashboard/` - Protected dashboard routes
- `components/ui/` - shadcn/ui base components
- `components/dashboard/` - Feature-specific components
- `lib/` - Utilities and database clients
- `lib/supabase/` - Supabase client configurations
- `hooks/` - Custom React hooks
- `styles/` - Global CSS and Tailwind imports

## Next.js Configuration
- Images: Unoptimized (`unoptimized: true`)
- TypeScript: Build errors ignored
- Default export from next.config.mjs

## Environment Variables
- Supabase URL and anon key required
- Store in `.env.local` (not committed)
- Access via `process.env.NEXT_PUBLIC_*` for client-side
