# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SplitCar is a web application for tracking fuel fills, logging trips, and splitting car costs fairly during shared car usage and group trips.

**Tech Stack:**

- Next.js 16 (App Router)
- React 19.2
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (New York style)
- Radix UI primitives

## Common Commands

**Development:**

```bash
npm run dev     # Start development server (uses Turbopack)
```

**Build & Production:**

```bash
npm run build   # Build for production
npm start       # Start production server
```

**Linting:**

```bash
npm run lint    # Run ESLint
```

## Architecture

**Component System:**

- Uses shadcn/ui component library configured via `components.json`
- UI components located in `components/ui/`
- Components follow the "New York" style variant
- Icons from `lucide-react`

**Path Aliases:**

- `@/*` maps to project root
- `@/components` � components directory
- `@/lib/utils` � utility functions
- `@/ui` � UI components
- `@/hooks` � React hooks

**Styling:**

- Tailwind CSS v4 with PostCSS
- Custom CSS variables defined in `app/globals.css` using OKLCH color space
- Theme system supports light/dark modes
- Design tokens: `--radius`, color variables, chart colors, sidebar colors
- Geist font family (sans and mono) loaded via `next/font`

**Utilities:**

- `lib/utils.ts` exports `cn()` function for conditional className merging (clsx + tailwind-merge)

**Hooks:**

- Custom React hooks available in `hooks/` directory
- Common hooks include: `use-boolean`, `use-dark-mode`, `use-mobile`, `use-local-storage`, `use-media-query`, `use-debounce-callback`, `use-debounce-value`, `use-event-listener`, `use-copy-to-clipboard`, and more

## Key Configuration

- TypeScript strict mode enabled
- Path aliasing configured in `tsconfig.json`
- Turbopack enabled in `next.config.ts`
- ESLint uses Next.js config
- shadcn/ui uses RSC (React Server Components) and TypeScript by default
