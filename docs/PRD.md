# PostVibe: Updated Product Requirements Document (PRD) & Implementation Guide

**Version**: 1.1  
**Date**: October 16, 2025  
**Author**: Grok (for Ife Olulesi)  
**Changes in v1.1**: Updated stack per your specs—DB to MongoDB (with Mongoose for schema), added Firebase Auth for API protection (solo-user focus: simple token verification), deployment refined to GCP Cloud Run. Core features unchanged; auth adds ~50 LOC for security. Total scope: ~500 LOC in Next.js. Phases adjusted minimally.

**Purpose**: Comprehensive blueprint for PostVibe MVP. Pass to AI coder (e.g., Claude): "Using this updated PRD v1.1, implement Phase 1 in Next.js with MongoDB & Firebase Auth. Output full code files."


---

## 1. Product Overview

### 1.1 Problem Statement
As an AI software engineer with a Tue/Fri LinkedIn posting rhythm (15 mins/week), I need to automate repurposing and cross-posting to X, Instagram, and Facebook without extra time. Current pain: Manual adaptation kills efficiency. PostVibe solves this by treating LinkedIn as the "source of truth," using LLMs for smart variants, and scheduling posts at Lagos peaks (WAT: 8 AM/7 PM Tue/Fri).

### 1.2 Goals & Success Metrics
- **Primary**: End-to-end automation: 1 LinkedIn post → 3 variants → Scheduled posts on target platforms.
- **MVP Metrics**: 
  - 100% success rate on test pulls/repurposes/posts (manual trigger).
  - Zero manual intervention post-setup.
  - Deployable to GCP Cloud Run (free tier).
- **Non-Goals**: Multi-user support, advanced analytics, video handling, or ad creation (future phases). Auth is solo-only (protects APIs from public access).

### 1.3 Target User
- Solo: Me (Ife Olu Lesi, @learnaiwithife).
- Brand: "Learn AI with Ife" – Inspirational tech/AI content (hooks, tips, CTAs, subtle faith elements).

### 1.4 Key Assumptions
- API approvals obtained (LinkedIn Share, X v2 Free, FB/IG Graph).
- LLM: OpenAI gpt-4o-mini (your key provided).
- No real-time webhooks initially—use manual/cron triggers.
- Data privacy: Store minimally (48h max), no exports. Firebase Auth for dev/prod security.

---

## 2. Features & Requirements

Prioritize lean: Only core loop. Use tables for specs.

### 2.1 Core Workflow
1. **Trigger**: Manual (GET /api/pull, auth-required) or cron (Tue/Fri 8 AM WAT) detects new LinkedIn post.
2. **Pull**: Fetch latest post text (assume single recent; expand later).
3. **Repurpose**: LLM generates variants; store in DB.
4. **Schedule**: Queue with timestamps; cron checks/posts when due.
5. **Post**: Fire to platforms; log status.

### 2.2 Feature Breakdown

| Feature | Description | Inputs | Outputs | Priority | Est. LOC |
|---------|-------------|--------|---------|----------|----------|
| **LinkedIn Pull** | Fetch latest own post via API (or RSS fallback). Auth check first. | None (auth via Firebase token). | Post object: {id, text, timestamp}. | MVP | 50 |
| **LLM Repurpose** | Prompt LLM for 3 variants in JSON. Keep tone: Inspirational tech (200-400 words originals → short bites). | Post text. | Variants JSON: {x: {thread: [tweet1, tweet2, tweet3]}, ig: {carousel: [slide1, slide2, slide3]}, fb: {post: string, poll: string}}. | MVP | 60 |
| **DB Storage** | Save original + variants + schedule (Tue/Fri slots: 8:30 AM X/IG, 7 PM FB). Status: queued/posted/failed. | JSON from above. | DB doc. | MVP | 40 (Mongoose) |
| **Scheduling** | GCP Cloud Scheduler: Check due posts → Trigger post. | DB query. | HTTP to /api/post-now. | MVP | 30 |
| **Multi-Platform Post** | POST variants: X thread (multi-tweet), IG carousel (multi-media call), FB post+poll. Handle errors (retry 1x). Auth required. | Variants JSON. | Platform confirmations; update DB status. | MVP+ | 150 |
| **Basic Dashboard** | Simple GET /api/posts → React table list (queued/posted). Firebase Auth guard. | None. | JSON for table render. | Polish | 100 |

### 2.3 Non-Functional Requirements
- **Performance**: <5s per API call; handle 2 posts/week.
- **Security**: Firebase Auth middleware for all APIs (verify ID token; solo user: your Firebase UID). Env vars for all keys/tokens.
- **Error Handling**: Console logs + DB status. Retry logic for APIs.
- **Testing**: Unit tests for repurpose/post (Jest). E2E manual via Postman (with auth header).
- **Compliance**: Rate limits (e.g., X: 50 posts/day). Data TTL: 48h delete cron.

---

## 3. Technical Architecture

### 3.1 Stack
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Next.js 14 (App Router) | Serverless APIs; GCP native. |
| **DB** | MongoDB (Mongoose ODM) | Flexible schema; free Atlas tier for MVP. |
| **Auth** | Firebase Auth (Admin SDK) | Easy token verification; integrates with GCP. Solo: One user (your email). |
| **LLM** | OpenAI SDK (gpt-4o-mini) | Cheap ($0.01/post); JSON mode for parsing. |
| **APIs** | - LinkedIn: linkedin-api-client<br>- X: twitter-api-v2<br>- FB/IG: fb-graph-api | Official SDKs; OAuth in env. |
| **Scheduling** | GCP Cloud Scheduler (free tier) | Cron jobs: Tue/Fri patterns; targets Cloud Run HTTP. |
| **Deploy** | Dockerfile → GCP Cloud Run | Serverless $0; multi-region. Firebase integrates seamlessly. |
| **Other** | Mongoose, Zod (validation), Firebase Admin SDK. | Lean deps. |

