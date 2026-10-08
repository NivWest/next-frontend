# TradeEdu Frontend - Workflow & Implementation Guide

This document outlines the step-by-step workflow, coding standards, and testing procedures for contributing to the TradeEdu frontend repository.

---

## 1. Step-by-Step Feature Implementation Recipe

When implementing a new feature in this repository, follow these precise steps:

1. **Understand the Architecture:** Review `doc/architecture.md` to identify which layer (e.g., feature, global UI component, store) the code belongs to.
2. **Branching Strategy:**
   - Always branch off `dev`.
   - Use conventional branch names (e.g., `feat/...`, `fix/...`, `chore/...`, `refactor/...`).
3. **Module Construction:**
   - For a new feature, create `src/features/<feature-name>/` with subdirectories: `components/`, `store/`, `api/`, and `types.ts`.
   - Ensure the Next.js `app/` folder only contains thin route controllers, not complex UI logic.
4. **Development:** Follow the Coding Standards outlined in Section 2.
5. **Testing & Validation:** Follow the Verification Steps in Section 3.
6. **Commit Strategy:** 
   - Use Conventional Commits (`feat: add something`, `fix: resolve issue`, etc.).
   - Ensure a clean, logical commit history.
7. **Update Agent Context:** Update the `AGENTS.md` file (specifically the "Current State of the Application" section) to reflect the newly implemented feature, architectural changes, or updated requirements.
8. **Pull Request:** Open a PR against `dev` for review.

---

## 2. Coding Standards & Agent Best Practices

### 2.1 Strict TypeScript (Zero `any` Policy)
- **Never use `any`:** Replace all occurrences of `any` with strict interfaces or `unknown` (narrowed with type guards/schemas).
- **Use `interface` for object models & component props:** Allow for declaration merging and clearer IDE errors. Use `type` for unions, primitives, and tuples.
- **Explicit Return Types:** Specify return types on all helper functions, store actions, and API functions.
- **Create Domain Types in `types.ts`:** Define exact models for Avanza stock hits, positions, chart points, and order tickets.

### 2.2 React 19 & Component Patterns
- **Standard Function Declarations:** Define components using `export function ComponentName(props: ComponentProps) {}`. Never use `const Component = () => {}` or `React.FC`.
- **Export Strategy:** Use **named exports** for all components, stores, and utilities. Reserve **default exports** strictly for Next.js route boundaries (`page.tsx`, `layout.tsx`).
- **Hook Purity (React 19 Rule):**
  - **NEVER call `setState` synchronously in the root body of a `useEffect`.**
  - Compute derived values during render or execute state updates inside asynchronous promises / event handlers. Synchronous `setState` in effects triggers React 19 ESLint errors (`react-hooks/set-state-in-effect`) and cascading re-renders.
- **JSX Escaping:** Always escape quotes and apostrophes in JSX text (e.g. use `&apos;`, `&quot;` or curly braces `{"'"}`).

### 2.3 State Management (Zustand & Server State)
- **Client State vs Server State:**
  - Use **Zustand** strictly for synchronous client UI states (active views, modals, toasts, transient form inputs, optimistic toggles).
  - Encapsulate async server requests within typed store actions or data-fetching hooks.
- **Keep Stores Modular:** If a store grows too large, break it down using the slice pattern rather than creating monolithic stores.

### 2.4 Module Layout Rules for Features
When creating or refactoring a feature (`src/features/<feature-name>/`), organize into:
- `components/` — UI components specific to this feature.
- `store/` — Feature-local Zustand slices (if not cross-cutting).
- `api/` — Typed API fetch functions or TanStack Query hooks.
- `types.ts` — Domain-specific models and DTO interfaces.

---

## 3. Testing, Verification & Quality Gates

When completing tasks or submitting changes, you must run the following checks:

1. **Testing Guidelines & Mocking:**
   - Use strict unit test mocks for external services (e.g. Avanza API proxy) to prevent side effects in tests.
   - Do not use database fakes directly in the frontend; mock the API layer (`src/lib/api.ts` responses) instead.
   
2. **Type Checking:**
   ```bash
   npx tsc --noEmit
   ```
   Must pass with **0 errors**.

3. **Linting & React 19 Checks:**
   ```bash
   npm run lint
   ```
   Ensure all ESLint errors (specifically `no-explicit-any`, `react-hooks/set-state-in-effect`, and unescaped entities) are resolved before finishing.

4. **Build Note (Sandbox Environments):**
   - `npm run build` utilizes Turbopack and attempts to download Google Fonts (`next/font/google`) during compilation. In offline or network-isolated sandboxes, font fetching will fail. Rely on `npx tsc --noEmit` and `npm run lint` for isolated code verification.

