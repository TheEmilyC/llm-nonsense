# LLM Nonsense

> **Work in progress.** Expect rough edges, missing features, and breaking changes.

A local-first AI character chat app built with Next.js. Create characters, define personas, craft stories, and chat with AI using configurable LLM backends.

## Obsidian Lorebooks

Tag any Obsidian note with `#lorebook` to make it available as a lorebook entry. The AI can retrieve entries during chat via tool calls — entries are fetched on demand rather than injected by keyword matching.

```markdown
---
title: Eris
tags:
  - lorebook
summary: Goddess of discord and strife; carries the golden apple.
constant: false
---

Eris is the goddess of discord and strife. She carries a golden apple
inscribed "To the Fairest" which she uses to sow chaos among mortals
and gods alike.
```

### Frontmatter Fields

| Field      | Type    | Default    | Description                                            |
| ---------- | ------- | ---------- | ------------------------------------------------------ |
| `title`    | string  | (filename) | Display name for the entry                             |
| `tags`     | array   | (required) | Must include your lorebook tag (default: `#lorebook`)  |
| `summary`  | string  | `""`       | Short description shown to the AI when listing entries |
| `constant` | boolean | `false`    | Always include this entry in every request             |

### Special Tags

- **`#lorebook`** — Marks a note as a lorebook entry (configurable via `LOREBOOK_TAG`)
- **`#lorebook-always`** — Forces the note to always be included, like `constant: true`
- **`#lorebook-never`** — Prevents the note from ever being included

## Tech Stack

- [Next.js 16](https://nextjs.org) — App router, API routes
- [AI SDK](https://sdk.vercel.ai) — Streaming LLM integration
- [Prisma](https://www.prisma.io) + SQLite (`better-sqlite3`) — Local database
- [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) — UI components
- [Tailwind CSS v4](https://tailwindcss.com) — Styling
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) — Forms and validation

## Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

At minimum you'll need an API key for at least one LLM provider (`OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, or `ANTHROPIC_API_KEY`). The Obsidian fields are optional.

On first download and after each update run:

```bash
docker compose up --build
```

It will take some time to build then start. The container starts on the host network so it can see the obsidian API server without changing the binding address.
in the future start with:

```bash
docker compose up
```

Open [http://localhost:3010](http://localhost:3010).
