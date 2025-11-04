import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import { connectDB, User } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = await requireAuth(request);
    const userId = decoded.uid;
    
    // Connect to database
    await connectDB();
    
    // Find user profile
    let user = await User.findOne({ userId });
    
    if (!user) {
      // Create new user profile if it doesn't exist
      user = new User({
        userId: userId,
        email: decoded.email || '',
        name: decoded.name || '',
        writingStyle: {
          tone: 'professional',
          personality: 'calm',
          formalityLevel: 'semi-formal',
          humorStyle: 'subtle'
        },
        brandVoice: {
          adjectives: [],
          values: [],
          targetAudience: '',
          industry: '',
          brandType: 'personal'
        },
        contentPreferences: {
          topics: [],
          contentPillars: [],
          preferredFormats: [],
          avoidTopics: []
        },
        platformStyles: {
          linkedin: {},
          twitter: {},
          instagram: {},
          facebook: {}
        },
        sampleContent: {
          originalPosts: [],
          analyzedPatterns: {}
        },
        preferences: {
          feedbackData: [],
          styleConsistencyScore: 0
        }
      });
      await user.save();
    } else {
      // Fix any invalid enum values in existing users
      if (user.writingStyle && user.writingStyle.personality === 'professional') {
        user.writingStyle.personality = 'calm';
        await user.save();
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        profile: user,
        profileCompletion: user.calculateProfileCompletion()
      }
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = await requireAuth(request);
    const userId = decoded.uid;
    
    // Connect to database
    await connectDB();
    
    // Get request body
    const body = await request.json();
    const {
      name,
      writingStyle,
      brandVoice,
      contentPreferences,
      platformStyles,
      sampleContent
    } = body;
    
    // Find and update user profile
    let user = await User.findOne({ userId });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        userId: userId,
        email: decoded.email || '',
        name: name || decoded.name || ''
      });
    }
    
    // Update profile fields
    if (name) user.name = name;
    if (writingStyle) {
      user.writingStyle = { ...user.writingStyle, ...writingStyle };
    }
    if (brandVoice) {
      user.brandVoice = { ...user.brandVoice, ...brandVoice };
    }
    if (contentPreferences) {
      user.contentPreferences = { ...user.contentPreferences, ...contentPreferences };
    }
    if (platformStyles) {
      user.platformStyles = { ...user.platformStyles, ...platformStyles };
    }
    if (sampleContent) {
      user.sampleContent = { ...user.sampleContent, ...sampleContent };
    }
    
    // Calculate and update profile completion
    const completion = user.calculateProfileCompletion();
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      data: {
        profile: user,
        profileCompletion: completion,
        onboardingCompleted: user.onboardingCompleted
      },
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}