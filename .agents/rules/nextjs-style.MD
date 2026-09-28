# typescript_react_style_guide.md

# TypeScript & React Code Style Guidelines

To ensure type safety, predictability, and maintainability across the Next.js application, the engineering team must adhere to these strict TypeScript and React conventions.

### 1. Strict Typing & Type Definitions
*   **Avoid `any` strictly:** Never use `any`. Use `unknown` if the shape of data is genuinely untyped at runtime, and narrow it using type guards or Zod validation schemas before usage.
*   **Interfaces over Types:** Use `interface` for object definitions and component props to allow for declaration merging and better error messages. Use `type` only for unions, intersections, or primitives.
*   **Explicit Return Types:** All utility functions, API calls, and custom hooks must declare explicit return types to prevent unintended inference mutations.

### 2. React Component Patterns
*   **Component Declarations:** Define components as standard named functions (not arrow functions assigned to `const`) to improve stack trace readability. Do not use `React.FC`.
    ```tsx
    interface TradeTicketProps {
      stockId: string;
      currentPrice: number;
    }

    export function TradeTicket({ stockId, currentPrice }: TradeTicketProps) {
      // implementation
    }
    ```
*   **Export Strategy:** Use **named exports** for all components, hooks, and utilities to ensure consistent naming across the codebase during imports. Use **default exports** *only* for Next.js `page.tsx` and `layout.tsx` files as required by the framework.

### 3. State Management (Zustand & Server State)
*   **Separate Server and Client State:** Use TanStack Query (React Query) for asynchronous server data (fetching stock quotes, portfolio data). Reserve Zustand strictly for synchronous client-side UI state (e.g., active modal, multi-step form progress, optimistic updates).
*   **Zustand Slices:** For complex global stores, implement the "slice pattern" to keep state files manageable rather than creating one massive monolithic store.

### 4. Nullability and Error Handling
*   **Optional Chaining & Nullish Coalescing:** Prefer `?.` and `??` over verbose logical AND (`&&`) checks when rendering UI to avoid accidental "0" rendering on the screen.
*   **Domain Error Mapping:** Wrap all API calls in try-catch blocks and map them to explicit UI error states. Utilize Sentry boundary wrappers for unhandled exceptions.