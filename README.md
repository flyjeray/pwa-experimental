# PWA Experimental

An experimental progressive web app (PWA) exploring offline-first data and Supabase-backed persistence.

> **Note:** This project was created as a learning exercise to explore offline capabilities, sync, and conflict resolution patterns. While functional, it is not intended for production use without further hardening.

## Demo access

This project does not currently include a registration flow.

To explore the app:

- use the pre-seeded demo account (provided by request)
- or connect your own Supabase project (see setup)

## 📋 Table of Contents

- [Overview](#overview)
- [Monorepo Architecture](#monorepo-architecture)
- [Offline Sync & Conflict Resolution](#offline-sync--conflict-resolution)
- [Supabase Integration](#supabase-integration)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [Getting Started](#getting-started)

## Overview

This app demonstrates how to build an offline-capable CRUD experience on top of Supabase using React. Users can authenticate, manage a list of items, and continue making changes while offline. Operations are queued locally and applied to the backend once connectivity is restored.

**Key Features:**

- Online/offline detection with UI feedback
- Local operation queue for create/update/delete
- Automatic sync when network and auth are available
- Basic conflict detection and resolution strategies
- Supabase wrapper library for typed access to auth and items
- PWA-ready frontend (service worker + manifest)

## Monorepo Architecture

The project is organized as an npm workspace monorepo with three main packages:

```
pwa-experimental/
├── frontend-react/       # React frontend PWA
├── supabase-wrapper/     # Supabase wrapper library
└── supabase/             # Local Supabase config & migrations
```

### Package Breakdown

#### 1. `frontend-react`

**Purpose:** User-facing React + TypeScript application.

**Structure (high level):**

- `src/containers/`: Page-level building blocks (items table, login/logout forms, system state, offline status)
- `src/hooks/`: Custom hooks for auth, items, online status, and the operation queue
- `src/lib/`: Small utilities (ID shortening, helpers)
- `src/supabase/`: Supabase context and React integration
- `public/`: PWA assets (manifest, service worker)

#### 2. `supabase-wrapper`

**Purpose:** Type-safe abstraction layer on top of `@supabase/supabase-js` for this PWA.

**Provides access to:**

- Auth operations via `PWASupabaseAuth`
- Items data access via `PWASupabaseItemsDB`
- A singleton `PWASupabaseWrapper` that owns the Supabase client, auth, and DB access
- A small `testConnection` helper to verify connectivity

#### 3. `supabase`

**Purpose:** Local Supabase project configuration and SQL migrations.

**Contains:**

- `config.toml` for the local Supabase CLI
- `database.types.ts` generated types (consumed as `pwa-supabase-types`)
- `migrations/` with SQL files defining tables and constraints for the app

## Offline Sync & Conflict Resolution

The core offline behavior is implemented through a client-side operation queue stored in `localStorage` and applied when the app is online and authenticated.

### What Gets Queued

The `useEditOperationQueue` hook exposes three methods used by `useItems`:

- `create(payload)`: Queue a new item creation.
- `update(id, payload)`: Queue an item update.
- `delete(id)`: Queue an item deletion.

Each queued entry is a small JSON object:

- `type`: `"create" | "update" | "delete"`
- `payload` (for create/update): Editable fields of the item
- `id` (for update/delete): Target item ID
- `time`: Millisecond timestamp used to order operations and detect conflicts

The queue is stored under a single `localStorage` key and is read back on every app load. When the auth state changes to "logged out" (except the initial session detection), the queue is cleared to avoid leaking operations across users.

On the UI side, `useItems` performs an optimistic update when offline:

- For **create**, it inserts a temporary item into state with an `offline-<timestamp>` ID and pushes a `create` operation into the queue.
- For **update**, it applies changes to the in-memory item list, then queues an `update` operation with a full editable snapshot.
- For **delete**, it removes the item from local state and queues a `delete` operation.

This means the user always sees their changes immediately, even before the server has confirmed them.

### How the Queue Is Applied

The `useApplyOperationQueue` hook coordinates pushing the queue to Supabase whenever possible. It:

- Watches network connectivity and Supabase wrapper initialization.
- Checks the queue; if there is at least one entry and the app is online, it calls `applyQueue`.
- Makes sure only one processing run is active at a time to avoid race conditions.

`applyQueue` processes operations as follows:

1. Reads the current queue from `localStorage` and sorts it by `time` ascending.
2. Takes the oldest operation and decides how to push it:
   - **Create**
     - Calls the `onAdd` handler to insert a new row in Supabase.
     - On success, shows a success toast and removes the operation from the queue.
   - **Update**
     - Fetches the latest remote item by ID.
     - If the item does **not exist** remotely (deleted elsewhere), it raises a **write-over-deleted** conflict.
     - If the item **exists**, it compares `remote.updated_at` with the queued `time`:
       - If remote is **older** than the queued update, it pushes the update and removes it from the queue.
       - If remote is **newer**, it raises an **overwrite** conflict.
   - **Delete**
     - Fetches the latest remote item by ID.
     - If the item is already gone remotely, it simply drops the local delete from the queue.
     - If the item exists, it compares `remote.updated_at` with the queued `time`:
       - If remote is **not newer**, it pushes the delete.
       - If remote is **newer**, it raises a **delete-updated** conflict.
3. After handling the operation (either pushing or resolving/discarding), it saves the remaining queue back to `localStorage` and moves on to the next entry.

Throughout this process, short toast messages are used to communicate success and failure of remote operations.

### Conflict Types & Resolution Flow

Conflicts are surfaced via a `conflicts` object returned from `useApplyOperationQueue`, which is then wired into dedicated dialogs/tables under `src/components/conflicts/`.

There are three conflict types:

- **Overwrite conflict**
  - Situation: Local update vs newer remote update.
  - Options:
    - **Approve**: Overwrite remote with local version. The helper re-runs the queued update, shows a success toast, removes it from the queue, and continues processing.
    - **Reject**: Keep remote version. The queued update is discarded.

- **Write-over-deleted conflict**
  - Situation: Item was deleted remotely, but a local update exists in the queue.
  - Options:
    - **Approve**: Recreate the item on the server using the queued local payload.
    - **Reject**: Drop the queued update and do nothing remotely.

- **Delete-updated conflict**
  - Situation: A delete is queued, but the remote item has been updated since the delete was queued.
  - Options:
    - **Approve**: Force the delete even though the item was changed elsewhere.
    - **Reject**: Keep the updated remote item and drop the queued delete.

Each conflict handler encapsulates the same pattern: find the queued operation by timestamp, perform or drop it, optionally show a toast, update the queue, reset the conflict state, and resume processing the rest of the queue.

### System & Offline UI

Two container components make the system state visible:

- `SystemState`: Shows network status, logged-in user email, and whether the Supabase wrapper is initialized
- `OfflineCard`: Simple card that appears when offline, with an optional message guiding the user

## Supabase Integration

Supabase access is funneled through the `pwa-supabase-wrapper` package.

### Supabase Wrapper

The `PWASupabaseWrapper` class:

- Is a singleton created via `PWASupabaseWrapper.getInstance({ url, anonKey })`
- Exposes:
  - `auth`: high-level authentication helpers
  - `db.items`: operations for the items table
  - `getClient()`: access to the underlying `SupabaseClient`
  - `testConnection()`: a simple health check that calls `auth.getSession()`

The frontend imports this wrapper (via the Supabase context/hooks) and never needs to manage the raw Supabase client directly.

### Type-Safe Database Access

Database types are generated into the `supabase` package as `database.types.ts` and consumed as the `pwa-supabase-types` package. This means:

- Supabase queries in the wrapper are strongly typed
- Frontend code using wrapper methods benefits from accurate TypeScript types for items and auth

## Design Decisions & Trade-offs

This section captures some of the main architectural choices.

### 1. Local Operation Queue vs. Direct Writes

**Decision:** Mutations are queued locally and applied in batches instead of writing directly to Supabase.

**Reasoning:**

- Enables a consistent optimistic UI even when offline
- Provides a clean place to plug in conflict detection and resolution
- Simplifies the React components: they only enqueue operations

**Trade-offs:**

- More moving parts (queue storage, application, conflict handling)
- Requires careful reasoning about edge cases (auth changes, app reloads)

### 2. Monorepo with Separate Wrapper Package

**Decision:** Put Supabase access logic in its own `supabase-wrapper` workspace package.

**Reasoning:**

- Clear separation between infrastructure (Supabase) and UI (React app)
- Wrapper can be reused in other frontends if desired
- Encourages keeping database access logic small and focused

**Trade-offs:**

- Slightly more setup and build steps for local development

### 3. Practice Project Scope

**Decision:** Prioritize learning offline/PWA patterns over production-hardening.

**Reasoning:**

- Primary purpose is to explore:
  - PWA basics (manifest, service worker)
  - Online/offline UX patterns
  - Client-side queues and conflict resolution with a remote DB
- Security, access control, and advanced data modeling are intentionally minimal

**Known limitations:**

- Conflict strategies are basic and tailored to the demo items use case
- No granular per-field merge strategies
- Limited error handling
- Simple database structure

## Getting Started

### Prerequisites

- Node.js 20.19+ and npm
- Supabase CLI, account, and project

### Installation

1. Install dependencies at the repo root:

   ```bash
   npm install
   ```

2. Set up the frontend environment:

   Create a `.env` file in `frontend-react/` with:

   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_URL_BASE=/
   ```

   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` come from your Supabase project settings.
   - `VITE_URL_BASE` controls the base URL the app is served from:
     - Use `/` when hosting at the domain root (local dev, most deployments).
     - Use `/<repository-name>/` when hosting under a sub-path (for example on GitHub Pages).

3. Run database migrations (from the repo root):

   ```bash
   npm run db:push
   ```

   This applies the SQL migrations from `supabase/migrations/` to your Supabase project.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   This will build the wrapper and start Vite in the `frontend-react` workspace.

   ..or run a production preview:

   ```bash
   npm run preview
   ```

   This builds the wrapper and frontend, then serves the built app for local testing.
