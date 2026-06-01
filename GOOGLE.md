# SAGACORE MythOS Developer Guide

This file outlines the commands and guidelines for building and testing the SAGACORE MythOS platform.

## Development & Build Commands

- **Run Dev Server**: `npm run dev`
- **Type Checking**: `npx tsc --noEmit`
- **Lint Check**: `npm run lint` (or `npx eslint .`)
- **Build Production**: `npm run build`

## Architecture Guidelines

- **AI Engine**: All calls to the AI core are server-side in `app/lib/ai.ts` using Next.js Server Actions. Do not invoke external APIs directly from client components.
- **Model Standard**: Defaults to Google Gemini models (e.g., `gemini-2.5-flash` or `gemini-1.5-flash`) running natively via the **Google Gemini API** (`generativelanguage.googleapis.com`) using JSON mode with exponential backoff retries for reliability.
- **Memory Engine**: MCP MongoDB integration coordinates persistent storage of player sheets, codex logs, and custom-forged worlds.
