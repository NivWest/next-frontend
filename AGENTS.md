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
- **Current Status:** API types are generated from the backend's OpenAPI contract and every API call is checked against it (story NW-07). Signed-in users keep up to 10 named watchlists with live prices, filled from the instrument page (story NW-06), see their order history on `/orders` and a live portfolio (KPI cards, holdings, top movers, largest-holding chart) on `/dashboard` (story NW-05), and place market orders from the instrument page's order ticket (story NW-04). Market data comes from the backend's provider-neutral `/api/v1/market/*` API, served by Avanza or the deterministic simulated market (story NW-03). Every screen has its own URL (story NW-02), on top of Google sign-in plus a guest demo login (story NW-01). Vitest + Testing Library unit tests run with `npm test`.
- **Recent Updates:**
  - Contract-first API (NW-07):
    - `api/openapi.yaml` is a vendored copy of backend `api/openapi.yaml`; `src/lib/api/schema.d.ts` is GENERATED from it. Never edit either by hand: `npm run api:sync` (copies from `$BACKEND_DIR` or `../backend`), then `npm run api:gen`. `npm run api:check` (CI) fails when `schema.d.ts` is stale and warns when the vendored copy differs from a backend checkout next to this repo. Tooling: `scripts/api-contract.mjs` (openapi-typescript 7).
    - Feature `types.ts` files re-export the generated schemas under their old names and import paths (`Order`, `Portfolio`, `Watchlist`, `Quote`, `UserProfile`, …); only frontend-only types (`OrderPreview`, `ListOrdersParams`) and UI constants are hand-written. `ORDER_ERROR_CODES` / `WATCHLIST_ERROR_CODES` are `satisfies readonly ErrorCode[]`, so a code the contract doesn't have fails to compile.
    - `src/lib/api.ts` adds `apiGet` / `apiPost` / `apiPut` / `apiPatch` / `apiDelete(path, { path, query, headers, body })` over the contract paths (e.g. `apiGet('/watchlists/{id}', { path: { id } })`), plus `Schemas`, `ErrorCode`, `buildApiUrl`. Paths, parameters and bodies are type-checked and the 2xx body type is inferred. They call `api()`, so `ApiRequestError` and the `auth-error` event are unchanged; GET sends no `method`. All feature API modules and `useUIStore` use them; use them for new calls instead of `api<T>()`.
    - `next.config.ts` also rewrites `/api/docs` to the backend's interactive API reference.
  - Watchlists (NW-06): the feature lives in `src/features/watchlist`.
    - `types.ts` mirrors backend `api/openapi.yaml` (`Watchlist`, `WatchlistItem` keyed by `orderbook_id` with nullable `last_price`/`change_percent`, `WatchlistListResponse`, `WatchlistErrorCode`, `MAX_WATCHLISTS` = 10, `MAX_WATCHLIST_NAME_LENGTH` = 50); don't redefine them.
    - `api/watchlists.ts`: `listWatchlists`, `getWatchlist`, `createWatchlist`, `renameWatchlist`, `deleteWatchlist`, `addWatchlistItem`, `removeWatchlistItem`.
    - `store/useWatchlistStore.ts` (Zustand) owns the lists (`watchlists`, `status`); mutations update in place and reject with `ApiRequestError`. It resets itself when `useUIStore.user` changes. Watchlist state is gone from `usePortfolioStore`.
    - `watchlist.ts`: `validateWatchlistName` (mirrors the backend), `watchlistErrorMessage` (by `code`), `isDuplicateItemError`.
    - `AddToWatchlistMenu` in the `InstrumentPage` header (next to the title): button "Add to watchlist" (`aria-haspopup="menu"`) → `role="menu"` of the lists plus "New list…" (U+2026), which swaps in a "List name" form ("Create and add"). Success toasts `Added NVE to Energy`; a duplicate toasts `NVE is already in Energy`. The popover is `z-[45]`: above `CookieBanner` (z-40), below toasts and the drawer (z-50). Signed out it is a "Sign in to add to watchlist" link.
    - `Watchlist` on `/watchlist`: `role="tablist"` "Watchlists" with one tab per list, a `tabpanel` with a "List actions" menu ("Rename list", "Delete list" with an `alertdialog` confirm), rows linking to the instrument with price and day change (`—` without a quote) and a "Remove <name>" button; "No watchlists yet" plus "Create a list" when there are none. `WatchlistNameForm` is shared by create and rename.
    - Removed: `getMockData`, the old "Add to Watchlist" button and the watchlist state of `usePortfolioStore` (`watchlist`, `watchlistId`, `fetchWatchlists`, `addToWatchlist`, `removeFromWatchlist`); `fetchPortfolio()` no longer loads watchlists. The dashboard's `TopMovers` shows portfolio movers (NW-05), not watchlist items.
  - Order history and portfolio (NW-05):
    - Orders page (`src/features/orders`): `types.ts` (`OrderPage`, `ListOrdersParams`; `Order` re-exported from `src/features/trading/types.ts`, mirrors backend `api/openapi.yaml`), `api/orders.ts` `listOrders({limit, cursor})` → `GET /api/v1/orders`, `format.ts` (`sideLabel`, `statusLabel`, `formatQuantity`, `formatOrderTime`). `Orders.tsx` on `/orders` renders the table "Order history" (Instrument, Side, Qty, Price, Commission, Total, Status, Time), 20 per page with a "Load more" button following `next_cursor`, and "No orders yet" when empty.
    - Portfolio data: `src/features/portfolio/types.ts` (`Portfolio`, `PortfolioPosition`) mirrors backend `GET /api/v1/portfolio`; `api/portfolio.ts` `getPortfolio()`. `usePortfolioStore` holds `portfolio: Portfolio | null`, `portfolioStatus: 'idle' | 'loading' | 'ready' | 'error'` and `fetchPortfolio()` (a failure keeps the last portfolio), replacing `/portfolio/dashboard`. Pure helpers in `selectors.ts`: `largestHolding`, `costBasis`, `unrealizedPnlPercent`, `pnlTone`, `formatSignedMoney`.
    - Dashboard widgets read the store, never fetch on their own (except `EquityChart`'s equity history): `KPICards` (groups Total equity, Cash, Unrealized P&L, Realized P&L; `—` until loaded), `HoldingsTable` (table "Holdings", instrument names link to `instrumentHref(orderbook_id)`, "No positions yet" when empty — E2E selects that exact text, so no other widget may use it), `TopMovers` (`portfolio.top_movers`, list "Top movers" with links, last price and coloured day change; "Movers appear once you hold positions." when empty). Before the first load `HoldingsTable` and `TopMovers` show `role="status"`, after a failed one `role="alert"`.
    - `EquityChart` (NW-10) replaces the single-instrument `AssetChart` on `/dashboard`: range buttons (1D, 1W, 1M, All) triggering `GET /api/v1/portfolio/history?range=...`, with pure SVG area chart, current equity summary and change tone.
  - Risk-adjusted leaderboard (NW-13): `src/features/leaderboard`.
    - Types: `types.ts` (`LeaderboardEntry`, `LeaderboardPage`, `LeaderboardMetric`, `UpdateProfileRequest`), mirrors backend `api/openapi.yaml`.
    - API: `api/leaderboard.ts` (`getLeaderboard`, `updateProfile`).
    - `/leaderboard` page (`Leaderboard.tsx`): tabs ("Risk-adjusted (Sharpe)" and "Total return"), explainer banner, "Join the leaderboard" form with explicit unchecked-by-default consent checkbox, and "You" badge highlight on the signed-in user's row.
  - Risk analytics and portfolio history (NW-10): `src/features/analytics`.
    - Types: `types.ts` (`PortfolioAnalytics`, `EquityPoint`, `AllocationSlice`, `EquityHistory`, `HistoryRange`), mirrors backend `api/openapi.yaml`.
    - API: `api/analytics.ts` (`getPortfolioAnalytics`, `getEquityHistory`).
    - `/analytics` page: metric cards (Total return, Volatility, Sharpe ratio, Max drawdown) with educational tooltips, an insufficient-data banner ("Not enough history yet") when daily returns < 5, and the `AllocationChart` donut.
  - Order execution (NW-04): the trading feature lives in `src/features/trading`.
    - `types.ts` mirrors backend `api/openapi.yaml` (`OrderRequest`, `Order`, `OrderSide`, `OrderErrorCode`, `OrderPreview`); don't redefine them.
    - `preview.ts`: `previewOrder({side, quantity, bid, ask})` mirrors the backend pricing (BUY at ask / SELL at bid, 0.5% slippage above 100 shares, commission max(1.00, 0.25%), half-up to 2 decimals) and returns null for invalid input.
    - `api/orders.ts`: `placeOrder(request, idempotencyKey)` → `POST /api/v1/orders` with the `IDEMPOTENCY_KEY_HEADER` (`Idempotency-Key`) header; `newIdempotencyKey()` makes one key per submit.
    - `src/lib/api.ts` rejects with `ApiRequestError` (`message`, `status`, `code` from the `{error, code}` body).
    - `OrderTicket` (`components/OrderTicket.tsx`) sits on `InstrumentPage` between the quote and `PriceChart` (the "Trade Asset" placeholder is gone): region "Order ticket", `role="group"` "Order side" with Buy/Sell (`aria-pressed`), whole-share "Quantity" input, a Price/Commission/Total preview from a quote refreshed every 5 s, "Cash available" (`user.balance`), and a "Buy <SYMBOL>"/"Sell <SYMBOL>" submit (`disabled` + `aria-busy` while pending). A fill toasts `Bought 10 FJRD @ 100.10` and calls `checkAuth()` to refresh the balance; errors map `ApiRequestError.code` to plain text, shown as a toast and inline (`role="alert"`). Signed out, the submit is a "Sign in to trade" link to `loginHref(instrumentHref(id))`.
    - Removed: the mock NVDA order ticket on the dashboard and `usePortfolioStore.executeTrade`.
  - Market data (NW-03): all calls go through `src/features/markets/api/market.ts` (`searchInstruments`, `getQuote`, `getInstrumentDetails`, `getCandles`); shapes live in `src/features/markets/types.ts`, which mirrors backend `api/openapi.yaml`. Don't redefine them.
    - `MarketSearch` on `/markets`: instrument names link to the instrument page, with formatted price and change. The fake Sector/Market Cap selects and the Filters button are gone.
    - `InstrumentPage` on `/markets/[orderbookId]`: quote (last, bid, ask), key indicators (P/E Ratio, Dividend Yield, Market Cap), `PriceChart`, and `SimulatedBadge` ("Simulated market data") for `SIM-` ids (`isSimulatedInstrument`).
    - `PriceChart`: `role="group"` named "Chart period" with buttons 1D 1W 1M 3M 1Y. The `role="img"` "Price chart" element exists only once candles are loaded; loading, empty and error messages (`status`/`alert`) sit outside it. Candle helpers live in `src/features/markets/candles.ts`.
    - Shared formatters in `src/lib/format.ts`: `formatMoney` → `100,000.00 SEK`, `formatPercent` → `+1.25%`.
    - Removed: the `src/features/screener` feature (`Screener`, `StockDetails`, Avanza-shaped types) and the `/api/v1/stocks/*` endpoints.
  - URL routes (NW-02): `(app)` group behind the client `AuthGuard` (`src/features/auth/components/AuthGuard.tsx`, sends signed-out visitors to `/login?next=<current URL>`) → `/dashboard`, `/orders`, `/watchlist`, `/analytics`, `/vault`, `/settings`. `(public)` group → `/markets` (`?q=` prefills the search), `/markets/[orderbookId]` (the instrument page, `InstrumentPage` since NW-03, replaces the old slide-over), `/help`. `/login` sits outside both groups and honours `?next` via `safeNextPath` (`src/features/auth/safe-next.ts`). `/` redirects to `/dashboard`; unknown URLs render `src/app/not-found.tsx`.
  - Root layout title template `'%s · TradeEdu'`; every `page.tsx` exports its own `metadata.title`. `Providers` runs `checkAuth` once per page load and mounts `ToastContainer`.
  - `AppShell` (`src/components/layouts/AppShell.tsx`) wraps both groups: desktop sidebar from `md`, below that a top bar whose "Open navigation" button opens a drawer with the same links. Build links with the helpers in `src/lib/routes.ts` (`ROUTES`, `marketsSearchHref`, `instrumentHref`, `loginHref`); sidebar links come from `NAV_ITEMS` and `isNavItemActive` in `src/components/layouts/navigation.ts` (active link gets `aria-current="page"`). The sidebar search is a form that navigates to `/markets?q=…`.
  - Removed: `activeView`/`setActiveView`/`ViewType` from `useUIStore`, the fake Buy/Sell nav entries, the date/Export header buttons and the Online badge.
  - Guest demo login: `src/features/auth/components/TryDemoButton.tsx` ("Try the demo", a `<button>`, never a link) calls `useUIStore().loginAsGuest()` (`POST /api/v1/auth/guest`, then `checkAuth`) without leaving the app; shown on the Login screen and in the Sidebar when signed out. Pending state uses `aria-busy` + `disabled`, the accessible name stays the same.
  - Sidebar user block: name plus a "Guest" pill (`title="Guest portfolios are deleted after 24 hours"`) and "Demo account" instead of the synthetic email when `user.is_guest`. Only the separate "Sign out" button logs out.
  - `user` in `useUIStore` is the full `UserProfile` from `src/features/auth/types.ts` (`id, name, email, role, balance, is_guest`).
  - Tests: store auth flow in `src/store/__tests__/useUIStore.test.ts` (mocks `fetch`); component tests for Login and Sidebar drive the store with `useUIStore.setState` and `vi.fn()` actions.
  - Defined initial agent workflow and architectural guidelines.
