# AI Integration with Groq and BeeAI Framework

This project integrates Groq's AI models through a custom multimodal agent system with comprehensive rate limit tracking.

## Features

- **Multimodal Processing**: Support for text, image, and combined text+image inputs
- **Intelligent Model Selection**: Automatically chooses optimal models based on input type and complexity
- **Rate Limit Tracking**: Full integration with Groq's rate limit headers
- **Streaming Support**: Real-time response streaming for text generation
- **BeeAI Framework**: Modular agent-based architecture

## Quick Start

### 1. Environment Setup

```bash
# Add to your .env file
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Basic Usage

```typescript
import { createAIClient } from './lib/ai';

const client = createAIClient();

// Text processing
const result = await client.process({
  prompt: 'Rewrite this to be more engaging',
  text: 'The weather is nice today.',
});

// Image analysis
const imageResult = await client.process({
  prompt: 'Describe this image',
  images: [{ url: 'https://example.com/image.jpg' }],
});

// Multimodal
const multiResult = await client.process({
  prompt: 'Create a product description',
  text: 'Premium quality product',
  images: [{ url: 'https://example.com/product.jpg' }],
});
```

### 3. API Endpoint

```bash
# POST /api/ai/process
curl -X POST http://localhost:3000/api/ai/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": {
      "prompt": "Write a creative story about AI",
      "text": "Once upon a time..."
    }
  }'
```

## Response Format

```typescript
{
  "success": true,
  "data": {
    "content": "Generated AI response...",
    "metadata": {
      "model": "llama-3.1-8b-instant",
      "processingTime": 1250,
      "tokenUsage": {
        "prompt": 15,
        "completion": 45,
        "total": 60
      }
    }
  },
  "rateLimits": {
    "requests": {
      "limit": 30,
      "remaining": 29,
      "reset": "2024-01-01T00:01:00Z"
    },
    "tokens": {
      "limit": 6000,
      "remaining": 5940,
      "reset": "2024-01-01T00:01:00Z"
    },
    "retryAfter": null
  }
}
```

## Models Available

### Text Models
- **llama-3.1-8b-instant**: Fast, efficient for simple tasks (560 tokens/sec)
- **llama-3.3-70b-versatile**: Powerful, for complex reasoning (280 tokens/sec)
- **gpt-oss-120b**: Specialized reasoning model (500 tokens/sec)

### Vision Models
- **llama-4-scout**: Image analysis and description
- **llama-4-maverick**: Advanced multimodal processing

## Rate Limit Information

The system tracks all Groq rate limit headers:
- **Requests Per Day (RPD)**: Daily request quota
- **Tokens Per Minute (TPM)**: Token usage rate limit
- **Reset Times**: When limits refresh
- **Retry After**: Wait time when rate limited

## Architecture

```
lib/ai/
├── groq-provider.ts          # Groq API integration with rate limiting
├── agents/
│   └── multimodal-agent.ts   # Main agent for processing requests
├── types.ts                  # TypeScript definitions
├── index.ts                  # Public API exports
└── test-client.ts            # Testing utilities

src/app/api/ai/process/
└── route.ts                  # Next.js API endpoint
```

## Testing

```bash
# Run the test suite
npx ts-node lib/ai/test-client.ts

# Test API endpoint
npm run dev
# Then visit http://localhost:3000/api/ai/process
```

## Error Handling

- **Rate Limit Exceeded (429)**: Returns retry-after information
- **Invalid Input (400)**: Missing required fields
- **Server Error (500)**: Internal processing errors

## Streaming

Enable real-time streaming for long responses:

```typescript
const response = await fetch('/api/ai/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'text',
    content: { prompt: 'Write a long story...' },
    options: { stream: true }
  })
});

const reader = response.body?.getReader();
// Process stream chunks...
```

## Best Practices

1. **Model Selection**: Let the agent choose models automatically based on input complexity
2. **Rate Limiting**: Monitor the returned rate limit information to avoid hitting limits
3. **Error Handling**: Always handle rate limit and network errors gracefully
4. **Image Size**: Keep images under 20MB and 33 megapixels
5. **Context**: Provide relevant context in the prompt for better results