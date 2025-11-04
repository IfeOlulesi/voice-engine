import Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming } from 'groq-sdk/resources/chat/completions';

export interface GroqRateLimitInfo {
  limitRequests: number;
  limitTokens: number;
  remainingRequests: number;
  remainingTokens: number;
  resetRequests: string;
  resetTokens: string;
  retryAfter?: number;
}

export interface GroqResponse<T = any> {
  data: T;
  rateLimits: GroqRateLimitInfo;
}

export class GroqProvider {
  private client: Groq;

  constructor(apiKey?: string) {
    this.client = new Groq({
      apiKey: apiKey || process.env.GROQ_API_KEY,
    });
  }

  private extractRateLimits(headers: Headers): GroqRateLimitInfo {
    return {
      limitRequests: parseInt(headers.get('x-ratelimit-limit-requests') || '0'),
      limitTokens: parseInt(headers.get('x-ratelimit-limit-tokens') || '0'),
      remainingRequests: parseInt(headers.get('x-ratelimit-remaining-requests') || '0'),
      remainingTokens: parseInt(headers.get('x-ratelimit-remaining-tokens') || '0'),
      resetRequests: headers.get('x-ratelimit-reset-requests') || '',
      resetTokens: headers.get('x-ratelimit-reset-tokens') || '',
      retryAfter: headers.get('retry-after') ? parseInt(headers.get('retry-after')!) : undefined,
    };
  }

  async chatCompletion(params: ChatCompletionCreateParamsNonStreaming): Promise<GroqResponse> {
    try {
      const response = await this.client.chat.completions.create(params).withResponse();
      
      return {
        data: response.data,
        rateLimits: this.extractRateLimits(response.response.headers),
      };
    } catch (error: any) {
      if (error.status === 429) {
        throw new Error(`Rate limit exceeded. ${error.headers?.get('retry-after') ? `Retry after ${error.headers.get('retry-after')} seconds.` : ''}`);
      }
      throw error;
    }
  }

  async streamChatCompletion(params: ChatCompletionCreateParamsStreaming) {
    const stream = await this.client.chat.completions.create(params);
    return stream;
  }

  getModels() {
    return {
      text: {
        fast: 'llama-3.1-8b-instant',
        powerful: 'llama-3.3-70b-versatile',
        reasoning: 'gpt-oss-120b',
      },
      vision: {
        scout: 'meta-llama/llama-4-scout-17b-16e-instruct',
        maverick: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      },
      compound: 'groq-compound',
    };
  }
}