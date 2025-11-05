import { NextRequest, NextResponse } from 'next/server';
import { linkedInService } from '../../../../../../lib/linkedin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn authorization failed', details: error },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    // Exchange the authorization code for an access token
    const accessToken = await linkedInService.getInstance().exchangeCodeForToken(code);

    // Set the access token in the service
    linkedInService.getInstance().setAccessToken(accessToken);

    // Get user profile to verify the token works
    const profile = await linkedInService.getInstance().getUserProfile();

    // Redirect back to dashboard with access token and profile data
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('access_token', accessToken);
    dashboardUrl.searchParams.set('profile', encodeURIComponent(JSON.stringify(profile)));
    dashboardUrl.searchParams.set('linkedin_connected', 'true');
    
    return NextResponse.redirect(dashboardUrl.toString());

  } catch (error) {
    console.error('Error in LinkedIn OAuth callback:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}