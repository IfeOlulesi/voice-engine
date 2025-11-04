# PostVibe Phase 1 - Core Content Repurposing

Phase 1 implements the core content repurposing flow: Pull → Repurpose → Store with a full UI.

## Features Implemented ✅

- **LinkedIn Content Pull**: Mock LinkedIn post fetching (ready for real API integration)
- **LLM Repurposing**: OpenAI GPT-4o-mini generates content for X, Instagram, Facebook
- **Database Storage**: MongoDB with Mongoose for storing original posts and variants
- **Firebase Auth**: Secure API endpoints with Firebase ID token verification
- **Scheduling Logic**: Calculates next Tue/Fri posting times (8:30 AM X/IG, 7 PM FB WAT)
- **Web Dashboard**: Complete UI with authentication and testing forms
- **Visual Results**: Real-time display of generated content variants

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

**Server-side (API authentication):**
- `MONGODB_URI`: MongoDB Atlas connection string
- `OPENAI_API_KEY`: OpenAI API key for GPT-4o-mini
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `FIREBASE_PRIVATE_KEY`: Firebase private key (include quotes and newlines)
- `FIREBASE_USER_UID`: Your authorized user UID

**Client-side (Web dashboard):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase web API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: your-project.firebaseapp.com
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: your-project.firebasestorage.app
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID

### 2. Install Dependencies
Dependencies are already installed. If needed:
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application
- **Home page**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard

## Usage

### Web Dashboard
1. Navigate to http://localhost:3000
2. Click "Open Dashboard" 
3. Sign in with your Firebase email/password
4. Use the two testing panels:
   - **Manual Repurpose**: Test content repurposing with custom text
   - **LinkedIn Pull**: Simulate the full LinkedIn → repurpose → store workflow

### Visual Feedback
The dashboard shows:
- Real-time repurposing results
- X (Twitter) thread breakdown
- Instagram carousel slides
- Facebook post and poll content
- Scheduling timestamps
- Database storage confirmation

## API Endpoints

### POST /api/repurpose
Manual content repurposing for testing.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Your LinkedIn post text here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "Original text",
    "variants": {
      "x": {
        "thread": ["Tweet 1", "Tweet 2", "Tweet 3"]
      },
      "ig": {
        "carousel": ["Slide 1", "Slide 2", "Slide 3"]
      },
      "fb": {
        "post": "Facebook post text",
        "poll": "Poll question"
      }
    }
  }
}
```

### GET /api/pull-linkedin
Simulates LinkedIn post pull → repurpose → store workflow.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "postId": "mongodb-document-id",
    "original": {
      "id": "linkedin-post-id",
      "text": "Post content",
      "timestamp": "ISO-date"
    },
    "variants": { /* repurposed content */ },
    "scheduledAt": ["2025-10-22T07:30:00.000Z", "2025-10-25T18:00:00.000Z"],
    "status": "queued"
  }
}
```

## Testing

### Quick Test
```bash
node test-endpoints.js
```

### Manual Testing with cURL
1. Get Firebase ID token from your Firebase console
2. Test repurpose endpoint:
```bash
curl -X POST http://localhost:3000/api/repurpose \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Your test LinkedIn post content here"}'
```

3. Test pull endpoint:
```bash
curl -X GET http://localhost:3000/api/pull-linkedin \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

## Project Structure

```
├── lib/
│   ├── auth.ts              # Firebase Auth middleware
│   ├── db.ts                # MongoDB connection & Post schema
│   ├── firebase-client.ts   # Firebase client config
│   ├── openai.ts            # LLM repurposing service
│   └── types.ts             # Global type declarations
├── src/app/
│   ├── dashboard/
│   │   └── page.tsx         # Main dashboard UI
│   ├── page.tsx             # Landing page
│   └── api/
│       ├── pull-linkedin/
│       │   └── route.ts     # LinkedIn pull → repurpose → store
│       └── repurpose/
│           └── route.ts     # Manual repurposing endpoint
├── .env.example             # Environment variables template
├── test-endpoints.js        # Simple test script
└── README-Phase1.md         # This file
```

## Next Steps (Phase 2)

- Real LinkedIn API integration
- Platform posting (X, Instagram, Facebook APIs)
- GCP Cloud Scheduler for automated posting
- Error handling and retry logic
- Basic dashboard for viewing posts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB with Mongoose
- **Auth**: Firebase Admin SDK
- **LLM**: OpenAI GPT-4o-mini
- **Validation**: Zod
- **Language**: TypeScript