# Data Model & Schema Reference

> **Hackathon Raptors Platform** — MongoDB v7.0 database, managed via Mongoose ODM 8.x.
> 15 collections documented below.

---

## Table of Contents

1. [Entity-Relationship Diagram](#1-entity-relationship-diagram)
2. [User](#2-user-collection-users)
3. [Event](#3-event-collection-events)
4. [Track](#4-track-collection-tracks)
5. [Team](#5-team-collection-teams)
6. [Project](#6-project-collection-projects)
7. [Rubric](#7-rubric-collection-rubrics)
8. [JudgeAssignment](#8-judgeassignment-collection-judgeassignments)
9. [Score](#9-score-collection-scores)
10. [PairwiseComparison](#10-pairwisecomparison-collection-pairwisecomparisons)
11. [Vote](#11-vote-collection-votes)
12. [Comment](#12-comment-collection-comments)
13. [Certificate](#13-certificate-collection-certificates)
14. [AuditLog](#14-auditlog-collection-auditlogs)
15. [Webhook](#15-webhook-collection-webhooks)
16. [InviteToken](#16-invitetoken-collection-invitetokens)

---

## 1. Entity-Relationship Diagram

```
USER ──────┬──── organizes ────► EVENT ──┬──── has ──────────► TRACK
           ├──── leads ────────► TEAM    ├──── contains ─────► TEAM
           ├──── member_of ───► TEAM     ├──── contains ─────► PROJECT
           ├──── assigned_to ─► JUDGE_   ├──── configures ───► RUBRIC
           │                    ASSIGN   ├──── registers ────► WEBHOOK
           ├──── submits ─────► SCORE    └──── tracks ───────► AUDIT_LOG
           ├──── evaluates ──► PAIRWISE
           ├──── casts ───────► VOTE     TEAM ────────────────► PROJECT
           ├──── writes ──────► COMMENT
           └──── receives ───► CERT      PROJECT ─┬──► JUDGE_ASSIGN
                                                   ├──► SCORE
RUBRIC ───────── references ──► SCORE              ├──► VOTE
JUDGE_ASSIGN ─── satisfies ───► SCORE              └──► COMMENT
```

---

## 2. User Collection (`users`)

Stores credentials, profile data, roles, and refresh tokens.

| Field          | Type     | Required | Default         | Constraint              |
| :------------- | :------- | :------: | :-------------- | :---------------------- |
| `email`        | String   | ✅       | —               | Unique · Lowercase      |
| `passwordHash` | String   | ✅       | —               | Argon2id hash           |
| `name`         | String   | ✅       | —               | Trimmed                 |
| `role`         | String   | ✅       | `'participant'` | Enum (see below)        |
| `bio`          | String   | ❌       | `''`            | —                       |
| `avatarUrl`    | String   | ❌       | `''`            | —                       |
| `resetToken`   | String   | ❌       | —               | —                       |
| `resetExpiry`  | Date     | ❌       | —               | —                       |
| `refreshToken` | String   | ❌       | —               | —                       |
| `createdAt`    | Date     | auto     | —               | Mongoose timestamps     |
| `updatedAt`    | Date     | auto     | —               | Mongoose timestamps     |

**Role Enum:** `admin` · `organizer` · `judge` · `participant`

---

## 3. Event Collection (`events`)

Defines hackathons, their timelines, configuration, and lifecycle state.

| Field                 | Type      | Required | Default   | Notes                                                 |
| :-------------------- | :-------- | :------: | :-------- | :---------------------------------------------------- |
| `title`               | String    | ✅       | —         | Trimmed                                               |
| `description`         | String    | ✅       | —         | —                                                     |
| `bannerUrl`           | String    | ❌       | —         | —                                                     |
| `organizerId`         | ObjectId  | ✅       | —         | Ref: `User` · Indexed                                 |
| `status`              | String    | ✅       | `'draft'` | Enum: `draft` `open` `submissions_closed` `judging` `voting` `ended` |
| `registrationStart`   | Date      | ✅       | —         | —                                                     |
| `registrationEnd`     | Date      | ✅       | —         | —                                                     |
| `submissionStart`     | Date      | ✅       | —         | —                                                     |
| `submissionDeadline`  | Date      | ✅       | —         | —                                                     |
| `judgingStart`        | Date      | ❌       | —         | —                                                     |
| `judgingEnd`          | Date      | ❌       | —         | —                                                     |
| `votingStart`         | Date      | ❌       | —         | —                                                     |
| `votingEnd`           | Date      | ❌       | —         | —                                                     |
| `maxTeamSize`         | Number    | ❌       | `4`       | —                                                     |
| `minTeamSize`         | Number    | ❌       | `1`       | —                                                     |
| `allowSoloParticipants`| Boolean  | ❌       | `true`    | —                                                     |
| `prizes`              | Array     | ❌       | `[]`      | Embedded `PrizeSchema`                                |
| `rubricId`            | ObjectId  | ❌       | —         | Ref: `Rubric`                                         |
| `votingEnabled`       | Boolean   | ❌       | `false`   | —                                                     |
| `resultsRevealed`     | Boolean   | ❌       | `false`   | —                                                     |
| `tags`                | String[]  | ❌       | `[]`      | —                                                     |

**Indexes:** `status` · `organizerId`

---

## 4. Track Collection (`tracks`)

Sub-competitions within an event (e.g. AI/ML, Open Source, Social Impact).

| Field         | Type     | Required | Default | Notes            |
| :------------ | :------- | :------: | :------ | :--------------- |
| `eventId`     | ObjectId | ✅       | —       | Ref: `Event` · Indexed |
| `name`        | String   | ✅       | —       | Trimmed          |
| `description` | String   | ❌       | `''`    | —                |
| `prizes`      | Array    | ❌       | `[]`    | `{ place, title, value }` |

---

## 5. Team Collection (`teams`)

Groups of participants collaborating on a project submission.

| Field         | Type       | Required | Default         | Notes                    |
| :------------ | :--------- | :------: | :-------------- | :----------------------- |
| `eventId`     | ObjectId   | ✅       | —               | Ref: `Event` · Indexed   |
| `name`        | String     | ✅       | —               | Trimmed                  |
| `description` | String     | ❌       | —               | —                        |
| `inviteCode`  | String     | ✅       | UUID (12 chars) | Unique · Indexed         |
| `leaderId`    | ObjectId   | ✅       | —               | Ref: `User`              |
| `members`     | ObjectId[] | ✅       | `[]`            | Ref: `User` · Indexed    |
| `status`      | String     | ✅       | `'forming'`     | Enum: `forming` `locked` |

**Indexes:** `eventId` · `inviteCode` · `members`

---

## 6. Project Collection (`projects`)

Hackathon submissions linked to a team and event.

| Field            | Type       | Required | Default    | Notes                                        |
| :--------------- | :--------- | :------: | :--------- | :------------------------------------------- |
| `eventId`        | ObjectId   | ✅       | —          | Ref: `Event` · Indexed                       |
| `teamId`         | ObjectId   | ✅       | —          | Ref: `Team` · Indexed                        |
| `title`          | String     | ✅       | —          | Trimmed · Text indexed                       |
| `description`    | String     | ✅       | —          | Text indexed                                 |
| `repoUrl`        | String     | ❌       | —          | GitHub / GitLab link                         |
| `demoUrl`        | String     | ❌       | —          | Live demo URL                                |
| `videoUrl`       | String     | ❌       | —          | YouTube / Vimeo                              |
| `slideUrl`       | String     | ❌       | —          | Slide deck URL                               |
| `coverImageUrl`  | String     | ❌       | —          | Thumbnail image URL                          |
| `trackId`        | ObjectId   | ❌       | —          | Ref: `Track` · Indexed                       |
| `tags`           | String[]   | ❌       | `[]`       | Text indexed                                 |
| `status`         | String     | ✅       | `'draft'`  | Enum: `draft` `submitted` `disqualified`     |
| `submittedAt`    | Date       | ❌       | —          | Set when status → `submitted`                |
| `editHistory`    | Array      | ❌       | `[]`       | `{ editedAt, editedBy, changeDescription }`  |

**Indexes:** `(eventId, status)` · `teamId` · `trackId` · Full-text on `title, description, tags`

---

## 7. Rubric Collection (`rubrics`)

Defines evaluation criteria, weights, and max scores for an event.

| Field         | Type     | Required | Default   | Notes                                       |
| :------------ | :------- | :------: | :-------- | :------------------------------------------ |
| `eventId`     | ObjectId | ✅       | —         | Ref: `Event`                                |
| `name`        | String   | ✅       | —         | —                                           |
| `description` | String   | ❌       | —         | —                                           |
| `criteria`    | Array    | ✅       | `[]`      | `{ name, description, maxScore, weight }`   |
| `totalWeight` | Number   | auto     | computed  | Pre-save hook: sum of all `weight` values   |

---

## 8. JudgeAssignment Collection (`judgeassignments`)

Links judges to specific projects via round-robin distribution.

| Field         | Type     | Required | Default     | Notes                                     |
| :------------ | :------- | :------: | :---------- | :---------------------------------------- |
| `eventId`     | ObjectId | ✅       | —           | Ref: `Event` · Indexed                    |
| `judgeId`     | ObjectId | ✅       | —           | Ref: `User` · Indexed                     |
| `projectId`   | ObjectId | ✅       | —           | Ref: `Project` · Indexed                  |
| `trackId`     | ObjectId | ❌       | —           | Ref: `Track`                              |
| `status`      | String   | ✅       | `'pending'` | Enum: `pending` `in_progress` `completed` |
| `assignedAt`  | Date     | ✅       | `Date.now`  | —                                         |
| `completedAt` | Date     | ❌       | —           | Set when status → `completed`             |

> **Unique Index:** `(judgeId, projectId)` — prevents duplicate assignments

---

## 9. Score Collection (`scores`)

Multi-criteria rubric scores submitted by judges for assigned projects.

| Field            | Type     | Required | Default | Notes                                        |
| :--------------- | :------- | :------: | :------ | :------------------------------------------- |
| `judgeId`        | ObjectId | ✅       | —       | Ref: `User` · Indexed                        |
| `projectId`      | ObjectId | ✅       | —       | Ref: `Project` · Indexed                     |
| `eventId`        | ObjectId | ✅       | —       | Ref: `Event` · Indexed                       |
| `rubricId`       | ObjectId | ✅       | —       | Ref: `Rubric`                                |
| `assignmentId`   | ObjectId | ✅       | —       | Ref: `JudgeAssignment`                       |
| `criteriaScores` | Array    | ✅       | `[]`    | `{ criterionId, rawScore, comment }`         |
| `totalRawScore`  | Number   | ❌       | `0`     | Sum of all raw scores                        |
| `weightedScore`  | Number   | ❌       | `0`     | Sum of `rawScore × weight`                   |
| `normalizedScore`| Number   | ❌       | `0`     | `(weightedScore / maxPossible) × 100`        |
| `zScore`         | Number   | ❌       | —       | Cross-judge Z-Score value                    |
| `finalScore`     | Number   | ❌       | —       | Aggregate score after normalization          |

> **Unique Index:** `(judgeId, projectId)` — one score per judge per project

---

## 10. PairwiseComparison Collection (`pairwisecomparisons`)

Head-to-head project preferences used by the Bradley-Terry ranking algorithm.

| Field        | Type     | Required | Notes                    |
| :----------- | :------- | :------: | :----------------------- |
| `judgeId`    | ObjectId | ✅       | Ref: `User` · Indexed    |
| `eventId`    | ObjectId | ✅       | Ref: `Event` · Indexed   |
| `trackId`    | ObjectId | ❌       | Ref: `Track`             |
| `projectAId` | ObjectId | ✅       | Ref: `Project`           |
| `projectBId` | ObjectId | ✅       | Ref: `Project`           |
| `winnerId`   | ObjectId | ✅       | Must be `projectAId` or `projectBId` |
| `confidence` | Number   | ❌       | Range: 1–5               |

---

## 11. Vote Collection (`votes`)

Public community votes cast on project gallery listings.

| Field       | Type     | Required | Notes                                    |
| :---------- | :------- | :------: | :--------------------------------------- |
| `voterId`   | ObjectId | ✅       | Ref: `User` · Indexed                    |
| `projectId` | ObjectId | ✅       | Ref: `Project` · Indexed                 |
| `eventId`   | ObjectId | ✅       | Ref: `Event` · Indexed                   |
| `ipHash`    | String   | ✅       | `SHA-256(ip + ":" + eventId)` — privacy-preserving |
| `userAgent` | String   | ❌       | —                                        |

> **Unique Index:** `(voterId, projectId)` — one vote per user per project
> **Anti-abuse Index:** `(ipHash, eventId)` — detects network-level stuffing

---

## 12. Comment Collection (`comments`)

Community discussion threads on project pages.

| Field       | Type       | Required | Default | Notes                   |
| :---------- | :--------- | :------: | :------ | :---------------------- |
| `authorId`  | ObjectId   | ✅       | —       | Ref: `User`             |
| `projectId` | ObjectId   | ✅       | —       | Ref: `Project`          |
| `eventId`   | ObjectId   | ✅       | —       | Ref: `Event`            |
| `body`      | String     | ✅       | —       | Max 2,000 characters    |
| `flagCount` | Number     | ❌       | `0`     | Abuse report counter    |
| `flaggedBy` | ObjectId[] | ❌       | `[]`    | Ref: `User` flaggers    |
| `hidden`    | Boolean    | ❌       | `false` | Moderator hide flag     |

**Index:** `(projectId, hidden)`

---

## 13. Certificate Collection (`certificates`)

Cryptographic Ed25519 certificates of accomplishment issued to judges.

| Field            | Type     | Required | Notes                                     |
| :--------------- | :------- | :------: | :---------------------------------------- |
| `judgeId`        | ObjectId | ✅       | Ref: `User` · Indexed                     |
| `eventId`        | ObjectId | ✅       | Ref: `Event` · Indexed                    |
| `recipientName`  | String   | ✅       | Judge's full name                         |
| `eventTitle`     | String   | ✅       | Hackathon event name                      |
| `projectsJudged` | Number   | ✅       | Total projects the judge evaluated        |
| `issuedAt`       | Date     | ✅       | Default: `Date.now`                       |
| `payload`        | String   | ✅       | Canonical JSON string (signed input)      |
| `signature`      | String   | ✅       | 64-byte Ed25519 signature (hex)           |
| `publicKey`      | String   | ✅       | Ed25519 public key (hex)                  |
| `certId`         | String   | ✅       | Short unique ID · Unique · Indexed        |
| `pdfPath`        | String   | ❌       | Optional generated PDF path              |

---

## 14. AuditLog Collection (`auditlogs`)

Immutable ledger of all state-changing operations. Written asynchronously on every mutation.

| Field        | Type     | Required | Notes                               |
| :----------- | :------- | :------: | :---------------------------------- |
| `actorId`    | ObjectId | ❌       | Ref: `User` · Indexed               |
| `actorEmail` | String   | ❌       | Email snapshot at time of action    |
| `action`     | String   | ✅       | e.g. `score.submitted` · Indexed    |
| `resource`   | String   | ✅       | Target entity type (e.g. `Score`)   |
| `resourceId` | String   | ❌       | Target entity `_id`                 |
| `eventId`    | ObjectId | ❌       | Ref: `Event` · Indexed              |
| `payload`    | Mixed    | ❌       | Snapshot of relevant request data   |
| `ip`         | String   | ❌       | Request IP (raw, not hashed)        |
| `userAgent`  | String   | ❌       | Request user-agent string           |

**Indexes:** `(eventId, createdAt DESC)` · `actorId` · `action`

---

## 15. Webhook Collection (`webhooks`)

Configured HTTP endpoints that receive signed event notifications.

| Field       | Type       | Required | Default | Notes                        |
| :---------- | :--------- | :------: | :------ | :--------------------------- |
| `eventId`   | ObjectId   | ✅       | —       | Ref: `Event` · Indexed       |
| `url`       | String     | ✅       | —       | Target POST URL              |
| `events`    | String[]   | ✅       | `[]`    | Subscribed event type keys   |
| `secret`    | String     | ✅       | —       | HMAC-SHA256 signing secret   |
| `active`    | Boolean    | ❌       | `true`  | Toggle on/off                |
| `createdBy` | ObjectId   | ✅       | —       | Ref: `User` organizer        |

**Supported Event Types:** `project.submitted` · `project.updated` · `score.submitted` · `vote.cast` · `judge.assigned` · `event.status_changed` · `results.revealed`

---

## 16. InviteToken Collection (`invitetokens`)

Expiring, multi-use tokens for onboarding judges and organizers to an event.

| Field       | Type     | Required | Default | Notes                                      |
| :---------- | :------- | :------: | :------ | :----------------------------------------- |
| `token`     | String   | ✅       | —       | Random string · Unique · Indexed           |
| `eventId`   | ObjectId | ✅       | —       | Ref: `Event` · Indexed                     |
| `role`      | String   | ✅       | —       | Enum: `judge` `organizer` `participant`    |
| `createdBy` | ObjectId | ✅       | —       | Ref: `User` issuer                         |
| `expiresAt` | Date     | ✅       | —       | Token expiration timestamp                 |
| `maxUses`   | Number   | ❌       | `1`     | Maximum times the token may be redeemed    |
| `useCount`  | Number   | ❌       | `0`     | Current redemption count                   |

**Indexes:** `token` · `(eventId, role)`
