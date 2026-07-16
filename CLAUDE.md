# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Valores — a single-page React app for tracking income/expense entries ("entradas"/"saídas"), pasted as free text and parsed into cards with a chart. Data is synced per-user via Firebase (Auth + Firestore) with a localStorage cache for instant load. Portuguese-language UI; code/identifiers mix Portuguese domain terms (valor, saída, entrada, coleção) with English.

## Commands

```bash
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # tsc -b && vite build — type-checks via project references, then bundles to dist/
npm run lint      # eslint .
npm run preview   # preview the production build locally
npm run deploy    # build + firebase deploy --only hosting
```

There is no test suite/framework configured in this repo.

Local dev requires a `.env` file (copy `.env.example`) populated with `VITE_FIREBASE_*` values for the Firebase project. In CI (`.github/workflows/`), these are injected from GitHub Actions secrets and deploy runs automatically on push to `main` via `FirebaseExtended/action-hosting-deploy`.

## Architecture

**Data flow is hook-driven, not a global store.** `App.tsx` composes three hooks and holds all UI state itself:
- `useAuth` (`src/hooks/useAuth.ts`) — wraps Firebase Auth (Google popup sign-in), exposes `user`.
- `useValoresData` (`src/hooks/useValoresData.ts`) — the *currently active* dataset (`textSaida`, `textEntrada`, `doneKeys`). Reads localStorage synchronously first (avoids blank screen), then reconciles with Firestore doc `users/{uid}/data/valores`. `save()` writes to both localStorage and Firestore.
- `useColecoes` (`src/hooks/useColecoes.ts`) — saved snapshots ("coleções") of a dataset, live-synced via Firestore `onSnapshot` on `users/{uid}/colecoes`. On first load, `App.tsx` auto-loads the most recent coleção as the active dataset.

**Raw text is the source of truth, not structured line items.** Users type/paste one entry per line as `"<valor> <descrição>"` (e.g. `1500 aluguel`). `App.tsx`'s `parseValores()` regex-parses this into `Valor[]` on every render of `data` (see the `useEffect` watching `[data]`). Editing always goes back through the raw `textSaida`/`textEntrada` strings via `ValoresInput`, not by mutating individual `Valor` objects. "Done" state is tracked separately as a `doneKeys` string array (`"${type}:${description}:${value}"`) since parsed `Valor`s get regenerated (and re-colored) from text each time.

**Firestore layout** (see `firestore.rules` — all reads/writes scoped to `request.auth.uid == uid`):
```
users/{uid}/data/valores       — active dataset (textSaida, textEntrada, doneKeys)
users/{uid}/colecoes/{id}      — saved named snapshots (name, textSaida, textEntrada, doneKeys, savedAt)
```

**Sharing** (`src/utils/shareImage.ts`, `ShareMenu.tsx`): renders a summary card to an off-screen `<canvas>` and exports it as a PNG blob, or builds a plain-text summary — both use `navigator.share` when available (mobile), falling back to file download / clipboard copy on desktop.

**Component structure** is flat (`src/components/`, no nesting): `LoginScreen`, `ValoresInput` (the add/edit modal, textarea-based), `ValorCard`, `ValoresChart`, `ShareMenu`, `ColecoesMenu`. Each component has a co-located `.css` file (plain CSS, no CSS-in-JS/modules).
