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
- **Tier 1 — Public Explorer (Unauthenticated):** Instrument search, quotes (last, bid, ask), key indicators (P/E, dividend yield, market cap) and price charts from the backend's `/api/v1/market` API (Avanza or the simulated market).
- **Tier 2 — Registered Trader (Authenticated):** Automatic provisioning of 100,000 SEK virtual capital, custom watchlists, portfolio analytics, order execution (Market, Limit, Stop-Loss), and The Vault.

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
- **Backend Service:** Go (Gin + GORM) running at `http://localhost:8081`. Its provider-neutral `/api/v1/market` API serves either Avanza or the deterministic simulated market, selected by `MARKET_DATA_PROVIDER`; the frontend never talks to a provider directly.
  - Rewrites configured in `next.config.ts`: `/api/v1/:path*` &rarr; `http://localhost:8081/api/v1/:path*`.

---

## 3. Architecture & Directory Structure

The project follows a **Feature-Driven Layered Architecture**. Do **not** bloat the Next.js `app/` folder with domain logic; route pages should act as thin composable controllers.

```text
src/
├── app/                        # App Router: thin pages, one URL per screen
│   ├── (app)/                  # Signed-in screens; layout = AuthGuard + AppShell
│   │   └── dashboard/ orders/ watchlist/ analytics/ vault/ settings/   # one page.tsx each
│   ├── (public)/               # Open to everyone; layout = AppShell
│   │   ├── markets/page.tsx    # MarketSearch, ?q= prefills the search
│   │   ├── markets/[orderbookId]/page.tsx  # InstrumentPage
│   │   └── help/page.tsx
│   ├── login/page.tsx          # Outside both groups; honours ?next via safeNextPath
│   ├── globals.css             # Tailwind v4 imports and theme variables
│   ├── layout.tsx              # Root HTML layout, Geist fonts, title template '%s · TradeEdu', Providers
│   ├── not-found.tsx           # "Page not found" with a link back to /dashboard
│   ├── page.tsx                # Redirects '/' to /dashboard
│   └── providers.tsx           # Runs checkAuth once, mounts ToastContainer
├── components/                 # Domain-agnostic, reusable UI elements
│   ├── layouts/                # AppShell.tsx (sidebar + mobile drawer), Sidebar.tsx, navigation.ts (NAV_ITEMS, isNavItemActive)
│   └── ui/                     # Shared UI components (CookieBanner.tsx, ToastContainer.tsx)
├── features/                   # Domain-specific feature modules
│   ├── analytics/              # Performance metrics & asset allocation (NW-10): types.ts (mirrors api/openapi.yaml),
│   │                           #   api/analytics.ts (getPortfolioAnalytics, getEquityHistory), format.ts, Analytics,
│   │                           #   MetricCard, AllocationChart, EquityChart, RangeSelector
│   ├── auth/                   # Login, guest demo, AuthGuard, safeNextPath
│   ├── help/                   # Support center & knowledge base
│   ├── markets/                # Market data: api/market.ts, types.ts (mirror backend api/openapi.yaml), candles.ts,
│   │                           #   MarketSearch, InstrumentPage, PriceChart, SimulatedBadge
│   ├── orders/                 # Order history: types.ts (OrderPage, mirrors backend api/openapi.yaml), api/orders.ts
│   │                           #   (listOrders → GET /orders), format.ts, Orders (table "Order history", Load more)
│   ├── portfolio/              # GET /portfolio: types.ts (Portfolio, PortfolioPosition), api/portfolio.ts (getPortfolio),
│   │                           #   selectors.ts (costBasis, pnlTone, …), Dashboard widgets (KPICards, EquityChart,
│   │                           #   HoldingsTable, TopMovers)
│   ├── settings/               # Profile & GDPR Right to Erasure
│   ├── trading/                # Order execution: types.ts (mirrors backend api/openapi.yaml), preview.ts (previewOrder,
│   │                           #   mirrors backend pricing), api/orders.ts (placeOrder, newIdempotencyKey), OrderTicket
│   ├── vault/                  # The Vault risk-free APY simulator
│   └── watchlist/              # Watchlists (NW-06): types.ts (mirrors backend api/openapi.yaml), api/watchlists.ts,
│                               #   store/useWatchlistStore.ts, watchlist.ts helpers, Watchlist page, AddToWatchlistMenu
├── lib/                        # Shared utilities and network clients
│   ├── api.ts                  # Centralized fetch client (routes to /api/v1/), rejects with ApiRequestError {status, code};
│   │                           #   typed apiGet/apiPost/apiPut/apiPatch/apiDelete over the generated contract
│   ├── api/schema.d.ts         # GENERATED from api/openapi.yaml by `npm run api:gen` (never edit by hand)
│   ├── format.ts               # formatMoney ('100,000.00 SEK'), formatPercent ('+1.25%')
│   └── routes.ts               # ROUTES and URL helpers (marketsSearchHref, instrumentHref, loginHref)
└── store/                      # Cross-feature Zustand stores
    ├── usePortfolioStore.ts    # portfolio / portfolioStatus / fetchPortfolio (GET /api/v1/portfolio); watchlists: src/features/watchlist/store
    └── useUIStore.ts           # Auth session, toast notifications, cookie banner
```

