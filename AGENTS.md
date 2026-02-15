# AGENTS.md - Coding Guidelines for Agents

## Project Overview
Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 project using shadcn/ui components for a pineapple reception management system ("Inversiones agrícolas LOSE").

## Build Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (ignores TS errors per next.config)
- `npm run lint` - Run ESLint on entire codebase (`eslint .`)
- `npm run start` - Start production server
- **Testing**: No test framework configured. When adding tests with Vitest/Jest:
  - Single test: `npm test -- <test-file-pattern>`
  - Single test with watch: `npm test -- --watch <pattern>`

## TypeScript Configuration
- Target: ES6, Module: ESNext, Path alias: `@/*` maps to root directory
- Strict mode enabled. JSX: `react-jsx` transform
- **Critical**: Build process ignores TypeScript errors (`ignoreBuildErrors: true`). Agents must still strive for type safety and use `unknown` over `any`

## Code Style Guidelines

### TypeScript & Naming
- Always type props and return values for exported functions
- Use `interface` for object shapes, `type` for unions/complex types
- Props interface: `ComponentNameProps` (e.g., `TransactionFormProps`)
- Option interfaces for dropdowns: `[Entity]Option` (e.g., `ClienteOption`)
- Component names: PascalCase (e.g., `TransactionForm`)
- Hooks: camelCase with `use` prefix (e.g., `useMobile`)
- Utilities: camelCase (e.g., `createClient`)
- File names: kebab-case for components/pages, camelCase for utilities

### Imports Order
1. React/Next imports (e.g., `useState`, `useEffect`, `useCallback`, `createClient`)
2. Third-party libraries (`lucide-react`, `sonner`, `radix-ui`, `clsx`, `tailwind-merge`)
3. Internal UI components (`@/components/ui/*`)
4. Feature-specific components (`@/components/dashboard/*`)
5. Internal utilities (`@/lib/*`)
6. Hooks (`@/hooks/*`)
7. Types/interfaces

### Component Patterns
- Functional components with named exports (avoid default exports except for Pages/Layouts)
- Client components: `"use client"` directive at the very top (before imports)
- Use `cn()` from `@/lib/utils` for conditional class merging
- Support `asChild` prop for composition flexibility when wrapping Radix/shadcn
- Local state management with hooks; avoid complex global state unless necessary

### Styling (Tailwind CSS v4)
- Import syntax: `@import "tailwindcss";` in global CSS
- CSS variables for themes: `--color-primary`, `--color-background`, etc.
- Utility states: `hover:`, `focus:`, `disabled:`, `sm:`, `md:`, `lg:`
- Container queries: `@container` and `@container-xs` for responsive sub-components
- Colors: `bg-primary`, `text-foreground`, `border-border`, `text-destructive`
- Component variants: Define with `cva` (class-variance-authority)

### Error Handling & Localization
- Wrap async operations in `try/catch` blocks
- User-facing messages MUST be in Spanish (e.g., "Error desconocido", "Guardado exitosamente")
- Error extraction: `const message = error instanceof Error ? error.message : "Error desconocido"`
- User notifications: Use `toast` from `sonner` library
- Supabase: Always check `error` returned from queries and handle appropriately

### Form & Table Patterns
- **Forms**: Controlled inputs with `value` and `onChange`
- **Validation**: Perform on submit. Use `required` and basic logic before calling Supabase
- **Loading**: Use `Spinner` component during submission or data fetching
- **Tables**: Local filtering using `searchTerm` and `.filter()`
- **Currency**: Format with `toLocaleString` (e.g., `es-CR` for colones, `en-US` for dollars)

### Database (Supabase)
- Query pattern: `supabase.from("table").select().eq().order()`
- Client creation: Use `createClient()` per component
- Client Side: `@/lib/supabase/client` (sync)
- Server Side: `@/lib/supabase/server` (async)
- **Security**: Never expose secrets or hardcode keys. Use environment variables

### MCP (Model Context Protocol)
- Supabase MCP: `https://mcp.supabase.com/mcp`
- Use for: Database schema exploration, SQL execution in development
- **Critical Security**: NEVER use on production data. Development only
- Authentication: Requires browser-based confirmation on first use

