<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — TradeEdu Frontend Agent Guidelines

Welcome to the `next-frontend` repository for **TradeEdu**, the Next-Generation Virtual Stock Simulator. 

This file acts as a routing index for AI agents working in this repository to keep context token usage low.

## Agent Instructions

If you are an AI agent operating in this repository, you must read the following documentation depending on your task:

1. **Architecture & Tech Stack**
   If you need to understand the directory structure, framework (Next.js 16.3, React 19, Tailwind v4), state management, or architectural invariants:
   👉 **Read `doc/architecture.md`**

2. **Workflows, Implementation & Coding Standards**
   If you are writing code, implementing a new feature, running tests, or opening/reviewing a Pull Request:
   👉 **Read `doc/workflow.md`**


### Current State of the Application
*(Agents: Update this section whenever you complete a ticket or implement a new feature. Keep it concise, highlighting newly added capabilities, architectural shifts, and current status.)*
- **Current Status:** Every screen has its own URL (story NW-02), on top of Google sign-in plus a guest demo login (story NW-01). Vitest + Testing Library unit tests run with `npm test`.
- **Recent Updates:**
  - URL routes (NW-02): `(app)` group behind the client `AuthGuard` (`src/features/auth/components/AuthGuard.tsx`, sends signed-out visitors to `/login?next=<current URL>`) → `/dashboard`, `/orders`, `/watchlist`, `/analytics`, `/vault`, `/settings`. `(public)` group → `/markets` (`?q=` prefills the search), `/markets/[orderbookId]` (the `StockDetails` page, replaces the old slide-over), `/help`. `/login` sits outside both groups and honours `?next` via `safeNextPath` (`src/features/auth/safe-next.ts`). `/` redirects to `/dashboard`; unknown URLs render `src/app/not-found.tsx`.
  - Root layout title template `'%s · TradeEdu'`; every `page.tsx` exports its own `metadata.title`. `Providers` runs `checkAuth` once per page load and mounts `ToastContainer`.
  - `AppShell` (`src/components/layouts/AppShell.tsx`) wraps both groups: desktop sidebar from `md`, below that a top bar whose "Open navigation" button opens a drawer with the same links. Build links with the helpers in `src/lib/routes.ts` (`ROUTES`, `marketsSearchHref`, `instrumentHref`, `loginHref`); sidebar links come from `NAV_ITEMS` and `isNavItemActive` in `src/components/layouts/navigation.ts` (active link gets `aria-current="page"`). The sidebar search is a form that navigates to `/markets?q=…`.
  - Removed: `activeView`/`setActiveView`/`ViewType` from `useUIStore`, the fake Buy/Sell nav entries, the date/Export header buttons and the Online badge.
  - Guest demo login: `src/features/auth/components/TryDemoButton.tsx` ("Try the demo", a `<button>`, never a link) calls `useUIStore().loginAsGuest()` (`POST /api/v1/auth/guest`, then `checkAuth`) without leaving the app; shown on the Login screen and in the Sidebar when signed out. Pending state uses `aria-busy` + `disabled`, the accessible name stays the same.
  - Sidebar user block: name plus a "Guest" pill (`title="Guest portfolios are deleted after 24 hours"`) and "Demo account" instead of the synthetic email when `user.is_guest`. Only the separate "Sign out" button logs out.
  - `user` in `useUIStore` is the full `UserProfile` from `src/features/auth/types.ts` (`id, name, email, role, balance, is_guest`).
  - Tests: store auth flow in `src/store/__tests__/useUIStore.test.ts` (mocks `fetch`); component tests for Login and Sidebar drive the store with `useUIStore.setState` and `vi.fn()` actions.
  - Defined initial agent workflow and architectural guidelines.
