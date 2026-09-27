# Architecture & System Design

> **Hackathon Raptors Platform** — Enterprise-grade, API-first, self-hostable hackathon management system.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Module & Directory Structure](#2-module--directory-structure)
3. [RBAC — Role-Based Access Control](#3-rbac--role-based-access-control)
4. [Security Measures](#4-security-measures)
5. [Algorithms](#5-algorithms)
6. [Cryptography & Webhooks](#6-cryptography--webhooks)
7. [Docker Deployment](#7-docker-deployment)

---

## 1. System Overview

The platform follows a three-tier, decoupled architecture:

```
┌──────────────────────────────────────────────────┐
│            React 18 + Vite (Frontend)            │
│         Tailwind CSS — Bauhaus Design System      │
└────────────────────────┬─────────────────────────┘
                         │  REST / HTTP(S)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Express Backend (Node.js)                   │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Auth Middleware │  │  Rate Limiter   │  │ Cert & Webhook  │  │
│  │  (Dual JWT)     │  │ (IP Hash/Anti)  │  │ (Ed25519/HMAC)  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                   │                    │            │
│  ┌────────▼───────────────────▼────────────────────▼─────────┐  │
│  │                    Domain Controllers                      │  │
│  │  Auth · Events · Teams · Projects · Judging · Export      │  │
│  └────────┬────────────────────────────────────┬─────────────┘  │
│           │                                    │                │
│  ┌────────▼────────────────────────────────────▼─────────────┐  │
│  │                Algorithm & Core Services                   │  │
│  │      Z-Score Scoring · Bradley-Terry · Round-Robin        │  │
│  └────────┬────────────────────────────────────┬─────────────┘  │
└───────────┼────────────────────────────────────┼────────────────┘
            │  Mongoose ODM              MongoDB Native
            ▼                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     MongoDB v7.0 (Database)                      │
│  users · events · tracks · teams · projects · rubrics · scores   │
│  judgeassignments · pairwises · votes · comments · auditlogs     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Module & Directory Structure

```
backend/src/
├── app.ts                    # Express app setup, global middleware, OpenAPI mount
├── server.ts                 # HTTP server bootstrap & graceful shutdown
│
├── config/
│   └── database.ts           # Mongoose connection manager
│
├── middleware/
│   ├── authMiddleware.ts     # JWT access token verification
│   ├── rbacMiddleware.ts     # Role-based route guards
│   └── rateLimiter.ts        # Anti-abuse rate limiting
│
├── controllers/
│   ├── authController.ts     # Register, login, refresh, /me
│   ├── eventController.ts    # Event CRUD, status transitions, results reveal
│   ├── teamController.ts     # Team formation, invite codes, member management
│   ├── projectController.ts  # Submissions, edit history, media links
│   ├── judgingController.ts  # Rubrics, invites, assignments, Z-Score trigger
│   ├── pairwiseController.ts # Head-to-head comparisons, Bradley-Terry rankings
│   ├── voteController.ts     # SHA-256 salted IP voting, vote tallies
│   ├── commentController.ts  # Comments and multi-user moderation flagging
│   ├── certController.ts     # Ed25519 cert generation, verification, HTML embed
│   ├── exportController.ts   # Organizer CSV exports (scores, projects)
│   └── auditController.ts    # Audit log queries
│
├── services/
│   ├── authService.ts        # Argon2id hashing, JWT sign/verify, token rotation
│   ├── scoringService.ts     # Weighted rubric calc & cross-judge Z-Score
│   ├── pairwiseService.ts    # Bradley-Terry MM algorithm & next-pair logic
│   ├── judgingService.ts     # Round-robin distribution & conflict detection
│   ├── webhookService.ts     # HMAC-SHA256 event notification dispatch
│   └── auditService.ts       # Async immutable audit log creation
│
├── models/                   # 15 Mongoose schemas + TypeScript interfaces
└── utils/                    # Ed25519 keys, CSV formatters, math helpers
```

---

## 3. RBAC — Role-Based Access Control

All role checks are enforced at the middleware layer before reaching controllers.

| Action / Endpoint                 | Public | Participant | Judge        | Organizer     | Admin |
| :-------------------------------- | :----: | :---------: | :----------: | :-----------: | :---: |
| Register / Login                  | ✅     | ✅          | ✅           | ✅            | ✅    |
| View Events & Public Gallery      | ✅     | ✅          | ✅           | ✅            | ✅    |
| View OpenAPI Spec & Health Check  | ✅     | ✅          | ✅           | ✅            | ✅    |
| Verify Ed25519 Certificate        | ✅     | ✅          | ✅           | ✅            | ✅    |
| Create Team / Submit Project      | ❌     | ✅          | ❌           | ❌            | ✅    |
| Cast Vote / Post Comment          | ❌     | ✅          | ✅           | ✅            | ✅    |
| Score Assigned Projects           | ❌     | ❌          | ✅ (assigned) | ❌            | ✅    |
| Submit Pairwise Comparison        | ❌     | ❌          | ✅           | ❌            | ✅    |
| Create Event / Configure Rubric   | ❌     | ❌          | ❌           | ✅ (own event) | ✅    |
| Assign Judges / Run Z-Score       | ❌     | ❌          | ❌           | ✅ (own event) | ✅    |
| Export CSV / Generate Certs       | ❌     | ❌          | ❌           | ✅ (own event) | ✅    |
| View Audit Logs                   | ❌     | ❌          | ❌           | ✅ (own event) | ✅    |
| Global Admin Panel                | ❌     | ❌          | ❌           | ❌            | ✅    |

---

## 4. Security Measures

| Mechanism | Implementation |
| :--- | :--- |
| **Password Hashing** | Argon2id — 64 MB memory cost, 3 iterations, 4 parallelism lanes |
| **Access Token** | JWT — 15-minute TTL, sent as `Authorization: Bearer <token>` |
| **Refresh Token** | JWT — 30-day TTL, stored in HTTP-Only SameSite Secure cookie |
| **Vote Fraud Prevention** | `SHA-256(ip + ":" + eventId)` — protects voter privacy, blocks stuffing |
| **Cert Authenticity** | Ed25519 asymmetric signature — 64-byte, tamper-evident |
| **Audit Trail** | Immutable log recorded on every state-changing operation |
| **Rate Limiting** | 100 req/15m global; 5 req/min on auth & voting endpoints |

---

## 5. Algorithms

### Z-Score Cross-Judge Normalization

Eliminates bias caused by lenient, harsh, or low-variance judges.

1. Compute **per-judge mean** → `μⱼ`
2. Compute **per-judge std dev** → `σⱼ`
3. Normalize each score → `zⱼₖ = (Sⱼₖ − μⱼ) / σⱼ`
4. Rescale to 0–100 → `Nⱼₖ = Clamp(50 + 15 × zⱼₖ, 0, 100)`
5. Final score = average `Nⱼₖ` across all assigned judges

See [JUDGING.md](JUDGING.md) for full derivation and worked examples.

---

### Bradley-Terry Pairwise (MM Algorithm)

Head-to-head comparisons produce latent skill parameters `γᵢ` via the Minorization-Maximization update:

```
γᵢ(t+1) = wᵢ / Σⱼ≠ᵢ [ nᵢⱼ / (γᵢ(t) + γⱼ(t)) ]
```

Iterates until `max|γᵢ(t+1) − γᵢ(t)| < 1e-5` or 100 iterations.

---

### Round-Robin Assignment

1. Sort judges by current workload (fewest assignments first)
2. Skip any judge who is a member of the target project's team (conflict guard)
3. Unique compound index `(judgeId, projectId)` prevents duplicate assignments

---

## 6. Cryptography & Webhooks

### Ed25519 Certificate Engine

```
Organizer triggers generate →
  Ed25519 keypair created per event
  Canonical JSON payload built:
    { certId, judgeName, eventTitle, projectsJudged, issuedAt }
  64-byte signature = crypto.sign(null, payload, privateKey)
  Stored: { payload, signature, publicKey, certId }

Public verification:
  GET /api/certs/verify/:certId
  crypto.verify(null, payload, publicKey, signature) → { valid: true/false }
```

### Webhook Dispatch

Every state-changing event fires a signed HTTP POST to configured endpoints:

| Header | Value |
| :--- | :--- |
| `X-Raptors-Event` | e.g. `project.submitted`, `results.revealed` |
| `X-Raptors-Signature` | `sha256=HMAC_SHA256(secret, body)` |

Supported events: `project.submitted` · `project.updated` · `score.submitted` · `vote.cast` · `judge.assigned` · `event.status_changed` · `results.revealed`

---

## 7. Docker Deployment

> [!IMPORTANT]
> **Single command to start the entire stack:**
> ```bash
> npm run docker:up
> ```

The `docker-compose.yml` orchestrates three containers:

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports: ["27017:27017"]
    volumes: [mongo_data:/data/db]

  backend:
    build: ./backend
    ports: ["5000:5000"]
    depends_on: [mongodb]
    environment:
      MONGO_URI: mongodb://mongodb:27017/hackathon_raptors
      PORT: 5000

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
```

| Command | Action |
| :--- | :--- |
| `npm run docker:up` | Build & start all containers |
| `npm run docker:down` | Stop all containers |
| `npm run docker:logs` | Stream container logs |
| `npm run docker:reset` | Wipe volumes & rebuild cleanly |
