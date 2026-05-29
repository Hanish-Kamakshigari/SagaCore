# SAGACORE MythOS Developer Guide

This file outlines the commands and guidelines for building and testing the SAGACORE MythOS platform.

## Development & Build Commands

- **Run Dev Server**: `npm run dev`
- **Type Checking**: `npx tsc --noEmit`
- **Lint Check**: `npm run lint` (or `npx eslint .`)
- **Build Production**: `npm run build`

## Architecture Guidelines

- **AI Engine**: All calls to the AI core are server-side in `app/lib/ai.ts` using Next.js Server Actions. Do not invoke external APIs directly from client components.
- **Model Standard**: Defaults to `llama-3.3-70b-versatile` running natively in Groq JSON mode (`response_format: { type: "json_object" }`).
- **Memory Engine**: MCP MongoDB integration coordinates persistent storage of player sheets, codex logs, and custom-forged worlds.