### File Structure
- `app/`: Next.js App Router (pages/layouts). Spanish kebab-case for routes
- `app/dashboard/`: Protected dashboard routes
- `components/ui/`: Base shadcn/ui components (reusable)
- `components/dashboard/`: Feature-specific logic (forms, tables)
- `lib/`: Utilities, Supabase clients, and global helpers
- `hooks/`: Custom React hooks (e.g., `useMobile`, `useToast`)
- `styles/`: Global CSS and Tailwind configuration
- `migrations/`: Supabase SQL migrations for schema changes

### Best Practices for Agents
1. **Understand Context**: Read `package.json` and `tsconfig.json` before proposing dependencies
2. **Absolute Paths**: Always use absolute paths (e.g., `C:\Users\Erick G\Desktop\...`) for tool calls
3. **Proactiveness**: If a bug is found in related files during a task, suggest a fix
4. **Style Matching**: Analyze surrounding files to match indentation (2 spaces) and syntax
5. **No Reverts**: Do not revert changes unless explicitly asked or if they cause errors
6. **Path Resolution**: Resolve relative paths to absolute paths before calling `read` or `write`
7. **Build Check**: Always run `npm run build` or `npm run lint` after significant changes
8. **Documentation**: Keep `AGENTS.md` updated if new libraries or patterns are introduced

### Key Dependencies
- **UI**: Radix UI primitives, shadcn/ui components, Tailwind CSS v4
- **Forms**: React Hook Form with Zod validation
- **Data**: SWR for client-side data fetching, Supabase for database
- **Reports**: jsPDF + autotable for PDF, xlsx for Excel exports
- **Dates**: date-fns for date manipulation
- **Decimals**: decimal.js for precise calculations

### Supabase Table Naming
Tables use Spanish names: `compras_regulares`, `compras_especiales`, `ventas_plantas`, `transporte_interno`, `transporte_contratado`, `recepciones`, `choferes`, `clientes`, `placas`, `plantas`

### Currency Handling
- CRC (Colones): Format with `es-CR` locale, use `CRC` prefix (not ₡) for PDF compatibility
- USD (Dólares): Format with `en-US` locale, use `$` prefix
- All prices display with 3 decimal places

### Decimal Calculations
- Use `decimal.js` for precise monetary calculations to avoid floating-point errors
- Example: `new Decimal(value).toFixed(3, Decimal.ROUND_DOWN)`
- Never use JavaScript's native arithmetic for financial calculations

### Date Handling
- Use `date-fns` for all date manipulations and formatting
- Week numbers start on Sunday ( Costa Rica standard)
- Format dates as `YYYY-MM-DD` for database storage
- Display dates in Spanish locale with `dd MMM, HH:mm` format

### Deletion Patterns
- Always show confirmation dialog before deleting records
- Use `AlertDialog` component for confirmation
- Messages should be in Spanish: "¿Está seguro de eliminar...?"
- Include warning: "Esta acción no se puede deshacer"

### Chofer Classification
- **Internos**: Walter Lopez, Geiner Aguilar, Jonathan Aguilar, Fernando Chavez, William Ugalde, William Vargas, Adali Aguilar, Pablo Lopez S, Leonardo Ledezma, Víctor Quesada A, Nelson Camacho, Carlos Camacho, Carlos Lopez Alfaro, Arnold Corella, Alvaro German, Manrique Benavidez
- **Externos**: All other choferes
- Module filtering: Compras Especiales uses only externos; all other modules use only internos

### Report Generation
- Excel exports: Use `xlsx` library with formatted numbers
- PDF exports: Use `jsPDF` with `autotable` plugin
- Show totals row only on last page in PDF reports (`showFoot: 'lastPage'`)
- Use `CRC` and `USD` prefixes instead of symbols for PDF compatibility

### Git Workflow
- Never commit secrets or API keys
- Run `npm run build` before committing to ensure no TypeScript errors
- Keep commits focused on single features or fixes
- Do not use `--force` or `--no-verify` flags unless explicitly instructed

### Performance Guidelines
- Use `useMemo` for expensive calculations in tables
- Implement `useCallback` for functions passed to child components
- Use SWR for data fetching with automatic caching and revalidation
- Lazy load heavy components when possible
