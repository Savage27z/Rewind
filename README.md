<div align="center">

# ⏪ Rewind

### Time-Travel Debugging for Your Database

Every database mutation, captured as an immutable event.  
Scrub through time. Diff any two moments. Reconstruct state at any millisecond.

[![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?logo=amazondynamodb&logoColor=white)](https://aws.amazon.com/dynamodb)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Clerk](https://img.shields.io/badge/Clerk-000?logo=clerk&logoColor=white)](https://clerk.com)
[![Claude](https://img.shields.io/badge/Claude_AI-cc785c?logo=anthropic&logoColor=white)](https://anthropic.com)

[Demo](#demo) · [Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [SDK](#sdk-integration)

</div>

---

## The Problem

You're debugging a production issue. A user's order total is wrong, inventory went negative, or a price mysteriously became $0. You open your database — but all you see is the **current** state. The history is gone. The context is gone. The "why" is gone.

You check application logs, grep through server output, trace through code paths — all to reconstruct what happened in what order. Hours of detective work for something that should take seconds.

## The Solution

**Rewind** captures every database mutation as an immutable event, giving you a complete, queryable history of every entity in your system. Think `git log` for your database — but with diffs, branching, anomaly detection, and AI-powered explanations.

```
Your App → Rewind SDK → Event Stream → Time-Travel Dashboard
```

Drop in a Mongoose middleware (or hit the REST API directly), and every `CREATE`, `UPDATE`, and `DELETE` is captured with before/after payloads, sequence numbers, and timestamps. Then use the dashboard to scrub through time, diff any two moments, and let Claude AI explain what happened.

---

## Demo

> **Live:** _Coming soon — deployment in progress_

**Dashboard Overview:**

The dashboard gives you a real-time view of all tracked entities, recent events, anomalies, and entity type distribution — all scoped to your authenticated user account.

---

## Features

### Core Engine
- **Immutable Event Capture** — Every `CREATE`, `UPDATE`, `DELETE` stored with before/after payloads, sequence numbers, and causal chain tracking
- **State Reconstruction** — Rebuild any entity's exact state at any millisecond by replaying events from the nearest snapshot
- **Automatic Snapshots** — Full state snapshots created every 50 events for O(1) lookups instead of full-history replays
- **Deep Diffing** — Compare any two points in time with field-level, nested-object-aware diffs (additions, deletions, modifications)
- **In-Memory LRU Cache** — 500-entry, 5-minute TTL cache for hot state reconstructions

### Anomaly Detection
- **Velocity Monitoring** — Sliding-window rate detection: flags when DELETE > 50/min or other operations > 200/min
- **Schema Drift Detection** — Automatically infers field types per entity type and flags when a field's type changes (e.g., `price` from `number` to `string`)
- **Sequence Gap Detection** — Catches missing events in the sequence chain, indicating potential data loss or out-of-order writes

### AI-Powered Explanations
- **Claude Integration** — Select any event on the timeline, click "Explain," and Claude analyzes the event plus its surrounding context to explain *why* the change likely happened
- **Streaming Responses** — Explanations stream in real-time via Server-Sent Events for instant feedback
- **Contextual Analysis** — Claude sees the surrounding event context (before/after states, related entity changes) to identify causal chains

### Branch Reality (What-If Analysis)
- **Fork at Any Point** — Pick any timestamp and create a hypothetical branch
- **Synthetic Events** — Inject events that never happened to test "what would have happened if..."
- **Omit Events** — Remove specific events to see how the state would differ
- **Side-by-Side Diff** — Compare the real final state vs. the hypothetical state with full field-level diffs

### Investigations
- **Pin Timestamps** — Bookmark specific moments across different entities into a shared investigation
- **Annotations** — Add notes and context to investigations for team collaboration
- **Persistent Threads** — Investigations are saved and can be revisited as debugging continues

### Data Export
- **JSON Export** — Full event history for any entity, prettified
- **CSV Export** — Tabular format with all event fields, payload serialized per row
- **Filtered Exports** — Export events from a specific time range with the `since` parameter

### Security & Multi-Tenancy
- **Per-User Data Isolation** — Every user sees only their own data. Clerk's `userId` is used as the `tenantId` for all DynamoDB queries
- **API Key Authentication** — SHA-256 hashed keys with prefix display (`rw_abc...`). Keys are scoped per user, with create/list/revoke management
- **Clerk Authentication** — All dashboard API routes protected by Clerk `auth()`. Ingest endpoint uses API key auth for SDK/server-to-server use

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Mongoose    │  │   REST API   │  │  Any ORM/Client  │  │
│  │  Middleware   │  │   Calls      │  │   (via REST)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          └────────┬────────┴────────┬──────────┘
                   ▼                 ▼
          ┌────────────────────────────────┐
          │     POST /api/chronos/ingest   │ ← API Key Auth
          │     (Event Ingestion)          │
          └────────────────┬───────────────┘
                           │
                    ┌──────▼──────┐
                    │  Event Store │
                    │  (ingest +   │
                    │   snapshot)  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │  DynamoDB    │ │  Anomaly    │ │  Snapshot    │
   │  Single      │ │  Detection  │ │  Engine      │
   │  Table       │ │  (async)    │ │  (every 50)  │
   └──────┬──────┘ └─────────────┘ └─────────────┘
          │
          ▼
   ┌─────────────────────────────────────────┐
   │           Rewind Dashboard              │
   │  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
   │  │ Timeline  │ │ Diff     │ │ Branch  │ │
   │  │ Scrubber  │ │ Viewer   │ │ Reality │ │
   │  ├──────────┤ ├──────────┤ ├─────────┤ │
   │  │ Anomaly  │ │ AI       │ │ Investi-│ │
   │  │ Alerts   │ │ Explain  │ │ gations │ │
   │  └──────────┘ └──────────┘ └─────────┘ │
   └─────────────────────────────────────────┘
```

### DynamoDB Single-Table Design

All data lives in one DynamoDB table with a composite primary key (`PK`, `SK`) and two Global Secondary Indexes:

| Access Pattern | PK | SK | Index |
|---|---|---|---|
| Events for an entity | `ENTITY#{entityId}` | `EVENT#{timestamp}#{eventId}` | Table |
| Snapshots for an entity | `ENTITY#{entityId}` | `SNAPSHOT#{timestamp}` | Table |
| Entities for a tenant | `TENANT#{tenantId}` | `ENTITY#{entityId}` | Table |
| Current state | `TENANT#{tenantId}` | `CURRENT#{entityId}` | Table |
| Anomalies for a tenant | `TENANT#{tenantId}` | `ANOMALY#{timestamp}#{id}` | Table |
| Schema metadata | `TENANT#{tenantId}` | `META#SCHEMA#{entityType}` | Table |
| Investigations | `TENANT#{tenantId}` | `INVESTIGATION#{id}` | Table |
| API keys (by user) | `USER#{userId}` | `APIKEY#{keyId}` | Table |
| API keys (by hash) | `APIKEY#{hash}` | `APIKEY#{hash}` | Table |
| Timeline queries | `TENANT#{tenantId}` | `EVENT#{timestamp}` | GSI1 |
| Type-filtered queries | `TYPE#{entityType}` | `{timestamp}` | GSI2 |

### State Reconstruction Algorithm

```
reconstructStateAt(entityId, targetTimestamp):
  1. Check in-memory LRU cache → hit? return cached
  2. Find latest SNAPSHOT before targetTimestamp
  3. Load events from snapshot.timestamp → targetTimestamp
  4. Sort events by sequenceNumber
  5. Replay: CREATE → replace state, UPDATE → merge, DELETE → clear
  6. Cache result (5min TTL) and return
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | AWS DynamoDB (single-table, on-demand) |
| Auth | Clerk (session + API key) |
| AI | Claude claude-sonnet-4-6 via Anthropic SDK |
| Styling | Tailwind CSS v4 + custom glassmorphism |
| UI | React 19, Lucide icons, custom glass components |
| IDs | ULID (sortable, unique) |
| Diffing | Custom recursive deep diff engine |

---

## Getting Started

### Prerequisites

- Node.js 18+
- AWS account with DynamoDB access (or DynamoDB Local)
- Clerk account (free tier works)
- Anthropic API key (for AI explanations)

### 1. Clone & Install

```bash
git clone https://github.com/Savage27z/Rewind.git
cd Rewind
npm install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AWS DynamoDB
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=RewindEvents

# Optional: Use DynamoDB Local
# DYNAMODB_LOCAL=true

# Anthropic (for AI Explain feature)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Create DynamoDB Table

```bash
npm run setup-db
```

This creates the `RewindEvents` table with PAY_PER_REQUEST billing and two GSIs.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then click **"Load Demo Data"** on the dashboard to populate your account with sample entities and anomalies.

### 5. Using DynamoDB Local (Optional)

If you want to develop without an AWS account:

```bash
# Run DynamoDB Local via Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Set in .env.local
DYNAMODB_LOCAL=true

# Create table
npm run setup-db
```

---

## API Reference

All `/api/chronos/*` endpoints require authentication. Dashboard routes use Clerk session auth. The ingest endpoint uses API key auth.

### Ingest Event

```
POST /api/chronos/ingest
```

Captures a database mutation event.

**Headers:**
```
x-api-key: rw_your_api_key_here
Content-Type: application/json
```

**Body:**
```json
{
  "entityType": "User",
  "entityId": "user_123",
  "eventType": "UPDATE",
  "payload": {
    "before": { "email": "old@example.com" },
    "after": { "email": "new@example.com" }
  },
  "sequenceNumber": 5,
  "metadata": { "source": "user-service" }
}
```

**Response (201):**
```json
{
  "eventId": "01HZ5G...",
  "timestamp": "2026-06-20T12:00:00.000Z",
  "sequenceNumber": 5
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `entityType` | string | Yes | Type of entity (e.g., `"User"`, `"Order"`) |
| `entityId` | string | Yes | Unique identifier for the entity |
| `eventType` | `CREATE` \| `UPDATE` \| `DELETE` | Yes | Type of mutation |
| `payload.before` | object | No | State before the change |
| `payload.after` | object | Yes for CREATE | State after the change |
| `sequenceNumber` | number | Yes | Monotonically increasing per entity |
| `causationId` | string | No | ID of the event that caused this one |
| `metadata` | object | No | Arbitrary metadata |

### List Entities

```
GET /api/chronos/entities
```

Returns all tracked entities for the authenticated user.

**Response:**
```json
{
  "items": [
    {
      "entityId": "user_123",
      "entityType": "User",
      "createdAt": "2026-06-20T10:00:00.000Z",
      "lastEventAt": "2026-06-20T12:00:00.000Z"
    }
  ]
}
```

### Get Timeline

```
GET /api/chronos/timeline?entityId=user_123
```

Returns the event history for an entity (or all events for the tenant).

**Query Parameters:**
| Param | Description |
|---|---|
| `entityId` | Filter events by entity |
| `from` | ISO timestamp — start of range |
| `to` | ISO timestamp — end of range |
| `entityType` | Filter by entity type |
| `limit` | Max events to return |

### Reconstruct State

```
GET /api/chronos/state?entityId=user_123&timestamp=2026-06-20T11:00:00.000Z
```

Reconstructs the exact state of an entity at any point in time.

### Compute Diff

```
GET /api/chronos/diff?entityId=user_123&t1=2026-06-20T10:00:00Z&t2=2026-06-20T12:00:00Z
```

Returns field-level diffs between two timestamps.

**Response:**
```json
{
  "entityId": "user_123",
  "t1": "2026-06-20T10:00:00Z",
  "t2": "2026-06-20T12:00:00Z",
  "additions": [{ "path": "avatar", "after": "photo.jpg" }],
  "deletions": [],
  "modifications": [{ "path": "email", "before": "old@x.com", "after": "new@x.com" }]
}
```

### List Anomalies

```
GET /api/chronos/anomalies
```

Returns detected anomalies (velocity spikes, schema drift, sequence gaps).

### AI Explain

```
POST /api/chronos/explain
Content-Type: application/json

{
  "eventId": "01HZ5G...",
  "entityId": "user_123"
}
```

Streams a Claude AI explanation of why the event likely occurred, analyzing surrounding context. Response is Server-Sent Events.

### Branch Reality

```
POST /api/chronos/branch
Content-Type: application/json

{
  "entityId": "user_123",
  "forkTimestamp": "2026-06-20T11:00:00.000Z",
  "syntheticEvents": [
    {
      "eventType": "UPDATE",
      "payload": { "after": { "role": "admin" } },
      "sequenceNumber": 3
    }
  ],
  "omitEventIds": ["01HZ5G..."]
}
```

**Response:**
```json
{
  "originalState": { "name": "Alice", "role": "user" },
  "hypotheticalState": { "name": "Alice", "role": "admin" },
  "diff": { "modifications": [{ "path": "role", "before": "user", "after": "admin" }] }
}
```

### Export History

```
GET /api/chronos/export?entityId=user_123&format=json
GET /api/chronos/export?entityId=user_123&format=csv&since=2026-06-01
```

Downloads the full event history as JSON or CSV.

### API Key Management

```
GET    /api/keys                              # List your API keys
POST   /api/keys   { "label": "Production" }  # Create a new key
DELETE /api/keys   { "keyId": "key_abc..." }   # Revoke a key
```

### Investigations

```
GET    /api/chronos/investigate                            # List investigations
POST   /api/chronos/investigate  { "title": "Price bug" }  # Create investigation
PUT    /api/chronos/investigate  { investigationId, pinnedTimestamps, annotations }  # Update
```

---

## SDK Integration

### Mongoose Middleware

The fastest way to integrate Rewind is with the Mongoose middleware — zero changes to your existing code:

```typescript
import mongoose from "mongoose";
import { rewindMiddleware } from "rewind/sdk/middleware/mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, default: "user" },
});

// Add Rewind — that's it
userSchema.plugin(rewindMiddleware, {
  endpoint: "https://your-rewind-instance.vercel.app/api/chronos/ingest",
  tenantId: "your-tenant-id",
  entityType: "User",
});

const User = mongoose.model("User", userSchema);

// Every save, update, and delete is now captured
await User.create({ name: "Alice", email: "alice@example.com" });
// → CREATE event sent to Rewind

await User.findByIdAndUpdate(id, { role: "admin" });
// → UPDATE event sent to Rewind

await User.findByIdAndDelete(id);
// → DELETE event sent to Rewind
```

### Direct REST API

For non-Mongoose applications, send events directly:

```typescript
async function trackChange(entityType: string, entityId: string, eventType: string, before: any, after: any) {
  await fetch("https://your-rewind-instance.vercel.app/api/chronos/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "rw_your_api_key",
    },
    body: JSON.stringify({
      entityType,
      entityId,
      eventType,
      payload: { before, after },
      sequenceNumber: Date.now(),
    }),
  });
}
```

---

## Dashboard Pages

| Page | Path | Description |
|---|---|---|
| **Overview** | `/dashboard` | Event counts, entity types, recent activity, anomaly summary |
| **Entities** | `/dashboard/entities` | Browse all tracked entities with type filters and search |
| **Entity Detail** | `/dashboard/entities/[id]` | Timeline scrubber, state viewer, AI explain, export |
| **Diff Viewer** | `/dashboard/diff` | Compare any entity's state between two timestamps |
| **Anomalies** | `/dashboard/anomalies` | Severity-coded alerts for velocity, schema drift, sequence gaps |
| **Branch Reality** | `/dashboard/branch` | What-if analysis with synthetic events and omissions |
| **Investigations** | `/dashboard/investigate` | Create threads, pin timestamps, add notes |
| **API Keys** | `/dashboard/keys` | Generate, view, and revoke API keys |
| **Settings** | `/dashboard/settings` | Engine configuration, SDK integration snippet |
| **Profile** | `/dashboard/profile` | Clerk user profile management |

---

## Project Structure

```
rewind/
├── app/
│   ├── api/
│   │   ├── chronos/
│   │   │   ├── anomalies/route.ts    # Anomaly listing
│   │   │   ├── branch/route.ts       # Branch reality what-if
│   │   │   ├── diff/route.ts         # State diffing
│   │   │   ├── entities/route.ts     # Entity listing
│   │   │   ├── explain/route.ts      # AI explanations (Claude)
│   │   │   ├── export/route.ts       # JSON/CSV export
│   │   │   ├── ingest/route.ts       # Event ingestion (API key auth)
│   │   │   ├── investigate/route.ts  # Investigation CRUD
│   │   │   ├── state/route.ts        # State reconstruction
│   │   │   ├── stream/route.ts       # SSE event stream
│   │   │   └── timeline/route.ts     # Event timeline
│   │   ├── keys/route.ts             # API key management
│   │   └── seed-demo/route.ts        # Demo data seeder
│   ├── dashboard/                     # All dashboard pages
│   ├── sign-in/                       # Clerk sign-in
│   ├── sign-up/                       # Clerk sign-up
│   ├── page.tsx                       # Landing page
│   ├── layout.tsx                     # Root layout
│   ├── globals.css                    # Global styles
│   ├── icon.svg                       # Favicon
│   └── opengraph-image.svg           # OG social card
├── components/ui/
│   ├── aurora-background.tsx          # Animated aurora effect
│   ├── glass-card.tsx                 # Glassmorphism card
│   └── liquid-glass-button.tsx        # Glass-styled button
├── lib/
│   ├── anomaly.ts                     # Anomaly detection engine
│   ├── api-keys.ts                    # API key hashing & CRUD
│   ├── branch.ts                      # Branch reality engine
│   ├── cache.ts                       # In-memory LRU cache
│   ├── differ.ts                      # Recursive deep diff
│   ├── dynamo.ts                      # DynamoDB client & helpers
│   ├── event-store.ts                 # Event ingestion & queries
│   ├── explain.ts                     # Claude AI integration
│   ├── snapshot.ts                    # Snapshot engine & state replay
│   ├── types.ts                       # All TypeScript interfaces
│   └── utils.ts                       # cn() utility
├── sdk/
│   └── middleware/
│       └── mongoose.ts                # Mongoose plugin
├── scripts/
│   ├── setup-dynamo.ts                # Table creation script
│   └── seed-playground.ts             # Bulk seed script
├── package.json
└── tsconfig.json
```

---

## Design

The dashboard uses a custom **glassmorphism** design system — translucent cards with backdrop blur, gradient borders, and liquid-glass buttons. The landing page features:

- **Dark/Light mode** toggle via React Context (not Tailwind `dark:` classes)
- **Scroll-triggered animations** with cubic-bezier easing
- **Aurora background** on auth pages with animated gradient blobs
- **Glassmorphic feature cards** with hover glow effects

Color palette: `#0A0A0A` (background), `#b8c4ff` (accent), `#4B66D1` (primary blue).

---

## Built With

- [Next.js 16](https://nextjs.org) — React framework with App Router and Turbopack
- [AWS DynamoDB](https://aws.amazon.com/dynamodb) — Serverless NoSQL with single-table design
- [Clerk](https://clerk.com) — Authentication and user management
- [Anthropic Claude](https://anthropic.com) — AI-powered event explanations
- [Tailwind CSS v4](https://tailwindcss.com) — Utility-first styling
- [Lucide](https://lucide.dev) — Icon library
- [ULID](https://github.com/ulid/spec) — Universally unique, lexicographically sortable identifiers

---

## License

MIT

---

<div align="center">

Built for the [h01 Hackathon](https://h01.devpost.com) by **Savage27z**

</div>
