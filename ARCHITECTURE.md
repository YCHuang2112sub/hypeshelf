# HypeShelf — Architecture & Design Decisions

## Overview

HypeShelf is a real-time movie recommendation sharing platform. Users can browse a public feed, sign in to add recommendations, and an admin tier controls curation (Staff Picks, deletions).

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) | File-based routing, Server/Client components, edge-ready |
| **Backend / DB** | Convex | Real-time reactive queries over WebSocket, schema validation, serverless functions |
| **Auth** | Clerk | Managed sign-in/sign-up UI, JWT issuance, user management dashboard |
| **Styling** | Vanilla CSS + Tailwind | Global design tokens in CSS; Tailwind utilities for layout |
| **Deployment target** | Vercel + Convex Cloud | Zero-config Next.js deploys; Convex handles its own infra |

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Browser (Next.js)                │
│                                                      │
│   page.tsx ──useQuery──┐    dashboard/page.tsx       │
│   (public, read-only)  │    (auth-gated, read/write) │
└────────────────────────┼─────────────────────────────┘
                         │ WebSocket (live subscription)
                         ▼
┌──────────────────────────────────────────────────────┐
│                  Convex Cloud                        │
│                                                      │
│   recommendations.ts   ←── auth verified via         │
│   ├── listPublic()          Clerk JWT               │
│   ├── listAll()                                     │
│   ├── create()         ←── requireAuth() guard       │
│   ├── remove()         ←── ownership / role check    │
│   ├── toggleStaffPick() ←── admin-only               │
│   └── setRole()        ←── admin-only                │
│                                                      │
│   Database Tables:                                   │
│   ├── recommendations  (title, genre, link, blurb,   │
│   │                     userId, username,            │
│   │                     isStaffPick*)                │
│   └── users            (userId, role)                │
└──────────────────────────────────────────────────────┘
         ▲
         │ JWT verification
         │
┌──────────────────────┐
│   Clerk              │
│   Auth Provider      │
│   - Sign in / up UI  │
│   - Session tokens   │
│   - User management  │
└──────────────────────┘
```

> \* `isStaffPick` is **computed dynamically at query time** — not read from the stored field. Each query fetches all admin `userId`s and tags matching records. This means role changes take effect instantly with no data migration.

---

## Data Model

### `recommendations`
```ts
{
  title:       string,
  genre:       string,            // "horror" | "action" | "comedy" | ...
  link:        string,            // IMDb, Letterboxd, etc.
  blurb:       string,            // short personal take
  userId:      string,            // Clerk subject ID (server-resolved)
  username:    string,            // display name (server-resolved from JWT)
  isStaffPick: boolean,           // stored but overridden at query time
}
// Indexes: by_userId, by_isStaffPick
```

### `users`
```ts
{
  userId: string,                 // Clerk subject ID
  role:   "admin" | "user",
}
// Index: by_userId
```

---

## Authentication & Authorization

### How Auth Works

Clerk issues a signed JWT on login. The `ConvexProviderWithClerk` wrapper attaches this token to every Convex request. Convex verifies the JWT signature against the Clerk issuer URL configured in `auth.config.js`.

Inside any mutation, `ctx.auth.getUserIdentity()` returns the verified payload — the `subject` field is the tamper-proof user ID.

### RBAC Design

```
Two roles: "admin" | "user"  (stored in the `users` table)

Role is ALWAYS resolved server-side:
  1. Verify Clerk JWT → get userId
  2. Look up userId in `users` table → get role
  3. Apply permission check

Client NEVER supplies role — it is ignored even if sent.
```

| Permission | `user` | `admin` |
|---|---|---|
| Browse public feed | ✅ | ✅ |
| Add recommendation | ✅ | ✅ |
| Delete own rec | ✅ | ✅ |
| Delete any rec | ❌ | ✅ |
| Toggle Staff Pick | ❌ | ✅ |
| Assign roles (`setRole`) | ❌ | ✅ (caller must be admin) |

### Key Security Decisions

**1. Server-side role resolution**
Roles are never read from client requests. Every protected mutation calls `requireAuth()` which fetches the role fresh from the DB using the server-verified `userId`. A user cannot claim to be an admin by modifying their request.

**2. `setRole` requires existing admin**
The first admin must be bootstrapped via the CLI (`seed:grantAdmin` — an `internalMutation` unreachable from the browser). After that, only existing admins can promote others. This prevents privilege escalation.

**3. `isStaffPick` computed at query time**
Storing `isStaffPick` as a field that must be manually patched creates a race condition and requires migrations when roles change. Instead, both `listPublic` and `listAll` compute the badge dynamically by checking if `rec.userId` is in the current admin set. Role changes propagate instantly.

**4. `userId` and `username` are server-resolved**
On `create`, the mutation ignores any `userId`/`username` from the client and resolves them from the verified Clerk JWT. Users cannot post as someone else.

**5. Minimal data exposure**
`getMyRole` returns only the role string — not the full `users` row. `listPublic` / `listAll` do not strip `userId` (it's needed for dynamic Staff Pick computation), but `username` is only displayed in the UI for authenticated users.

**6. Route-level protection**
`middleware.ts` (Clerk middleware) blocks `/dashboard` before the page renders. RBAC in mutations is a second layer of defence.

---

## Real-time Data Flow

```
User adds a movie (mutation)
  → Convex persists to DB
  → Convex pushes diff to all active WebSocket subscribers
  → React re-renders affected components automatically
  → All open browser tabs update in ~100ms
```

This is powered by Convex's reactive query system — `useQuery` holds a persistent WebSocket and re-runs whenever the subscribed data changes.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              Root layout, sticky header, nav
│   ├── globals.css             Design system (tokens, components)
│   ├── page.tsx                Public home — genre filter, real-time cards
│   └── dashboard/
│       └── page.tsx            Auth dashboard — add/delete, RBAC UI
├── middleware.ts               Clerk route protection
└── components/
    └── ConvexClientProvider.tsx  Clerk + Convex integration

convex/
├── schema.ts                   Table definitions + indexes
├── recommendations.ts          All queries & mutations (RBAC enforced)
├── auth.config.js              Clerk issuer URL for JWT verification
└── seed.ts                     Dev helpers (seedMovies, grantAdmin)
```

---

## Design Decisions

### Why Convex over a traditional REST API?
Convex eliminates the need to write an API server, manage WebSocket infrastructure, or handle optimistic updates manually. Queries are reactive by default — the same function that reads data also subscribes to it.

### Why Clerk over NextAuth or custom auth?
Clerk provides a production-quality sign-in/sign-up UI, session management, and a user management dashboard out of the box. The JWT-based integration with Convex is first-class and well-documented. The alternative (NextAuth) requires a database adapter and more boilerplate for the same result.

### Why compute Staff Pick dynamically?
Storing `isStaffPick = true` on every admin post means that if an admin loses their role, their past posts remain marked. Computing it from the live `users` table means the badge accurately reflects the *current* role state — no cleanup needed.

### Why vanilla CSS for the design system?
The high-tech theme requires non-standard CSS properties (`backdrop-filter`, layered `radial-gradient` backgrounds, CSS custom properties). Writing these directly in CSS gives full control. Tailwind was configured for layout utilities but the theme itself lives in `globals.css` as native CSS classes (`.glass-card`, `.btn-cyan`, etc.) which work regardless of Tailwind's content scanning.
