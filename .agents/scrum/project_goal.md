# TradeEdu: Next-Generation Virtual Stock Simulator

## Product Summary

**Vision:** To build an institutional-grade, risk-free virtual trading platform that genuinely prepares retail investors for real-world markets[cite: 1]. Unlike competitor platforms that promote reckless gamification and infinite leverage, our product forces users to grapple with real market friction, capital preservation, and opportunity cost[cite: 1].

**Core Value Proposition:**
The platform offers a tiered experience catering strictly to public explorers and registered traders, removing the administrative tier for this PoC phase[cite: 1]. It leverages a frontend Next.js stack with Zustand, Shadcn, and Tailwind, alongside TradingView Lightweight Charts for high-performance market exploration[cite: 1]. The backend is a Go service utilizing Gin and GORM to directly proxy real-time data from the Avanza API. Registered users receive $100,000 in virtual capital and must navigate realistic market conditions—including execution delays, volume-based slippage, and dynamic bid-ask spreads[cite: 1]. A unique "Vault" feature simulates a risk-free yield rate, teaching the crucial concept of opportunity cost[cite: 1].

**Compliance & Architecture:**
Targeting the Swedish market, the platform is uncompromisingly compliant with GDPR and IMY guidelines[cite: 1]. It features strict, dark-pattern-free UI, data minimization via Google Sign-In, and an automated "Right to Erasure" protocol[cite: 1]. The backend architecture operates as a direct pass-through proxy to Avanza without caching, using standard HTTP clients to serve frontend requests. The system will be instrumented with OpenTelemetry for distributed tracing and telemetry[cite: 1], ensuring high observability when deployed to scalable container environments like Cloud Run.

## User Stories by Epic

### Epic 1: Regulatory Compliance & Foundation (Privacy by Design)
* **US 1.1:** As an unauthenticated user, I want to see a neutral, evenly-weighted cookie consent banner that defaults to "off" for non-essential trackers, so that my privacy preferences are respected without manipulation[cite: 1].
* **US 1.2:** As a registered user, I want to easily find an "Account Deletion" button in my settings, so that I can exercise my GDPR Right to Erasure and permanently purge my personal data[cite: 1].

### Epic 2: Tier 1 - Public Explorer (Acquisition Funnel)
* **US 2.1:** As a public user, I want to search for specific equities using a fuzzy-matching search bar (ticker or corporate name), so that I can easily find companies I am interested in[cite: 1].
* **US 2.2:** As a public user, I want to view an equity's fundamental data (P/E ratio, dividend yield, market cap), so that I can evaluate its financial health[cite: 1].
* **US 2.3:** As a public user, I want to interact with a high-performance, 60fps candlestick chart (Lightweight Charts), so that I can smoothly analyze historical daily market data without my browser lagging[cite: 1].

### Epic 3: Tier 2 - Authentication & Virtual Portfolio (The Core Loop)
* **US 3.1:** As a new user, I want to sign up securely using Google Sign-In (minimum scopes only), so that I can create an account quickly without sharing unnecessary personal data[cite: 1].
* **US 3.2:** As a newly authenticated user, I want my account to be automatically provisioned with $100,000 in virtual currency, so that I can begin trading with a realistic retail constraint[cite: 1].
* **US 3.3:** As a registered user, I want to create and manage custom watchlists with visual sparklines, so that I can monitor my favorite stocks[cite: 1].
* **US 3.4:** As a registered user, I want to view my portfolio dashboard (total value, active positions, average cost, unrealized/realized P&L), so I can track my overall performance[cite: 1].
* **US 3.5:** As a registered user, I want to execute Market, Limit, and Stop-Loss orders, so that I can manage my trades with realistic parameters[cite: 1].

### Epic 4: Educational Gamification & Market Friction
* **US 4.1:** As a registered user, I want to move uninvested cash into a "Vault" that generates a simulated APY, so that I can earn a risk-free rate of return and understand opportunity cost[cite: 1].
* **US 4.2:** As a registered user, I want to see my ranking on a leaderboard based on my Sharpe Ratio and Maximum Drawdown, so that I am rewarded for risk-managed consistency rather than reckless gambling[cite: 1].
* **US 4.3:** As a trader, I want my market orders to experience a randomized 50-500ms execution delay and volume-based slippage, so that I learn how liquidity constraints affect trade fills[cite: 1].

### Epic 5: System Architecture & Data Proxy
* **US 5.1:** As a developer, I want the Go backend to efficiently construct HTTP requests to the Avanza API (e.g., `/_api/search/filtered-search`, `/_api/stock-guide/{id}/details`), proxying the JSON responses directly to the frontend without a caching layer.
* **US 5.2:** As a system architect, I want to integrate OpenTelemetry for backend distributed tracing and Sentry for frontend Core Web Vitals/error tracking, so that I can rapidly debug latency and UI crashes[cite: 1].

## Sprint Plan (2-Week Sprints)

| Sprint | Goal | Frontend (Next.js / Zustand / Shadcn) | Backend (Go / Gin / PostgreSQL) |
| :--- | :--- | :--- | :--- |
| **Sprint 1: Architecture & Market Discovery** | Establish the foundational architecture, ensure strict legal compliance from Day 1, and deliver the unauthenticated Tier 1 experience[cite: 1]. | Initialize Next.js app, configure Tailwind CSS, Zustand, and implement the strict UI Cookie Banner[cite: 1]. Build the global market search engine and integrate TradingView Lightweight Charts[cite: 1]. | Set up Go module, Gin router, and implement the `Avanza HTTP Client` logic for search, quote, and chart data proxying. Configure OpenTelemetry for route tracing. |
| **Sprint 2: Authentication & Provisioning** | Convert public users into registered users, handle data sovereignty, and build the pre-trade experience[cite: 1]. | Implement Google Sign-In via NextAuth, build the custom Watchlist UI with optimistic updates, and construct the "Right to Erasure" interface[cite: 1]. | Set up PostgreSQL schemas using GORM for Users, Portfolios, and Transactions[cite: 1]. Implement account onboarding logic to provision $100,000[cite: 1] and automated database cascade deletion for user erasure[cite: 1]. |
| **Sprint 3: The Trading Engine & Dashboard** | Deliver the core functionality of buying, selling, and tracking virtual equities[cite: 1]. | Build the Order Ticket UI (Market, Limit, Stop-loss toggles) and the Portfolio Command Center[cite: 1]. Ensure instant UI feedback using Zustand for transient states[cite: 1]. | Develop the underlying matching/execution engine (standard fills) and API endpoints for placing orders[cite: 1]. Create endpoints for aggregating account value, active positions, cost basis, and P&L[cite: 1]. |
| **Sprint 4: Market Realism & The Vault** | Elevate the platform from a basic game to an educational simulator by introducing friction and opportunity cost[cite: 1]. | Build the "Vault" UI and ensure messaging uses neutral, educational language[cite: 1]. Implement Sentry to monitor Core Web Vitals (LCP, INP, CLS) and capture exceptions[cite: 1]. | Implement the friction algorithm (50-500ms latency, volume-based slippage)[cite: 1]. Build the backend logic to apply simulated APY to Vault cash, and develop the mathematical engine for the Risk-Adjusted Leaderboards (Sharpe Ratio)[cite: 1]. |