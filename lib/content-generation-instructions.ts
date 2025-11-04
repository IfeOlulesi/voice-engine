export type Platform = 'facebook' | 'instagram' | 'twitter';

export interface PlatformConstraints {
  maxLength: number;
  supportsHashtags: boolean;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsLinks: boolean;
  recommendedHashtagCount: number;
}

export interface SystemInstruction {
  platform: Platform;
  basePrompt: string;
  constraints: PlatformConstraints;
  toneGuidelines: string[];
  formatGuidelines: string[];
  engagementTips: string[];
}

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraints> = {
  facebook: {
    maxLength: 8000,
    supportsHashtags: true,
    supportsImages: true,
    supportsVideo: true,
    supportsLinks: true,
    recommendedHashtagCount: 3
  },
  instagram: {
    maxLength: 2200,
    supportsHashtags: true,
    supportsImages: true,
    supportsVideo: true,
    supportsLinks: false,
    recommendedHashtagCount: 8
  },
  twitter: {
    maxLength: 280,
    supportsHashtags: true,
    supportsImages: true,
    supportsVideo: true,
    supportsLinks: true,
    recommendedHashtagCount: 2
  }
};

export const CONTENT_GENERATION_INSTRUCTIONS: SystemInstruction[] = [
  {
    platform: 'facebook',
    basePrompt: `You are an expert Facebook content creator. Transform the provided content into engaging Facebook posts that encourage meaningful conversations and community engagement. Focus on storytelling, personal connection, and providing value to the audience.`,
    constraints: PLATFORM_CONSTRAINTS.facebook,
    toneGuidelines: [
      'Use a conversational and friendly tone',
      'Write in first or second person to create connection',
      'Include personal anecdotes or relatable experiences when relevant',
      'Encourage discussion with open-ended questions',
      'Be authentic and genuine in your messaging'
    ],
    formatGuidelines: [
      'Start with a compelling hook in the first sentence',
      'Use paragraph breaks for easy reading (mobile-friendly)',
      'Include emojis sparingly for emphasis and emotion',
      'Add 1-3 relevant hashtags at the end',
      'Include a clear call-to-action when appropriate',
      'Keep most important information in the first 2-3 lines'
    ],
    engagementTips: [
      'Ask questions to encourage comments',
      'Share behind-the-scenes content or processes',
      'Use storytelling to make content memorable',
      'Reference current events or trending topics when relevant',
      'Include user-generated content opportunities',
      'Share valuable tips, insights, or educational content'
    ]
  },
  {
    platform: 'instagram',
    basePrompt: `You are a skilled Instagram content strategist. Adapt the provided content for Instagram's visual-first, discovery-focused platform. Create posts that are aesthetically appealing, highly discoverable, and optimized for engagement within Instagram's algorithm.`,
    constraints: PLATFORM_CONSTRAINTS.instagram,
    toneGuidelines: [
      'Use an inspiring and aspirational tone',
      'Write with energy and enthusiasm',
      'Be authentic and relatable to your target audience',
      'Use inclusive language that welcomes all followers',
      'Balance professional expertise with personal touch'
    ],
    formatGuidelines: [
      'Create scroll-stopping opening lines',
      'Use strategic line breaks and spacing for visual appeal',
      'Include relevant emojis throughout the text',
      'Add 5-8 strategic hashtags mixed within the caption',
      'End with a strong call-to-action',
      'Use bullet points or numbered lists for easy consumption',
      'Keep captions concise but informative'
    ],
    engagementTips: [
      'Include trending and niche hashtags for discoverability',
      'Ask followers to share in comments or stories',
      'Create shareable quotes or tips',
      'Reference Instagram features (Reels, Stories, IGTV)',
      'Encourage saves by providing valuable information',
      'Use location tags when relevant',
      'Tag relevant accounts and collaborators'
    ]
  },
  {
    platform: 'twitter',
    basePrompt: `You are an expert Twitter content creator specializing in concise, impactful messaging. Transform the provided content into compelling tweets that spark conversation, provide quick value, and encourage engagement within Twitter's fast-paced environment.`,
    constraints: PLATFORM_CONSTRAINTS.twitter,
    toneGuidelines: [
      'Be direct and to the point',
      'Use a confident and authoritative voice',
      'Inject personality and wit when appropriate',
      'Stay current with trends and cultural moments',
      'Balance professionalism with approachability'
    ],
    formatGuidelines: [
      'Lead with the most important information',
      'Use strategic capitalization for emphasis',
      'Include 1-2 relevant hashtags naturally within the text',
      'Use emojis sparingly for clarity and emotion',
      'Keep threads coherent if content requires multiple tweets',
      'End with clear next steps or calls-to-action'
    ],
    engagementTips: [
      'Ask thought-provoking questions',
      'Share quick tips or insights',
      'Comment on trending topics in your niche',
      'Use polls and Twitter features for interaction',
      'Retweet and engage with community content',
      'Share real-time updates and behind-the-scenes content',
      'Participate in relevant Twitter chats and conversations'
    ]
  }
];

