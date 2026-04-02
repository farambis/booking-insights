@AGENTS.md

# Booking Insights

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Run ESLint with auto-fix
- `npm run typecheck` — Type-check with TypeScript (no emit)
- `npm run test` — Run Vitest in watch mode
- `npm run test:run` — Run Vitest once (CI-friendly)
- `npm run test:coverage` — Run Vitest with coverage
- `npm run format` — Format all files with Prettier
- `npm run format:check` — Check formatting without writing

## Stack

- Next.js 16 (App Router) with Turbopack
- React 19, TypeScript 5
- Tailwind CSS 4 (via PostCSS plugin)

## Project Structure

- `src/app/` — App Router pages and layouts
- `src/app/layout.tsx` — Root layout
- `src/app/page.tsx` — Home page
- `src/app/not-found.tsx` — Custom 404 page
- `src/app/error.tsx` — Route error boundary
- `src/app/global-error.tsx` — Root layout error boundary
- `src/lib/env.ts` — Environment variable validation (t3-env + Zod)
- `public/` — Static assets
- `@/*` path alias maps to `./src/*`

## Conventions

- Use the App Router (`src/app/`). Do not use the Pages Router.
- Default to Server Components. Only add `"use client"` when the component needs interactivity, browser APIs, or React hooks (useState, useEffect, etc.).
- Use Tailwind utility classes for styling. Avoid CSS modules or inline styles.
- Keep components small and focused. Extract reusable components into `src/components/`.
- Use TypeScript strict mode. Avoid `any` — prefer explicit types or `unknown`.
- Use `@/` import alias for all project imports (e.g., `import { Button } from "@/components/Button"`).
- Name files in kebab-case. Name React components in PascalCase.
- Colocate tests next to the code they test (e.g., `button.test.tsx` alongside `button.tsx`). Test files use the `*.test.{ts,tsx}` pattern.
- **Always write tests first (TDD).** Write failing tests that describe expected behavior, then implement the minimum code to make them pass.
- Tests use Vitest with React Testing Library. Use `globals: true` (describe, it, expect are auto-imported).
- Code is formatted with Prettier (config in `.prettierrc`) with the Tailwind CSS plugin for consistent class ordering.
- Error boundary files (`error.tsx`, `global-error.tsx`) and the custom 404 page (`not-found.tsx`) exist at the app root.
- Environment variables are validated at build time via `src/lib/env.ts` using `@t3-oss/env-nextjs` and Zod. Add new env vars there and in `.env.example`.

## Git

- Do NOT add Co-Authored-By lines to commits.
- Never commit directly to main. Always create a feature branch first (e.g., `feature/add-dashboard`, `fix/broken-nav`).
- When the feature is complete: rebase onto main, squash commits into one, and fast-forward merge into main.
- **Lefthook pre-commit** (parallel): Prettier format on staged files, ESLint on staged files, TypeScript type-check, Vitest run
- **Lefthook pre-push**: Full production build (`npm run build`)