## 4. System Behavior & Data Flow

1. **Routing Pattern:**
   - Every screen has its own URL; navigation is plain `next/link` / `router.push`, so the back button and deep links work. Build paths with `src/lib/routes.ts`, never hard-code them.
   - `src/app/(app)/` holds the signed-in screens (`/dashboard`, `/orders`, `/watchlist`, `/analytics`, `/vault`, `/settings`). Its layout wraps them in the client `AuthGuard`, which shows a splash during the session check and redirects signed-out visitors to `/login?next=<current URL>`.
   - `src/app/(public)/` holds `/markets` (`?q=` prefills the search), `/markets/[orderbookId]` (instrument page) and `/help`. Both groups render inside `AppShell` (sidebar from `md`, "Open navigation" drawer below it).
   - `/login` lives outside both groups and, once signed in, goes to `safeNextPath(next)` (same-origin paths only, else `/dashboard`). `/` redirects to `/dashboard`; unknown URLs render `not-found.tsx`.
   - Each `page.tsx` exports `metadata.title`; the root template renders it as `<Page> · TradeEdu`.
2. **Authentication Flow:**
   - On initial load, `Providers` calls `useUIStore.checkAuth()` once, which requests `/api/v1/user/profile`.
   - If unauthenticated on an `(app)` route, `AuthGuard` sends the visitor to `/login`, which offers a direct Google OAuth link to `/api/v1/auth/login` and the guest demo.
   - On 401/403 responses, `src/lib/api.ts` dispatches a window event `'auth-error'` to prompt re-authentication.
3. **API Contract (story NW-07):**
   - The backend's `api/openapi.yaml` is the source of truth. This repo vendors it at `api/openapi.yaml` (`npm run api:sync`) and generates `src/lib/api/schema.d.ts` from it (`npm run api:gen`, openapi-typescript); CI runs `npm run api:check`.
   - Feature `types.ts` files re-export generated schema types (`Schemas['Order']`, …) under stable names; API modules call the typed helpers in `src/lib/api.ts`, so a renamed path, a missing parameter or a wrong body fails `tsc`.
   - The interactive reference is the backend's `/api/docs`, also reachable through this app (rewrite in `next.config.ts`).
4. **Data Integration:**
   - `usePortfolioStore.fetchPortfolio()` (called by `Dashboard` when signed in) loads `GET /api/v1/portfolio` into `portfolio` (cash, total equity, unrealized/realized P&L, `positions` largest first, `top_movers`) and tracks `portfolioStatus` (`idle | loading | ready | error`; a failure keeps the last portfolio). `KPICards`, `HoldingsTable` and `TopMovers` only read the store.
   - `Orders` (`/orders`) pages through `GET /api/v1/orders?limit=20&cursor=…` with `listOrders()`, following `next_cursor` on "Load more".
   - `OrderTicket` (on `InstrumentPage`) polls `/api/v1/market/instruments/{id}/quote` every 5 s, previews price, commission and total with `previewOrder()`, and submits through `placeOrder()`: `POST /api/v1/orders` with a fresh `Idempotency-Key` header per submit (a retry with the same key replays the original order). On success it calls `useUIStore.checkAuth()` so the profile balance (`Cash available`) updates; errors arrive as `ApiRequestError` and are mapped by `code`.
   - Live Market Data (story NW-09): `GET /api/v1/market/stream?ids=...` provides live quotes over Server-Sent Events. `quoteConnection.ts` aggregates active subscriptions into a single shared `EventSource` connection with exponential backoff. Updates populate `useLiveQuoteStore`, flashing updated values in `Watchlist`, `HoldingsTable`, `InstrumentPage`, and `OrderTicket` (`FlashValue` and `LiveIndicator`).
   - Market data goes through `src/features/markets/api/market.ts`; the backend serves either Avanza or the deterministic simulated market, selected by `MARKET_DATA_PROVIDER`.
   - `MarketSearch` searches `/api/v1/market/instruments?q=...`.
   - Watchlists go through `src/features/watchlist/api/watchlists.ts` (`/api/v1/watchlists…`) into `useWatchlistStore`; the backend prices every item from the live quote. The `/watchlist` page and `AddToWatchlistMenu` read that store.
   - `InstrumentPage` loads `/api/v1/market/instruments/{id}` (details + key indicators) and `/api/v1/market/instruments/{id}/quote`.
   - `PriceChart` (used by `InstrumentPage`) fetches `/api/v1/market/instruments/{id}/candles?period=1d|1w|1m|3m|1y`. `EquityChart` on `/dashboard` fetches `/api/v1/portfolio/history?range=1d|1w|1m|all`.

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

