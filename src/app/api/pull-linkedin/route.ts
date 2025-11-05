import { NextRequest, NextResponse } from 'next/server';
import { linkedInService } from '../../../../lib/linkedin';

export async function GET(request: NextRequest) {
  try {
    // Get LinkedIn access token from query params or headers
    const url = new URL(request.url);
    const accessToken = url.searchParams.get('access_token') || request.headers.get('authorization')?.replace('Bearer ', '');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn access token required' },
        { status: 401 }
      );
    }
    
    // Set the access token for the LinkedIn service
    linkedInService.getInstance().setAccessToken(accessToken);
    
    // Fetch recent posts from LinkedIn
    const linkedInPosts = await linkedInService.getInstance().getRecentPosts(limit);
    
    if (linkedInPosts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recent posts found on LinkedIn' },
        { status: 404 }
      );
    }
    
    console.log('Fetched LinkedIn posts:', linkedInPosts);
    
    return NextResponse.json({
      success: true,
      data: {
        posts: linkedInPosts,
        count: linkedInPosts.length
      }
    });
    
  } catch (error) {
    console.error('Error in pull-linkedin endpoint:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}