### 3.2 Data Model (Mongoose Schema)
```js
const postSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId() },
  original: { type: Object }, // {text, timestamp}
  variants: { type: Object }, // {x, ig, fb}
  scheduledAt: { type: [Date] }, // Array of timestamps
  status: { type: String, enum: ['queued', 'posted', 'failed'], default: 'queued' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
postSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });
const Post = mongoose.model('Post', postSchema);
```
Connect: `mongoose.connect(process.env.MONGODB_URI)`.

### 3.3 API Endpoints
All protected by Firebase Auth middleware (verifyIdToken → allow if matches your UID).
- `GET /api/pull-linkedin`: → Call LinkedIn → Repurpose → Store.
- `POST /api/repurpose`: Manual test (body: {text}).
- `GET /api/posts`: List for dashboard.
- `POST /api/post-now`: Cron target (body: {postId}; cron bypasses auth via service account).

### 3.4 LLM Prompt Template
```
You are a content repurposer for "Learn AI with Ife" – inspirational AI/tech posts. From this LinkedIn text: [ORIGINAL_TEXT]. Generate JSON only:

{
  "x": {
    "thread": ["Tweet 1: Hook + #AIEngineer", "Tweet 2: Tip", "Tweet 3: CTA question"]
  },
  "ig": {
    "carousel": ["Slide 1: Quote graphic text", "Slide 2: Tip", "Slide 3: Call to action"]
  },
  "fb": {
    "post": "Adapted text for discussion",
    "poll": "Question for engagement?"
  }
}

Keep concise, engaging, tone: Professional yet motivational. Max 280 chars/tweet/slide.
```

### 3.5 Auth Middleware Example
```js
// lib/auth.ts
import { getAuth } from 'firebase-admin/auth';

export async function verifyToken(token: string) {
  try {
    const decoded = await getAuth().verifyIdToken(token);
    if (decoded.uid !== process.env.FIREBASE_USER_UID) throw new Error('Unauthorized');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// In API route: const token = headers().authorization?.split(' ')[1]; await verifyToken(token);
```

---

## 4. Implementation Guide (Phased for AI Assistant)

Build sequentially. Prompt your AI: "Implement [Phase] using PRD v1.1. Output: Full code files (e.g., app/api/pull-linkedin/route.ts), package.json updates, and setup commands. Use TypeScript. Include MongoDB connect & Firebase init."

### Phase 1: Core Loop (Pull + Repurpose + DB) – ~160 LOC
1. Init: `npx create-next-app@latest postvibe --typescript --app`. Add deps: `npm i openai mongoose twitter-api-v2 linkedin-api-client fb-graph-api zod firebase-admin`.
2. Setup: Firebase project (enable Auth); env: MONGODB_URI, OPENAI_API_KEY, FIREBASE keys, your UID.
3. Mongo: Schema + connect in /lib/db.ts.
4. `/api/pull-linkedin/route.ts`: Auth middleware → Fetch (mock if no key) → LLM → Parse/store.
5. Test: `curl -H "Authorization: Bearer [token]" localhost:3000/api/pull-linkedin` → Check Mongo.

### Phase 2: Scheduling + Posting – ~210 LOC
1. SDK setups: Clients in `/lib/clients.ts` (env auth).
2. `/api/post-now/route.ts`: Query due posts → Post variants (e.g., X: client.v2.tweetThread(variants.x.thread)). Auth optional for cron (use service account).
3. Scheduler: GCP console → New job targeting Cloud Run URL (e.g., Tue/Fri 8AM UTC+1).
4. Error: Try-catch, update status.
5. Test: Manual POST with postId + token.

### Phase 3: Polish (Dashboard) – ~110 LOC
1. `/app/dashboard/page.tsx`: GET /api/posts (auth) → Simple table (use shadcn/ui if added).
2. Deploy prep: Dockerfile, env vars (Firebase service account JSON as secret).

### Phase 4: Deploy & Test
- Local: `npm run dev` (init Firebase Admin: `admin.initializeApp({credential: cert(serviceAccount)})`).
- GCP: `gcloud run deploy` (mount secrets for keys; connect Mongo Atlas).
- E2E: Dummy post → Verify live tweets/etc. Auth: Sign in via Firebase console.

---

## 5. Risks & Mitigations
- **API Approvals**: Pre-apply; fallback to manual input.
- **Rate Limits**: Hardcode sleeps (e.g., 1s between calls).
- **LLM Parsing**: Use structured output; fallback to regex.
- **Auth Overhead**: Solo UID check keeps it light; test token expiry.
- **Costs**: Monitor LLM tokens (<$0.05/week); Mongo Atlas free M0 cluster.

## 6. Future Roadmap (Post-MVP)
- Alerts (Slack on fail).
- Ad integration (LinkedIn Ads API).
- RSS for LinkedIn pull.

*(Canvas Footer: Edits auto-save. Export: Copy Markdown. Questions? Reply here—e.g., "Add video support?")*