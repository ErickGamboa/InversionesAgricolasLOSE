# AGENTS.md - Coding Guidelines for Agents

## Project Overview
Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 project using shadcn/ui components for a pineapple reception management system.

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint (eslint .)
- `npm run start` - Start production server

## Testing
No test framework configured. Add tests using Jest or Vitest if needed.

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Target: ES6, Module: ESNext
- Use `@/*` path alias for imports from root
- Always type props and return values for exported functions
- Use `interface` for object shapes, `type` for unions/complex types

### Imports Order
1. React/Next imports
2. Third-party libraries (lucide-react, sonner, etc.)
3. Internal components (@/components/ui/*)
4. Internal utilities (@/lib/*)
5. Types

### Component Patterns
- Use functional components with named exports
- Props interface named as `ComponentNameProps`
- Client components: add `"use client"` directive at top
- Server components: default, no directive needed
- Use `cn()` utility from @/lib/utils for className merging

### Naming Conventions
- Components: PascalCase (e.g., `TransactionForm`)
- Hooks: camelCase starting with `use` (e.g., `useMobile`)
- Utilities: camelCase (e.g., `createClient`)
- Types/Interfaces: PascalCase (e.g., `SelectOption`)
- File names: kebab-case for components, camelCase for utilities

### Styling (Tailwind CSS v4)
- Use `@import 'tailwindcss'` syntax
- CSS variables in globals.css (e.g., `--color-primary`)
- Utility classes with `:` prefix for states (hover:, focus:)
- Container queries: `@container` and `@container-xs`
- Color utilities: `bg-primary`, `text-foreground`
- Spacing: `gap-4`, `px-3`, `h-9`
- Responsive: `sm:`, `md:`, `lg:`, `xl:` prefixes

### Error Handling
- Use try/catch for async operations
- Error messages in Spanish for user-facing text
- Use `toast` from sonner for user notifications
- Pattern: `const message = error instanceof Error ? error.message : "Error desconocido"`

### State Management
- Use React hooks: `useState`, `useEffect`, `useCallback`
- Form data managed with local state
- Supabase client created per component (don't share instances)
- Loading states with `Loader2` icon and `animate-spin`

### Form Patterns
- Controlled inputs with `value` + `onChange`
- Use shadcn/ui components: `Input`, `Select`, `Button`, `Card`
- Validation on submit, not per-field
- Reset form after successful save

### Database (Supabase)
- Server client: `@/lib/supabase/server` (async)
- Client client: `@/lib/supabase/client` (sync)
- Pattern: `supabase.from("table").select().eq().order()`
- Always check for errors and handle them

### MCP (Model Context Protocol)
- Supabase MCP server configured at `https://mcp.supabase.com/mcp`
- Configuration files: `.cursor/mcp.json` and `.opencode/mcp.json`
- Use MCP tools to query database schema, manage tables, run SQL
- **Security**: Never use MCP on production data - use only for development
- Ask user to authenticate via browser when using MCP tools for the first time
- Available tools include: querying tables, managing database schema, running migrations

### UI Components (shadcn/ui)
- Located in `@/components/ui/`
- Use `cn()` for conditional classes
- Support `asChild` prop for composition
- Variants defined with `cva` (class-variance-authority)

### Comments
- Minimal comments, prefer self-documenting code
- JSDoc for utility functions only when necessary
- No inline comments explaining obvious code

### File Structure
- `app/` - Next.js app router pages
- `components/ui/` - shadcn/ui components
- `components/dashboard/` - Feature-specific components
- `lib/` - Utilities and database clients
- `hooks/` - Custom React hooks
- `styles/` - Global CSS files
