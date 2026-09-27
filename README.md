# 🦖 Hackathon Raptors Platform

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vitest](https://img.shields.io/badge/Tests-32%20Passing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> An enterprise-grade, self-hostable, API-first **Hackathon Management Platform** featuring
> mathematical scoring fairness, anti-abuse voting, Ed25519 cryptographic certificates, and strict role isolation.

---

## Table of Contents

- [⚡ Quick Start](#-quick-start)
- [🚀 How to Run](#-how-to-run)
- [🛠️ All Commands](#%EF%B8%8F-all-commands)
- [🔑 Seed Accounts](#-seed-accounts)
- [✨ Features](#-features)
- [📁 Project Structure](#-project-structure)
- [🧪 Running Tests](#-running-tests)
- [❓ Troubleshooting](#-troubleshooting)
- [📚 Documentation](#-documentation)

---

## ⚡ Quick Start

> [!IMPORTANT]
> **One command starts the entire project — Database + Backend API + Frontend UI:**
>
> ```bash
> npm run docker:up
> ```
>
> Then open **http://localhost:3000** in your browser. Done.

---

## 🚀 How to Run

### Option A — Docker ⭐ Recommended

The fastest way. Requires only [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

```bash
# Start all services (MongoDB + Express API + React UI) in one command
npm run docker:up
```

| Service       | URL                                          |
| :------------ | :------------------------------------------- |
| 🎨 Frontend   | http://localhost:3000                        |
| ⚙️ API        | http://localhost:5000/api                    |
| 🏥 Health     | http://localhost:5000/health                 |
| 📖 OpenAPI    | http://localhost:5000/api/openapi.json       |

---

### Option B — Local Development

Requires **Node.js v20+** and a running **MongoDB** instance on port `27017`.

**Step 1 — Install dependencies:**
```bash
npm run setup
```

**Step 2 — Create `backend/.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hackathon_raptors
JWT_SECRET=super-secret-jwt-key-raptors-2026
JWT_REFRESH_SECRET=super-secret-refresh-key-raptors-2026
NODE_ENV=development
```

**Step 3 — Seed the database:**
```bash
cd backend && npm run seed && cd ..
```

**Step 4 — Start both servers:**
```bash
npm run dev
```

---

## 🛠️ All Commands

| Command                   | What it does                                                  |
| :------------------------ | :------------------------------------------------------------ |
| **`npm run docker:up`**   | ⭐ **Builds & starts ALL services (DB + API + UI) at once**  |
| `npm run docker:down`     | Stops all running Docker containers                           |
| `npm run docker:logs`     | Streams live logs from all containers                         |
| `npm run docker:reset`    | Wipes volumes and rebuilds containers from scratch            |
| `npm run setup`           | Installs dependencies for backend and frontend                |
| `npm run dev`             | Runs backend + frontend concurrently in watch mode            |
| `npm run dev:backend`     | Runs only the backend server (port 5000)                      |
| `npm run dev:frontend`    | Runs only the frontend Vite dev server (port 3000)            |
| `npm run build`           | Builds frontend production assets                             |
| `npm test`                | Runs the full Vitest acceptance test suite (32 tests)        |
| `npm run test:watch`      | Runs tests in interactive watch mode                          |

---

## 🔑 Seed Accounts

These accounts are created automatically when running `npm run seed` or via Docker:

| Role            | Email                          | Password       | Access Level                                       |
| :-------------- | :----------------------------- | :------------- | :------------------------------------------------- |
| 🛡️ Admin        | `admin@hackathon.local`        | `Password123!` | Full system access, user management                |
| 📋 Organizer    | `organizer@hackathon.local`    | `Password123!` | Create events, configure rubrics, reveal results   |
| ⚖️ Judge 1      | `judge1@hackathon.local`       | `Password123!` | Score assigned projects, submit pairwise rankings  |
| ⚖️ Judge 2      | `judge2@hackathon.local`       | `Password123!` | Score assigned projects, submit pairwise rankings  |
| 🚀 Participant 1 | `participant1@hackathon.local` | `Password123!` | Create team, submit project                        |
| 👥 Participant 2 | `participant2@hackathon.local` | `Password123!` | Join team, vote on gallery                         |

---

## ✨ Features

### 🏆 Event & Team Management
- Full event lifecycle: `draft → open → submissions_closed → judging → voting → ended`
- Auto-generated 12-character unique team invite codes
- Configurable min/max team size and solo participant support
- Multiple tracks with custom prize allocation per track

### ⚖️ Mathematical Judging Engine
- Weighted multi-criteria rubrics with automated total weight calculation
- Round-robin project assignment with automatic conflict-of-interest detection
- **Cross-Judge Z-Score Normalization** — eliminates bias from lenient or harsh judges
- **Bradley-Terry Pairwise Ranking** — Minorization-Maximization (MM) algorithm for head-to-head comparison

### 🗳️ Gallery & Community
- Seeded PRNG shuffle (`?seed=N`) — prevents first-page exposure bias in the public gallery
- SHA-256 salted IP-Event hashing for privacy-preserving anti-abuse vote enforcement
- Community comments with multi-user flag-based moderation system

### 🔐 Security
- Argon2id password hashing — 64 MB memory cost, 3 iterations, 4 parallelism lanes
- Dual JWT auth — 15-minute access tokens + 30-day HTTP-Only refresh tokens
- Ed25519 cryptographic certificates for judges with public instant verification
- Immutable audit log and HMAC-SHA256 signed webhooks

---

## 📁 Project Structure

```
hackathon-raptors/
├── backend/
│   ├── src/
│   │   ├── config/             # Database & environment configuration
│   │   ├── controllers/        # REST API endpoint handlers
│   │   ├── middleware/         # Auth (JWT), RBAC, rate limiting
│   │   ├── models/             # 15 Mongoose schemas & TypeScript interfaces
│   │   ├── routes/             # Express route definitions
│   │   ├── seed/               # Database seed scripts
│   │   ├── services/           # Scoring, Z-Score, Pairwise, Webhook logic
│   │   └── utils/              # Ed25519 crypto helpers & CSV formatters
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # UI components (Bauhaus design system)
│   │   ├── pages/              # App views: Dashboard, Gallery, Judging, Admin
│   │   └── services/           # Axios API client with token interceptors
│   ├── Dockerfile
│   └── package.json
├── tests/
│   ├── t1-core.test.ts         # Auth, Events, Teams, OpenAPI
│   ├── t2-judging.test.ts      # Rubric, Assignment, Scoring, Z-Score
│   ├── t3-gallery-voting.test.ts  # Gallery, Anti-abuse voting, Comments
│   ├── t4-api.test.ts          # CSV export, Certificates, Pairwise
│   └── helpers.ts              # Shared login/auth helpers
├── ARCHITECTURE.md             # System architecture & RBAC matrix
├── DATA-MODEL.md               # Database schemas & ER diagram
├── JUDGING.md                  # Scoring engine math & algorithms
├── acceptance-report.txt       # Official QA acceptance sign-off
├── docker-compose.yml          # Container orchestration config
└── package.json                # Root workspace scripts
```

---

## 🧪 Running Tests

The integration test suite covers all 32 acceptance criteria across 4 suites:

```bash
# Run the full test suite
npm test

# Run in watch mode
npm run test:watch
```

| Suite | Tests | Coverage |
| :---- | :---: | :------- |
| T1 — Core | 13 | Auth, JWT, Events, Teams, OpenAPI |
| T2 — Judging | 10 | Rubrics, Assignments, Scoring, Z-Score |
| T3 — Gallery | 10 | PRNG Shuffle, Anti-abuse Voting, Comments, Audit |
| T4 — API | 10 | CSV Exports, Ed25519 Certs, Pairwise MM, Webhooks |

> [!NOTE]
> Tests require the backend to be running on `http://localhost:5000`. Use `npm run docker:up` or `npm run dev:backend` first.

---

## ❓ Troubleshooting

**MongoDB connection refused (`ECONNREFUSED 127.0.0.1:27017`)**
→ Use `npm run docker:up` — it runs MongoDB inside Docker automatically.

**Port 5000 or 3000 already in use**
→ Stop the conflicting process, or change `PORT` in `backend/.env` and `vite.config.ts`.

**`Module not found` errors**
→ Run `npm run setup` again from the project root to reinstall all dependencies.

---

## 📚 Documentation

| File | Contents |
| :--- | :------- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, module structure, RBAC matrix, Docker topology |
| [DATA-MODEL.md](DATA-MODEL.md)     | All 15 MongoDB collection schemas with types, indexes & ER diagram |
| [JUDGING.md](JUDGING.md)           | Scoring formulas, Z-Score derivation, Bradley-Terry MM algorithm |
| [acceptance-report.txt](acceptance-report.txt) | Full QA sign-off with 32 verified test results |

---

## 📄 License

Released under the **MIT License**.
