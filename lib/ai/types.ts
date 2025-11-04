export interface AIProcessRequest {
  type: 'text' | 'image' | 'multimodal';
  content: {
    text?: string;
    images?: Array<{
      url?: string;
      base64?: string;
      description?: string;
    }>;
    prompt: string;
    context?: Record<string, any>;
  };
  model?: string;
  options?: {
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  };
}

export interface AIProcessResponse {
  success: boolean;
  data: {
    content: string;
    metadata: {
      model: string;
      processingTime: number;
      tokenUsage?: {
        prompt: number;
        completion: number;
        total: number;
      };
    };
  };
  rateLimits: {
    requests: {
      limit: number;
      remaining: number;
      reset: string;
    };
    tokens: {
      limit: number;
      remaining: number;
      reset: string;
    };
    retryAfter?: number;
  };
}

export interface RateLimitError {
  error: string;
  message: string;
  type: 'rate_limit_error';
}