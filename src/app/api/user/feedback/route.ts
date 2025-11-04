import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import { connectDB, User } from '../../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = await requireAuth(request);
    const userId = decoded.uid;
    
    // Connect to database
    await connectDB();
    
    // Get request body
    const body = await request.json();
    const {
      generatedContent,
      userEdit,
      satisfaction,
      platform,
      contentType
    } = body;
    
    if (!generatedContent || satisfaction === undefined) {
      return NextResponse.json(
        { success: false, error: 'Generated content and satisfaction rating are required' },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Add feedback to user preferences
    const feedbackEntry = {
      generatedContent,
      userEdit: userEdit || '',
      satisfaction: Number(satisfaction),
      platform: platform || 'unknown',
      contentType: contentType || 'post',
      timestamp: new Date()
    };
    
    if (!user.preferences) {
      user.preferences = {
        feedbackData: [],
        styleConsistencyScore: 0
      };
    }
    
    user.preferences.feedbackData.push(feedbackEntry);
    
    // Keep only last 50 feedback entries to prevent database bloat
    if (user.preferences.feedbackData.length > 50) {
      user.preferences.feedbackData = user.preferences.feedbackData.slice(-50);
    }
    
    // Calculate style consistency score based on recent feedback
    const recentFeedback = user.preferences.feedbackData.slice(-10); // Last 10 feedbacks
    const averageSatisfaction = recentFeedback.reduce((sum: number, fb: any) => sum + fb.satisfaction, 0) / recentFeedback.length;
    user.preferences.styleConsistencyScore = Math.round(averageSatisfaction * 20); // Convert 1-5 scale to 0-100
    
    // Analyze patterns in user edits to improve future generations
    if (userEdit && userEdit !== generatedContent) {
      await analyzeUserEdits(user, generatedContent, userEdit, platform);
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      data: {
        feedbackRecorded: true,
        styleConsistencyScore: user.preferences.styleConsistencyScore,
        totalFeedbacks: user.preferences.feedbackData.length
      },
      message: 'Feedback recorded successfully'
    });
    
  } catch (error) {
    console.error('Error recording user feedback:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function analyzeUserEdits(user: any, originalContent: string, userEdit: string, platform: string) {
  // Simple pattern analysis - in a production system, this could use AI to detect patterns
  const patterns = {
    lengthPreference: userEdit.length / originalContent.length,
    addedHashtags: (userEdit.match(/#/g) || []).length - (originalContent.match(/#/g) || []).length,
    addedEmojis: (userEdit.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu) || []).length - 
                 (originalContent.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu) || []).length,
    formalityChange: detectFormalityChange(originalContent, userEdit),
    addedQuestions: (userEdit.match(/\?/g) || []).length - (originalContent.match(/\?/g) || []).length
  };
  
  // Update platform-specific preferences based on patterns
  if (!user.platformStyles[platform]) {
    user.platformStyles[platform] = {};
  }
  
  // Adjust hashtag style based on user behavior
  if (patterns.addedHashtags > 2) {
    user.platformStyles[platform].hashtagStyle = 'heavy';
  } else if (patterns.addedHashtags < -1) {
    user.platformStyles[platform].hashtagStyle = 'minimal';
  }
  
  // Adjust tone based on formality changes
  if (patterns.formalityChange === 'more_casual') {
    if (user.writingStyle.formalityLevel === 'formal') {
      user.writingStyle.formalityLevel = 'semi-formal';
    } else if (user.writingStyle.formalityLevel === 'semi-formal') {
      user.writingStyle.formalityLevel = 'casual';
    }
  } else if (patterns.formalityChange === 'more_formal') {
    if (user.writingStyle.formalityLevel === 'casual') {
      user.writingStyle.formalityLevel = 'semi-formal';
    } else if (user.writingStyle.formalityLevel === 'semi-formal') {
      user.writingStyle.formalityLevel = 'formal';
    }
  }
  
  // Learn preferred content formats
  if (patterns.addedQuestions > 0) {
    if (!user.contentPreferences.preferredFormats.includes('questions')) {
      user.contentPreferences.preferredFormats.push('questions');
    }
  }
}

function detectFormalityChange(original: string, edited: string): string {
  const casualWords = ['hey', 'awesome', 'cool', 'super', 'really', 'totally', 'wow'];
  const formalWords = ['therefore', 'furthermore', 'however', 'consequently', 'accordingly'];
  
  const originalCasual = casualWords.filter(word => original.toLowerCase().includes(word)).length;
  const editedCasual = casualWords.filter(word => edited.toLowerCase().includes(word)).length;
  
  const originalFormal = formalWords.filter(word => original.toLowerCase().includes(word)).length;
  const editedFormal = formalWords.filter(word => edited.toLowerCase().includes(word)).length;
  
  const casualityChange = editedCasual - originalCasual;
  const formalityChange = editedFormal - originalFormal;
  
  if (casualityChange > formalityChange) return 'more_casual';
  if (formalityChange > casualityChange) return 'more_formal';
  return 'no_change';
}