export function getInstructionsByPlatform(platform: Platform): SystemInstruction | undefined {
  return CONTENT_GENERATION_INSTRUCTIONS.find(instruction => instruction.platform === platform);
}

export function buildSystemPrompt(platform: Platform, additionalContext?: string, userProfile?: UserProfile): string {
  const instruction = getInstructionsByPlatform(platform);
  if (!instruction) {
    throw new Error(`No instructions found for platform: ${platform}`);
  }

  const constraints = instruction.constraints;
  const contextSection = additionalContext ? `\n\nAdditional Context: ${additionalContext}` : '';
  
  // Build user profile section if provided
  let userProfileSection = '';
  if (userProfile) {
    const platformStyle = userProfile.platformStyles[platform] || {};
    
    userProfileSection = `

USER PROFILE & BRAND VOICE:
- Writing Tone: ${platformStyle.tone || userProfile.writingStyle.tone} (override platform default)
- Personality: ${userProfile.writingStyle.personality}
- Formality Level: ${userProfile.writingStyle.formalityLevel}
- Humor Style: ${userProfile.writingStyle.humorStyle}
- Brand Type: ${userProfile.brandVoice.brandType}
- Industry: ${userProfile.brandVoice.industry}
- Target Audience: ${userProfile.brandVoice.targetAudience}
- Brand Adjectives: ${userProfile.brandVoice.adjectives.join(', ')}
- Core Values: ${userProfile.brandVoice.values.join(', ')}
- Vocabulary Level: ${userProfile.sampleContent.analyzedPatterns.vocabularyLevel}
- Hashtag Preference: ${platformStyle.hashtagStyle || 'moderate'}

CONTENT PREFERENCES:
- Preferred Topics: ${userProfile.contentPreferences.topics.join(', ')}
- Content Pillars: ${userProfile.contentPreferences.contentPillars.join(', ')}
- Preferred Formats: ${userProfile.contentPreferences.preferredFormats.join(', ')}
- Topics to Avoid: ${userProfile.contentPreferences.avoidTopics.join(', ')}

WRITING STYLE PATTERNS:
- Common Phrases: ${userProfile.sampleContent.analyzedPatterns.commonPhrases.join(', ')}
- Sentence Structure: ${userProfile.sampleContent.analyzedPatterns.sentenceStructure}
- Style Notes: ${userProfile.sampleContent.analyzedPatterns.styleNotes}

IMPORTANT: Prioritize the user's profile preferences over platform defaults. Maintain their unique voice and style while adapting to platform requirements.`;
  }

  return `${instruction.basePrompt}

PLATFORM CONSTRAINTS:
- Maximum character limit: ${constraints.maxLength}
- Hashtags supported: ${constraints.supportsHashtags ? 'Yes' : 'No'}
- Recommended hashtag count: ${constraints.recommendedHashtagCount}
- Images supported: ${constraints.supportsImages ? 'Yes' : 'No'}
- Video supported: ${constraints.supportsVideo ? 'Yes' : 'No'}
- Links supported: ${constraints.supportsLinks ? 'Yes' : 'No'}

TONE GUIDELINES:
${instruction.toneGuidelines.map(tip => `- ${tip}`).join('\n')}

FORMAT GUIDELINES:
${instruction.formatGuidelines.map(tip => `- ${tip}`).join('\n')}

ENGAGEMENT OPTIMIZATION:
${instruction.engagementTips.map(tip => `- ${tip}`).join('\n')}${userProfileSection}${contextSection}

Now transform the provided content according to these guidelines while maintaining the core message and value proposition. If user profile is provided, ensure the content matches their unique voice, tone, and style preferences.`;
}

export interface UserProfile {
  writingStyle: {
    tone: string;
    personality: string;
    formalityLevel: string;
    humorStyle: string;
  };
  brandVoice: {
    adjectives: string[];
    values: string[];
    targetAudience: string;
    industry: string;
    brandType: string;
  };
  contentPreferences: {
    topics: string[];
    contentPillars: string[];
    preferredFormats: string[];
    avoidTopics: string[];
  };
  platformStyles: {
    [key: string]: {
      tone?: string;
      style?: string;
      hashtagStyle?: string;
    };
  };
  sampleContent: {
    analyzedPatterns: {
      commonPhrases: string[];
      sentenceStructure: string;
      vocabularyLevel: string;
      styleNotes: string;
    };
  };
}

export interface ContentGenerationRequest {
  originalContent: string;
  platform: Platform;
  targetAudience?: string;
  brandVoice?: string;
  additionalContext?: string;
  userProfile?: UserProfile;
}

export interface GeneratedContent {
  platform: Platform;
  content: string;
  hashtags: string[];
  characterCount: number;
  estimatedEngagement: 'low' | 'medium' | 'high';
  suggestions: string[];
}