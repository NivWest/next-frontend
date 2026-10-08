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

### Active Goals & Sprints
For the current epic requirements and sprint roadmap, consult:
👉 **`.agents/scrum/project_goal.md`**
