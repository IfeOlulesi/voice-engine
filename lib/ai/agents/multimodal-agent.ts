import { GroqProvider, GroqResponse } from '../groq-provider';

export interface MultimodalInput {
  text?: string;
  images?: Array<{
    url?: string;
    base64?: string;
    description?: string;
  }>;
  prompt: string;
  context?: Record<string, any>;
}

export interface AgentResponse<T = any> {
  content: T;
  rateLimits: any;
  metadata: {
    model: string;
    processingTime: number;
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

export class MultimodalAgent {
  private groq: GroqProvider;

  constructor(groqApiKey?: string) {
    this.groq = new GroqProvider(groqApiKey);
  }

  async process(input: MultimodalInput): Promise<AgentResponse> {
    const startTime = Date.now();
    const models = this.groq.getModels();
    
    const hasImages = input.images && input.images.length > 0;
    const hasText = Boolean(input.text);

    let selectedModel: string;
    let messages: Array<any> = [];

    if (hasImages && hasText) {
      selectedModel = models.vision.maverick;
      messages = this.buildMultimodalMessages(input);
    } else if (hasImages) {
      selectedModel = models.vision.scout;
      messages = this.buildImageMessages(input);
    } else {
      selectedModel = input.prompt.length > 1000 ? models.text.powerful : models.text.fast;
      messages = this.buildTextMessages(input);
    }

    try {
      const response: GroqResponse = await this.groq.chatCompletion({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
      });

      return {
        content: response.data.choices[0].message.content,
        rateLimits: response.rateLimits,
        metadata: {
          model: selectedModel,
          processingTime: Date.now() - startTime,
          tokenUsage: response.data.usage ? {
            prompt: response.data.usage.prompt_tokens,
            completion: response.data.usage.completion_tokens,
            total: response.data.usage.total_tokens,
          } : undefined,
        },
      };
    } catch (error: any) {
      throw new Error(`Agent processing failed: ${error.message}`);
    }
  }

  private buildMultimodalMessages(input: MultimodalInput) {
    const content: Array<any> = [
      { type: 'text', text: input.prompt }
    ];

    if (input.text) {
      content.push({ type: 'text', text: `Context: ${input.text}` });
    }

    if (input.images) {
      input.images.forEach(image => {
        if (image.url) {
          content.push({
            type: 'image_url',
            image_url: { url: image.url }
          });
        } else if (image.base64) {
          content.push({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${image.base64}` }
          });
        }
      });
    }

    return [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant that can analyze images and text together to provide comprehensive responses.'
      },
      {
        role: 'user' as const,
        content
      }
    ];
  }

  private buildImageMessages(input: MultimodalInput) {
    const content: Array<any> = [
      { type: 'text', text: input.prompt }
    ];

    if (input.images) {
      input.images.forEach(image => {
        if (image.url) {
          content.push({
            type: 'image_url',
            image_url: { url: image.url }
          });
        } else if (image.base64) {
          content.push({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${image.base64}` }
          });
        }
      });
    }

    return [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant specialized in image analysis and description.'
      },
      {
        role: 'user' as const,
        content
      }
    ];
  }

  private buildTextMessages(input: MultimodalInput) {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant specialized in text processing and content generation.'
      }
    ];

    let userContent = input.prompt;
    if (input.text) {
      userContent = `${input.prompt}\n\nContext: ${input.text}`;
    }

    messages.push({
      role: 'user',
      content: userContent
    });

    return messages;
  }

  async streamProcess(input: MultimodalInput) {
    const models = this.groq.getModels();
    const hasImages = input.images && input.images.length > 0;
    const hasText = Boolean(input.text);

    let selectedModel: string;
    let messages: Array<any> = [];

    if (hasImages && hasText) {
      selectedModel = models.vision.maverick;
      messages = this.buildMultimodalMessages(input);
    } else if (hasImages) {
      selectedModel = models.vision.scout;
      messages = this.buildImageMessages(input);
    } else {
      selectedModel = input.prompt.length > 1000 ? models.text.powerful : models.text.fast;
      messages = this.buildTextMessages(input);
    }

    return this.groq.streamChatCompletion({
      model: selectedModel,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    });
  }
}