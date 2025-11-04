import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import { connectDB, User } from '../../../../../lib/db';
import { MultimodalAgent, MultimodalInput } from '../../../../../lib/ai/agents/multimodal-agent';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = await requireAuth(request);
    const userId = decoded.uid;
    
    // Connect to database
    await connectDB();
    
    // Get request body
    const body = await request.json();
    const { samplePosts } = body;
    
    if (!samplePosts || !Array.isArray(samplePosts) || samplePosts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sample posts are required for analysis' },
        { status: 400 }
      );
    }
    
    // Analyze writing style using the existing AI agent
    const systemPrompt = "You are an expert content strategist and writing style analyst. Analyze social media posts to identify unique writing patterns, voice, and style characteristics. You must respond with ONLY valid JSON, no markdown formatting, no code blocks, no other text.";
    
    const analysisPrompt = `Analyze the following social media posts to identify the author's writing style, tone, and patterns. 

Return ONLY a valid JSON object with this exact structure (NO markdown, NO code blocks, NO backticks):

{
  "tone": "professional|casual|friendly|authoritative|conversational|humorous",
  "personality": "enthusiastic|calm|witty|inspiring|analytical|storyteller",
  "formalityLevel": "very-formal|formal|semi-formal|casual|very-casual", 
  "humorStyle": "none|subtle|witty|playful|sarcastic",
  "vocabularyLevel": "simple|intermediate|advanced|expert",
  "averageLength": 150,
  "commonPhrases": ["example phrase"],
  "sentenceStructure": "description of typical sentence patterns",
  "contentThemes": ["theme1", "theme2"],
  "styleNotes": "additional observations about writing style",
  "brandAdjectives": ["adjective1", "adjective2"],
  "recommendedImprovements": ["suggestion1", "suggestion2"]
}

Posts to analyze:
${samplePosts.map((post, index) => `\n${index + 1}. ${post}`).join('')}

IMPORTANT: Return ONLY the JSON object starting with { and ending with }. Do not use markdown formatting, code blocks, or backticks.`;
    
    const agent = new MultimodalAgent();
    const input: MultimodalInput = {
      prompt: analysisPrompt,
      text: systemPrompt
    };
    
    const response = await agent.process(input);
    const analysisText = response.content;
    
    if (!analysisText) {
      throw new Error('Failed to get analysis from AI');
    }
    
    // Parse the AI response
    let analysis;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = analysisText.trim();
      
      // Remove markdown code blocks
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any remaining backticks at the start/end
      cleanedText = cleanedText.replace(/^`+|`+$/g, '').trim();
      
      console.log('Raw AI response:', analysisText);
      console.log('Cleaned response:', cleanedText);
      
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      console.error('Original response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }
    
    // Find and update user profile
    let user = await User.findOne({ userId });
    
    if (!user) {
      user = new User({
        userId: userId,
        email: decoded.email || '',
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
    }
    
    // Update user profile with analysis
    user.sampleContent.originalPosts = samplePosts;
    user.sampleContent.analyzedPatterns = {
      averageLength: analysis.averageLength || 0,
      commonPhrases: analysis.commonPhrases || [],
      sentenceStructure: analysis.sentenceStructure || '',
      vocabularyLevel: analysis.vocabularyLevel || 'intermediate',
      styleNotes: analysis.styleNotes || ''
    };
    
    // Update writing style based on analysis
    if (analysis.tone) user.writingStyle.tone = analysis.tone;
    if (analysis.personality) user.writingStyle.personality = analysis.personality;
    if (analysis.formalityLevel) user.writingStyle.formalityLevel = analysis.formalityLevel;
    if (analysis.humorStyle) user.writingStyle.humorStyle = analysis.humorStyle;
    
    // Update brand voice with analyzed adjectives
    if (analysis.brandAdjectives) {
      user.brandVoice.adjectives = analysis.brandAdjectives;
    }
    
    // Update content preferences with themes
    if (analysis.contentThemes) {
      user.contentPreferences.topics = analysis.contentThemes;
    }
    
    // Update analysis timestamp
    user.preferences.lastAnalyzed = new Date();
    
    // Recalculate profile completion
    const completion = user.calculateProfileCompletion();
    
    console.log('Saving user profile analysis for userId:', userId);
    console.log('User object before save:', JSON.stringify(user.toObject(), null, 2));
    
    await user.save();
    
    console.log('User profile analysis saved successfully');
    
    return NextResponse.json({
      success: true,
      data: {
        analysis: analysis,
        profile: user,
        profileCompletion: completion,
        recommendations: analysis.recommendedImprovements || []
      },
      message: 'Style analysis completed successfully'
    });
    
  } catch (error) {
    console.error('Error analyzing writing style:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}