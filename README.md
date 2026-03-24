# LLM Nonsense

A local-first AI character chat app built with Next.js. Create characters, define personas, craft stories, and chat with AI using configurable LLM backends.

## Features

- **Characters** — Create and manage AI characters. Supports importing character cards from PNG files (V2 spec).
- **Personas** — Define user personas that shape how the AI responds to you.
- **Stories** — Set up story contexts that characters chat within.
- **Chat** — Streaming chat interface powered by the AI SDK with markdown and code block rendering.

## Obsidian Lorebooks - Writing Lorebook Notes

Tag any Obsidian note with `#lorebook` (configurable) and add a `keys` field in the YAML frontmatter:

```markdown
---
tags:
  - lorebook
keys:
  - Eris
  - goddess of discord
priority: 10
---

# Eris

Eris is the goddess of discord and strife. She carries a golden apple
inscribed "To the Fairest" which she uses to sow chaos among mortals
and gods alike.
```

### Frontmatter Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tags` | array | (required) | Must include your lorebook tag (default: `lorebook`) |
| `keys` | array | `[]` | Keywords that trigger this entry when found in chat |
| `priority` | number | `100` | Sort order (lower = injected first) |
| `constant` | boolean | `false` | Always inject regardless of keywords |
| `enabled` | boolean | `true` | Set to `false` to skip this note |
| `scanDepth` | number | (global) | Override the global scan depth for this entry |
| `excludeRecursion` | boolean | `false` | Don't scan this entry's content during recursive matching |
| `requires` | array | `[]` | Entry titles that must ALL be matched for this entry to activate |
| `excludes` | array | `[]` | Entry titles that, if ANY are matched, block this entry |
| `position` | string | (global) | Injection position override: `before`, `after`, or `in_chat` |
| `depth` | number | (global) | Injection depth override (for `in_chat` position) |
| `role` | string | (global) | Message role override: `system`, `user`, or `assistant` |
| `cooldown` | number | (none) | After triggering, skip this entry for N generations |
| `warmup` | number | (none) | Require keyword to appear N times before triggering (must be >1) |

### Special Tags

- **`#lorebook`** -- Marks a note as a lorebook entry (configurable in settings)
- **`#lorebook-always`** -- Forces the note to always be injected, like `constant: true`
- **`#lorebook-never`** -- Prevents the note from ever being injected, even if keywords match

## Tech Stack

- [Next.js 16](https://nextjs.org) — App router, API routes
- [AI SDK](https://sdk.vercel.ai) — Streaming LLM integration (DeepSeek, OpenRouter)
- [Drizzle ORM](https://orm.drizzle.team) + SQLite (`better-sqlite3`) — Local database
- [shadcn/ui](https://ui.shadcn.com) + [prompt-kit](https://prompt-kit.com) — UI components
- [TanStack Query](https://tanstack.com/query) — Data fetching and caching
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) — Forms and validation

## Getting Started

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and set your API keys.

```bash
pnpm db-generate
pnpm db-migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
