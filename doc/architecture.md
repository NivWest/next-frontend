# TradeEdu Frontend - Architecture Guide

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

## 5. UI / Visual Design System

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

