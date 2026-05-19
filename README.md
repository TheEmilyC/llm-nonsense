# LLM Nonsense

> **Development paused.** A breaking change to the Obsidian Local REST API removed a feature this app relied on for lorebook retrieval. The app is currently broken and further development is on hold until a workaround or replacement is found.

A local-first AI character chat app built with Next.js. Create characters, define personas, craft stories, and chat with AI using configurable LLM backends.

## Motivation

Most LLM chat frontends inject context by keyword matching — scanning the prompt for known terms and prepending matching lorebook entries. In practice this is noisy: irrelevant entries get included while relevant ones get missed.

After testing tool-call-based retrieval I found the model could decide what context it actually needed, fetching entries on demand rather than guessing upfront. Combined with a focus on collaborative story writing rather than general chat, that became the starting point for this project.

## Obsidian Lorebooks

Requires the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin with **Enable Non-encrypted (HTTP) Server** turned on in its settings.

Tag any Obsidian note with `#lorebook` to make it available as a lorebook entry. The AI can retrieve entries during chat via tool calls — entries are fetched on demand rather than injected by keyword matching.

```markdown
---
title: Eris
tags:
  - lorebook
summary: Goddess of discord and strife; carries the golden apple.
characters:
  - Zeus
  - Hera
order: 10
---

Eris is the goddess of discord and strife. She carries a golden apple
inscribed "To the Fairest" which she uses to sow chaos among mortals
and gods alike.
```

### Frontmatter Fields

| Field        | Type   | Default    | Description                                                         |
| ------------ | ------ | ---------- | ------------------------------------------------------------------- |
| `title`      | string | (filename) | Display name for the entry                                          |
| `tags`       | array  | (required) | Must include your lorebook tag (default: `#lorebook`)               |
| `summary`    | string | `""`       | Short description shown to the AI when listing entries              |
| `characters` | array  | `[]`       | Character names this entry is associated with, shown in lore tables |
| `order`      | number | `50`       | Sort priority; lower numbers appear first                           |

### Special Tags

All tags are configurable via the `.env` file.

- **`#lorebook`** (`LOREBOOK_TAG`) — Marks a note as a lorebook entry
- **`#lorebook-always`** (`LOREBOOK_ALWAYS_TAG`) — Forces the note to always be included in every request
- **`#lorebook-never`** (`LOREBOOK_NEVER_TAG`) — Prevents the note from ever being included

## Architecture

Next.js server actions handle all data mutations and LLM requests, keeping API keys server-side. Prisma with SQLite stores characters, personas, stories, and chat history locally. The AI SDK streams responses from the configured LLM provider. When a lorebook is connected, the AI can make tool calls during chat that fetch Obsidian notes on demand via the Local REST API.

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
