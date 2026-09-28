<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — TradeEdu Frontend Agent Guidelines

This document provides definitive guidance for all AI coding agents working on the `next-frontend` repository. Adhere to these architectural principles, design patterns, coding rules, and project milestones to ensure consistency across iterations.

---

## 1. Product Context & Core Philosophy

**Product Name:** TradeEdu: Next-Generation Virtual Stock Simulator  
**Vision:** An institutional-grade, risk-free educational trading simulator designed to prepare retail investors for real financial markets.

### Key Pillars
1. **Realistic Market Friction (Anti-Gamification):**
   - Unlike recreational trading apps with instant executions and infinite leverage, TradeEdu forces users to confront real market mechanics: dynamic bid-ask spreads, randomized execution delays (50–500ms), and volume-based slippage.
2. **Opportunity Cost & Capital Preservation ("The Vault"):**
   - Uninvested cash can be deposited into "The Vault" to earn a simulated risk-free APY (e.g. 5.1%), teaching the fundamental lesson that sitting on idle cash carries opportunity cost.
3. **Risk-Adjusted Performance:**
   - Trader evaluation and leaderboards prioritize risk metrics (Sharpe Ratio, Maximum Drawdown) over reckless raw P&L.
4. **European & Swedish Regulatory Compliance (Privacy by Design):**
   - Uncompromising adherence to GDPR and Swedish IMY guidelines.
   - Dark-pattern-free UI: Equal weight cookie consent banner defaulting non-essential trackers to **off**.
   - Data minimization: Google Sign-In with minimum scopes.
   - Automated "Right to Erasure" (account deletion) available in user settings.

### User Tiers
- **Tier 1 — Public Explorer (Unauthenticated):** Fuzzy equity search (Avanza proxy), fundamental ratios (P/E, dividend yield, market cap), and 60fps candlestick market charts.
- **Tier 2 — Registered Trader (Authenticated):** Automatic provisioning of $100,000 virtual capital, custom watchlists, portfolio analytics, order execution (Market, Limit, Stop-Loss), and The Vault.

---

## 2. Technology Stack & Key Dependencies

- **Framework:** Next.js `16.3.x` (App Router, Turbopack)
- **Runtime / Language:** React `19.2.x`, TypeScript `5.x`
- **Styling:** Tailwind CSS `v4` (`@tailwindcss/postcss`, configured via `@theme` in `src/app/globals.css` — **no** `tailwind.config.js`)
- **State Management:** Zustand `v5.x`
- **Charting & Visualization:**
  - `recharts` (`^3.10.x`) — Area charts & portfolio visualizations
  - `lightweight-charts` (`^5.2.x`) — High-performance TradingView candlestick charting for market discovery
- **Icons:** `lucide-react` (`^1.47.x`)
- **Authentication:** Google OAuth / session cookie with backend pass-through (`credentials: 'include'`)
- **Backend Service:** Go (Gin + GORM) running at `http://localhost:8081`, proxying Avanza API directly without caching.
  - Rewrites configured in `next.config.ts`: `/api/v1/:path*` &rarr; `http://localhost:8081/api/v1/:path*`.

---

## 3. Architecture & Directory Structure

The project follows a **Feature-Driven Layered Architecture**. Do **not** bloat the Next.js `app/` folder with domain logic; route pages should act as thin composable controllers.

```text
src/
├── app/                        # App Router (routing, layout, top-level composition)
│   ├── dashboard/page.tsx      # Redirects to '/'
│   ├── globals.css             # Tailwind v4 imports and theme variables
│   ├── layout.tsx              # Root HTML layout, Geist fonts, Providers wrapper
│   ├── page.tsx                # Main SPA dashboard shell with activeView switcher
│   └── providers.tsx           # Client-side context providers
├── components/                 # Domain-agnostic, reusable UI elements
│   ├── layouts/                # Global layout wrappers (e.g. Sidebar.tsx)
│   └── ui/                     # Shared UI components (CookieBanner.tsx, ToastContainer.tsx)
├── features/                   # Domain-specific feature modules
│   ├── analytics/              # Performance metrics & asset allocation
│   ├── auth/                   # Authentication & Google login UI
│   ├── help/                   # Support center & knowledge base
│   ├── orders/                 # Order history & fill statuses
│   ├── portfolio/              # Dashboard widgets (KPICards, AssetChart, OrderTicket, HoldingsTable)
│   ├── screener/               # Avanza stock search & filtering
│   ├── settings/               # Profile & GDPR Right to Erasure
│   ├── vault/                  # The Vault risk-free APY simulator
│   └── watchlist/              # User watchlist management
├── lib/                        # Shared utilities and network clients
│   └── api.ts                  # Centralized fetch client (routes to /api/v1/)
└── store/                      # Cross-feature Zustand stores
    ├── usePortfolioStore.ts    # Holdings, balance, order execution, watchlists
    └── useUIStore.ts           # Active view, auth session, toast notifications, cookie banner
```

### Module Layout Rule for Features:
When creating or refactoring a feature (`src/features/<feature-name>/`), organize into:
- `components/` — UI components specific to this feature.
- `store/` — Feature-local Zustand slices (if not cross-cutting).
- `api/` — Typed API fetch functions or TanStack Query hooks.
- `types.ts` — Domain-specific models and DTO interfaces.

---

## 4. Current State of the Application

1. **Routing Pattern:**
   - The primary application operates as an authenticated SPA dashboard shell at `src/app/page.tsx`.
   - Navigation between views is currently controlled via `useUIStore.activeView` (`Dashboard`, `Watchlist`, `Vault`, `Orders`, `Analytics`, `Screener`, `Settings`, `Help`, `Trade`).
   - Route `/dashboard` issues an immediate client redirect to `/`.
