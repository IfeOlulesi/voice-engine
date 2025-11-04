import axios from 'axios';

interface LinkedInPost {
  id: string;
  text: string;
  timestamp: string;
  authorName: string;
  authorId: string;
}

export class LinkedInService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken?: string;

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID!;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    this.redirectUri = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/auth/linkedin/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('LinkedIn credentials not found in environment variables');
    }
  }

  getAuthorizationUrl(): string {
    const scopes = ['openid', 'profile', 'email'];
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: Math.random().toString(36).substring(7),
      scope: scopes.join(' ')
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.accessToken = response.data.access_token;
      return this.accessToken!;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  async getUserProfile(): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    try {
      const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'cache-control': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw new Error('Failed to fetch user profile');
    }
  }

  async getRecentPosts(_limit: number = 10): Promise<LinkedInPost[]> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    try {
      // Note: LinkedIn's current API has limited access to user's own posts
      // This is a simplified implementation that would work with proper permissions
      console.warn('LinkedIn API access to user posts requires special permissions. Using mock data for now.');
      
      // Get user profile for mock data
      const profile = await this.getUserProfile();
      
      // Return mock post data based on user profile
      const mockPost: LinkedInPost = {
        id: `linkedin-${Date.now()}`,
        text: "This is a sample LinkedIn post. In a production environment, this would be fetched from LinkedIn's API with proper permissions and API access.",
        timestamp: new Date().toISOString(),
        authorName: profile.name || profile.given_name + ' ' + profile.family_name || 'LinkedIn User',
        authorId: profile.sub || profile.id || 'unknown'
      };

      return [mockPost];
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw new Error('Failed to fetch recent posts from LinkedIn');
    }
  }

  async sharePost(text: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    try {
      const profile = await this.getUserProfile();
      const personUrn = `urn:li:person:${profile.id}`;

      const shareData = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', shareData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw new Error('Failed to share post on LinkedIn');
    }
  }
}

export const linkedInService = new LinkedInService();