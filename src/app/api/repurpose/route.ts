import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { connectDB, User } from '../../../../lib/db';
import { z } from 'zod';
import { MultimodalAgent, MultimodalInput } from '../../../../lib/ai/agents/multimodal-agent';
import { buildSystemPrompt, Platform, GeneratedContent } from '../../../../lib/content-generation-instructions';

const RequestSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters long'),
  images: z.array(z.string()).optional(),
  platforms: z.array(z.enum(['facebook', 'instagram', 'twitter'])).optional(),
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
  additionalContext: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get user info
    const decoded = await requireAuth(request);
    const userId = decoded.uid;
    
    // Connect to database
    await connectDB();
    
    // Parse and validate request body
    const body = await request.json();
    const { text, images, platforms, targetAudience, brandVoice, additionalContext } = RequestSchema.parse(body);
    
    console.log('Repurposing content:', { text, platforms, targetAudience, brandVoice });
    
    // Fetch user profile for personalization
    let userProfile = null;
    try {
      const user = await User.findOne({ userId });
      if (user && user.onboardingCompleted) {
        userProfile = {
          writingStyle: user.writingStyle,
          brandVoice: user.brandVoice,
          contentPreferences: user.contentPreferences,
          platformStyles: user.platformStyles,
          sampleContent: user.sampleContent
        };
      }
    } catch (profileError) {
      console.log('Could not fetch user profile, proceeding with defaults:', profileError);
    }
    
    const selectedPlatforms: Platform[] = platforms || ['facebook', 'instagram', 'twitter'];
    const agent = new MultimodalAgent();
    const results: GeneratedContent[] = [];
    
    // Generate content for each platform
    for (const platform of selectedPlatforms) {
      const systemPrompt = buildSystemPrompt(platform, additionalContext, userProfile || undefined);
      
      const contextPrompt = `
        ${targetAudience ? `Target Audience: ${targetAudience}` : ''}
        ${brandVoice ? `Brand Voice: ${brandVoice}` : ''}
        
        Original Content: ${text}
        
        Please repurpose this content for ${platform} following the guidelines provided.
      `.trim();
      
      const input: MultimodalInput = {
        text: text,
        images: (images || []).map(img => ({ url: img })),
        prompt: systemPrompt,
        context: { prompt: contextPrompt },
      };
      
      try {
        const result = await agent.process(input);
        
        // Extract hashtags from content (simple regex approach)
        const hashtagRegex = /#\w+/g;
        const hashtags = result.content.match(hashtagRegex) || [];
        
        results.push({
          platform,
          content: result.content,
          hashtags,
          characterCount: result.content.length,
          estimatedEngagement: result.content.length > 100 && hashtags.length > 0 ? 'high' : 'medium',
          suggestions: [
            `Consider adding ${platform === 'instagram' ? 'more' : 'relevant'} hashtags`,
            `Engage with your audience by asking questions`,
            `Share at optimal times for your audience`
          ]
        });
      } catch (platformError) {
        console.error(`Error generating content for ${platform}:`, platformError);
        // Continue with other platforms even if one fails
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        original: text,
        results,
        metadata: {
          generatedAt: new Date().toISOString(),
          platformsProcessed: results.length,
          totalCharacters: results.reduce((sum, r) => sum + r.characterCount, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error in repurpose endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}