2. **Authentication Flow:**
   - On initial load, `useUIStore.checkAuth()` calls `/api/v1/user/profile`.
   - If unauthenticated, the `Login` feature is rendered with a direct Google OAuth link to `/api/v1/auth/login`.
   - On 401/403 responses, `src/lib/api.ts` dispatches a window event `'auth-error'` to prompt re-authentication.
3. **Data Integration:**
   - `fetchDashboard()` loads portfolio total value, positions, and cash balance from `/api/v1/portfolio/dashboard`.
   - `executeTrade()` posts order payloads to `/api/v1/orders/` and refreshes portfolio state.
   - `Screener` queries the Avanza proxy via `/api/v1/stocks/search?q=...`.
   - `AssetChart` fetches price series from `/api/v1/stocks/chart?orderbookID=...&timePeriod=...`.

---

## 5. Coding Standards & Agent Best Practices

### 5.1 Strict TypeScript (Zero `any` Policy)
- **Never use `any`:** Replace all occurrences of `any` with strict interfaces or `unknown` (narrowed with type guards/schemas).
- **Use `interface` for object models & component props:** Allow for declaration merging and clearer IDE errors. Use `type` for unions, primitives, and tuples.
- **Explicit Return Types:** Specify return types on all helper functions, store actions, and API functions.
- **Create Domain Types in `types.ts`:**
  - Define exact models for Avanza stock hits, positions, chart points, and order tickets.

### 5.2 React 19 & Component Patterns
- **Standard Function Declarations:** Define components using `export function ComponentName(props: ComponentProps) {}`. Never use `const Component = () => {}` or `React.FC`.
- **Export Strategy:** Use **named exports** for all components, stores, and utilities. Reserve **default exports** strictly for Next.js route boundaries (`page.tsx`, `layout.tsx`).
- **Hook Purity (React 19 Rule):**
  - **NEVER call `setState` synchronously in the root body of a `useEffect`.**
  - Compute derived values during render or execute state updates inside asynchronous promises / event handlers. Synchronous `setState` in effects triggers React 19 ESLint errors (`react-hooks/set-state-in-effect`) and cascading re-renders.
- **JSX Escaping:** Always escape quotes and apostrophes in JSX text (e.g. use `&apos;`, `&quot;` or curly braces `{"'"}`).

### 5.3 State Management (Zustand & Server State)
- **Client State vs Server State:**
  - Use **Zustand** strictly for synchronous client UI states (active views, modals, toasts, transient form inputs, optimistic toggles).
  - Encapsulate async server requests within typed store actions or data-fetching hooks.
- **Keep Stores Modular:** If a store grows too large, break it down using the slice pattern rather than creating monolithic stores.

### 5.4 UI / Visual Design System
- **Theme Palette:**
  - Background: Pitch black `#000000`
  - Cards & Panels: `#0a0a0a` with `#111111` nested sections
  - Borders: Subtle `#27272a`
  - Text: High-contrast white `#ffffff` and muted `#a1a1aa` / `#71717a`
  - Accent / Positive: Emerald `#22c55e` (green-500)
  - Negative / Warning: Crimson `#ef4444` (red-500)
- **Tailwind v4 Conventions:**
  - Use standard utility classes matching the dark institutional aesthetic.
  - Do not create a `tailwind.config.js`. Extend theme variables within `@theme` in `src/app/globals.css`.
- **GDPR & Ethical UI:**
  - Never introduce deceptive patterns (e.g. pre-checked consent boxes, disguised ads, countdown pressure tickers).

---

## 6. Testing, Verification & Quality Gates

When completing tasks or submitting changes, future agents must run the following checks:

1. **Type Checking:**
   ```bash
   npx tsc --noEmit
   ```
   Must pass with **0 errors**.

2. **Linting & React 19 Checks:**
   ```bash
   npm run lint
   ```
   Ensure all ESLint errors (specifically `no-explicit-any`, `react-hooks/set-state-in-effect`, and unescaped entities) are resolved before finishing.

3. **Build Note (Sandbox Environments):**
   - `npm run build` utilizes Turbopack and attempts to download Google Fonts (`next/font/google`) during compilation. In offline or network-isolated sandboxes, font fetching will fail. Rely on `npx tsc --noEmit` and `npm run lint` for isolated code verification.

---

## 7. Sprint Roadmap & Pending Refactoring Targets

Consult `.agents/scrum/project_goal.md` for full epic requirements. Priority objectives for upcoming agent iterations:

1. **Typing Hygiene & Tech Debt:**
   - Eliminate remaining `any` types in `src/store/usePortfolioStore.ts`, `src/features/portfolio/components/AssetChart.tsx`, `src/features/portfolio/components/OrderTicket.tsx`, and `src/features/screener/components/Screener.tsx`.
   - Fix React 19 effect warnings in `AssetChart.tsx` and `Screener.tsx`.
2. **TradingView Lightweight Charts Integration (Epic 2, US 2.3):**
   - Replace or complement the Recharts area chart in `AssetChart.tsx` with high-performance 60fps candlestick charting using `lightweight-charts`.
3. **Execution Delay & Friction Engine (Epic 4, US 4.3):**
   - Implement frontend simulation feedback for randomized 50–500ms execution latency and slippage indicators in `OrderTicket.tsx`.
4. **The Vault Full Synchronization (Epic 4, US 4.1):**
   - Connect `Vault.tsx` directly to backend endpoints for APY calculations and live balance transfers rather than local mock state.
