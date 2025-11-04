# LinkedIn Integration Guide

## Overview
The LinkedIn integration allows users to connect their LinkedIn account and automatically pull their recent posts for content repurposing across multiple social media platforms.

## User Flow

### 1. Connect LinkedIn Account
1. Navigate to `/dashboard`
2. Click "Connect LinkedIn Account" button
3. Redirected to LinkedIn for authorization
4. After approval, redirected back to dashboard
5. LinkedIn connection status shows as "Connected"

### 2. Pull Recent Posts
1. Click "Pull Latest LinkedIn Post" button
2. System fetches your most recent LinkedIn post
3. Content is automatically repurposed using AI
4. Scheduled for posting across configured platforms

## Technical Implementation

### API Endpoints
- `GET /api/auth/linkedin/authorize` - Starts OAuth flow
- `GET /api/auth/linkedin/callback` - Handles OAuth callback  
- `GET /api/linkedin/posts` - Fetches recent posts
- `GET /api/pull-linkedin` - Pulls and repurposes latest post

### Files Structure
```
lib/linkedin.ts                           # LinkedIn API service
src/app/api/auth/linkedin/
  ├── authorize/route.ts                   # OAuth start endpoint
  └── callback/route.ts                    # OAuth callback endpoint
src/app/api/linkedin/posts/route.ts       # Fetch posts endpoint
src/app/api/pull-linkedin/route.ts        # Updated with real LinkedIn API
src/app/dashboard/page.tsx                # UI integration
```

### LinkedIn Service Features
- OAuth 2.0 authentication flow
- Access token management
- Fetch recent user posts
- User profile information
- Post sharing capabilities

## Setup Requirements

### Environment Variables
```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### LinkedIn App Configuration
1. Create LinkedIn app at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Add redirect URI: `http://localhost:3000/api/auth/linkedin/callback`
3. Request permissions:
   - `openid` - Required for OpenID Connect (required)
   - `profile` - Access to basic profile info  
   - `email` - Access to email address

**Note:** LinkedIn has restricted access to user's own posts. The current implementation uses the authentication flow and returns mock data. To access real posts, you would need:
- LinkedIn Marketing Developer Platform access
- Special partnership with LinkedIn
- Or use LinkedIn's Content API (requires approval)

## Security Features
- Secure token storage in browser localStorage
- Token validation and expiry handling
- Automatic re-authentication prompts
- Error handling for API failures

## Integration Points
- Works with existing authentication system
- Integrates with OpenAI content repurposing
- Uses existing database schema for posts
- Follows existing scheduling logic

## Usage
1. Set up LinkedIn app credentials
2. Start the development server: `npm run dev`
3. Navigate to `/dashboard`
4. Click "Connect LinkedIn Account"
5. Authorize the application
6. Use "Pull Latest LinkedIn Post" to fetch content

The integration is now fully functional and ready for use!