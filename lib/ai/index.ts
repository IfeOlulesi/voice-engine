import { MultimodalAgent } from './agents/multimodal-agent';

export { GroqProvider, type GroqRateLimitInfo, type GroqResponse } from './groq-provider';
export { MultimodalAgent, type MultimodalInput, type AgentResponse } from './agents/multimodal-agent';
export type { AIProcessRequest, AIProcessResponse, RateLimitError } from './types';

export const AI_MODELS = {
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
} as const;

export const createAIClient = (apiKey?: string) => {
  return new MultimodalAgent(apiKey);
};