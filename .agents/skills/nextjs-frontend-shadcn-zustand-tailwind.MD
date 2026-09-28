# frontend_architecture.md

# Frontend Layered Architecture & Folder Structure

This architecture leverages a feature-driven design pattern tailored for the Next.js App Router. By segregating domain logic into a `features/` directory, we prevent the Next.js `app/` router from becoming bloated with business logic, ensuring components remain modular, testable, and strictly typed.

```text
src/
├── app/                        # Next.js App Router (strictly for routing & page composition)
│   ├── (auth)/                 # Route groups for shared layouts
│   │   └── login/page.tsx
│   ├── api/                    # Next.js API Routes (BFF - Backend for Frontend if needed)
│   ├── portfolio/page.tsx
│   ├── layout.tsx
│   └── globals.css             # Tailwind base imports
├── components/                 # Global, domain-agnostic UI components
│   ├── ui/                     # Shadcn UI components (buttons, dialogs, inputs)
│   └── layouts/                # Global layout wrappers (Navigation, Footer)
├── features/                   # Domain-driven feature modules (The core logic)
│   ├── market/                 # Market discovery domain
│   │   ├── components/         # Feature-specific UI (e.g., CandlestickChart.tsx)
│   │   ├── store/              # Local Zustand slices for market state
│   │   ├── api/                # TanStack Query hooks fetching from Go backend
│   │   └── types.ts            # Domain-specific TypeScript models
│   ├── portfolio/              # Portfolio & Trading domain
│   └── vault/                  # Educational APY domain
├── hooks/                      # Global React hooks (e.g., useDebounce, useMediaQuery)
├── lib/                        # Utility functions and third-party wrappers
│   ├── utils.ts                # Shadcn tailwind-merge utilities
│   ├── formatters.ts           # Currency and percentage formatters
│   └── avanza-client.ts        # Base Axios/Fetch instance for the proxy backend
├── store/                      # Global Zustand stores (cross-feature state)
│   ├── useAuthStore.ts         # Authentication state (synchronized with NextAuth)
│   └── useUIStore.ts           # Global UI states (modals, theme)
└── types/                      # Global TypeScript definitions (Generic API responses)