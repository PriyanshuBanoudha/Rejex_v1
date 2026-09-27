# Judging & Scoring Engine

> **Hackathon Raptors Platform** — Mathematical foundations for fair, bias-free project evaluation.

---

## Table of Contents

1. [Weighted Rubric Scoring](#1-weighted-rubric-scoring)
2. [Cross-Judge Z-Score Normalization](#2-cross-judge-z-score-normalization)
3. [Bradley-Terry Pairwise Ranking](#3-bradley-terry-pairwise-ranking)
4. [Round-Robin Workload Assignment](#4-round-robin-workload-assignment)
5. [Ed25519 Cryptographic Certificates](#5-ed25519-cryptographic-certificates)

---

## 1. Weighted Rubric Scoring

Each event configures a rubric with N criteria. Every criterion `i` has:
- `maxScore_i` — the maximum raw score (e.g. 10)
- `weight_i` — a decimal importance multiplier (e.g. 2.5)

### Formulas

**Weighted Score:**
```
WeightedScore = Σᵢ ( rawScore_i × weight_i )
```

**Max Possible Score:**
```
MaxPossible = Σᵢ ( maxScore_i × weight_i )
```

**Normalized Score (0–100):**
```
S_jk = ( WeightedScore / MaxPossible ) × 100
```

### Example

| Criterion   | Raw | Max | Weight | Weighted |
| :---------- | ---: | ---: | ------: | -------: |
| Innovation  | 8   | 10  | 2.0    | 16.0     |
| Execution   | 7   | 10  | 2.5    | 17.5     |
| Presentation| 9   | 10  | 1.5    | 13.5     |
| **Total**   |     |     | **6.0**| **47.0** |

→ `MaxPossible = (10×2.0) + (10×2.5) + (10×1.5) = 60`
→ `NormalizedScore = (47 / 60) × 100 = 78.3`

---

## 2. Cross-Judge Z-Score Normalization

### Why It's Needed

Judges have different natural scoring tendencies:

| Judge Type         | Behavior                          | Effect Without Normalization        |
| :----------------- | :-------------------------------- | :---------------------------------- |
| Lenient Judge      | Consistently awards 9s and 10s    | Inflates scores for their projects  |
| Harsh Judge        | Consistently awards 4s and 6s     | Unfairly penalizes their projects   |
| Low-Variance Judge | Gives almost every project a 7    | Provides little ranking signal      |

Z-Score normalization cancels out each judge's personal bias by standardizing their scores relative to their own mean and spread.

---

### Algorithm (Step by Step)

**Step 1 — Per-Judge Mean:**
```
μⱼ = (1 / Kⱼ) × Σₖ Sⱼₖ
```

**Step 2 — Per-Judge Standard Deviation:**
```
σⱼ = sqrt( (1 / Kⱼ) × Σₖ (Sⱼₖ − μⱼ)² )
```

**Step 3 — Z-Score:**
```
zⱼₖ = (Sⱼₖ − μⱼ) / σⱼ     if σⱼ > 0
zⱼₖ = 0                     if σⱼ = 0
```

**Step 4 — Rescale to 0–100:**
```
Nⱼₖ = Clamp( 50 + 15 × zⱼₖ ,  0 ,  100 )
```

**Step 5 — Final Project Score (average across M judges):**
```
FinalScore(P) = (1 / M) × Σₘ Nₘₚ
```

---

### Worked Example

Setup — two judges evaluating the same pool of projects:

| Judge | Scores Assigned       | Mean (μ) | Std Dev (σ) |
| :---- | :-------------------- | :------: | :---------: |
| A (Harsh)   | 60, 70, 50     | 60       | 8.16        |
| B (Lenient) | 90, 95, 85     | 90       | 4.08        |

Now compare **Project X** (scored by Judge A, `S = 70`) vs **Project Y** (scored by Judge B, `S = 85`):

| | Raw Score | Z-Score Calculation | Z-Score | Normalized Score |
| :--- | :---: | :--- | :---: | :---: |
| Project X (Judge A) | 70 | (70 − 60) / 8.16 | **+1.225** | **68.4** |
| Project Y (Judge B) | 85 | (85 − 90) / 4.08 | **−1.225** | **31.6** |

> **Result:** Despite having a lower raw score, Project X is ranked **higher** after normalization — correctly reflecting that it outperformed its harsh judge's baseline, while Project Y underperformed its lenient judge's baseline.

---

## 3. Bradley-Terry Pairwise Ranking

Judges can perform fast head-to-head comparisons instead of (or alongside) rubric scoring. The **Bradley-Terry Model** estimates a latent skill parameter `γᵢ` for each project.

### Probability Model

The probability that Project A beats Project B is:
```
P(A beats B) = γ_A / (γ_A + γ_B)
```

### MM Iterative Update

At each iteration `t+1`:
```
γᵢ(t+1) = wᵢ / Σⱼ≠ᵢ [ nᵢⱼ / (γᵢ(t) + γⱼ(t)) ]
```

Where:
- `wᵢ` = total wins by Project i
- `nᵢⱼ` = total comparisons between Project i and Project j

### Convergence

Iterates until one of:
- `max|γᵢ(t+1) − γᵢ(t)| < 0.00001`
- 100 iterations completed

Projects are then ranked by their final `γᵢ` value (higher = stronger).

---

## 4. Round-Robin Workload Assignment

Ensures every judge gets an equal number of projects, with no conflicts of interest.

| Step | Action |
| :--- | :----- |
| 1    | Sort judges by current assignment count (ascending) |
| 2    | For each project, pick the least-loaded judge |
| 3    | Skip any judge who is a member of that project's team |
| 4    | Unique index `(judgeId, projectId)` prevents duplicate assignments |

---

## 5. Ed25519 Cryptographic Certificates

Upon event completion, organizers can issue tamper-proof digital certificates of accomplishment to judges.

### How It Works

```
1. Organizer triggers certificate generation for an event

2. System builds a canonical JSON payload per judge:
   {
     "certId":        "CERT-9A82B3",
     "judgeName":     "Jane Doe",
     "eventTitle":    "Hackathon Raptors 2026",
     "projectsJudged": 8,
     "issuedAt":      "2026-09-27T09:00:00.000Z"
   }

3. 64-byte Ed25519 signature computed:
   signature = crypto.sign(null, payloadBuffer, privateKey)

4. Certificate stored: { certId, payload, signature, publicKey }

5. Public verification via:
   GET /api/certs/verify/:certId
   → crypto.verify(null, payload, publicKey, signature)
   → { valid: true, certificate: { ... } }
```

### Properties

| Property | Value |
| :--- | :--- |
| Algorithm | Ed25519 (asymmetric) |
| Signature size | 64 bytes |
| Verification | Public endpoint, no auth required |
| Tamper detection | Any payload modification invalidates the signature |
| Embed support | `GET /api/certs/embed/:eventId` returns HTMLbadge widget |
