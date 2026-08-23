# SCOUT React UI Foundation

This is a parallel React/Vite UI layer. The existing `server/atlas.js` is intentionally untouched.

## Why this architecture

assistant-ui provides unstyled primitives for Thread, Composer and Message, so SCOUT can have its own visual treatments while the library handles chat state, scrolling, keyboard behavior and cancellation.

Current package target: `@assistant-ui/react` 0.15.15.

## Install

From this folder:

```bash
npm install
```

## Run

Terminal 1 — existing SCOUT backend:

```bash
cd ~/Desktop/SCOUT
node server/atlas.js
```

Terminal 2 — this React UI:

```bash
cd ~/Desktop/SCOUT/scout-ui
npm run dev
```

Open:

http://localhost:5173

The Vite proxy forwards `/api/*` to `http://localhost:3000`, so the existing Atlas backend remains the source of truth.

## Current treatment

Treatment A — Expandable Glass.

The first message expands the chat panel and lifts the SCOUT hero copy.

## Important

Do not replace the existing `index.html` or `server/atlas.js` yet. This is the new UI layer running alongside the working prototype so we can validate the architecture safely.
