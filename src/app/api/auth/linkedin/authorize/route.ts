import { NextRequest, NextResponse } from 'next/server';
import { linkedInService } from '../../../../../../lib/linkedin';

export async function GET(request: NextRequest) {
  try {
    // Generate the LinkedIn authorization URL
    const authUrl = linkedInService.getAuthorizationUrl();
    
    // Redirect the user to LinkedIn for authorization
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}