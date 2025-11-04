import { NextRequest, NextResponse } from 'next/server';
import { MultimodalAgent, MultimodalInput } from '../../../../../lib/ai/agents/multimodal-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { type, content, model, options } = body;

    if (!content || !content.prompt) {
      return NextResponse.json(
        { error: 'Missing required field: content.prompt' },
        { status: 400 }
      );
    }

    const agent = new MultimodalAgent();

    const input: MultimodalInput = {
      text: content.text,
      images: content.images,
      prompt: content.prompt,
      context: content.context,
    };

    const isStreaming = options?.stream === true;

    if (isStreaming) {
      const stream = await agent.streamProcess(input);
      
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const result = await agent.process(input);

      return NextResponse.json({
        success: true,
        data: {
          content: result.content,
          metadata: result.metadata,
        },
        rateLimits: {
          requests: {
            limit: result.rateLimits.limitRequests,
            remaining: result.rateLimits.remainingRequests,
            reset: result.rateLimits.resetRequests,
          },
          tokens: {
            limit: result.rateLimits.limitTokens,
            remaining: result.rateLimits.remainingTokens,
            reset: result.rateLimits.resetTokens,
          },
          retryAfter: result.rateLimits.retryAfter,
        },
      });
    }
  } catch (error: any) {
    console.error('AI processing error:', error);

    if (error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: error.message,
          type: 'rate_limit_error'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Processing API',
    version: '1.0.0',
    endpoints: {
      POST: '/api/ai/process',
    },
    supportedTypes: ['text', 'image', 'multimodal'],
    models: {
      text: {
        fast: 'llama-3.1-8b-instant',
        powerful: 'llama-3.3-70b-versatile',
        reasoning: 'gpt-oss-120b',
      },
      vision: {
        scout: 'meta-llama/llama-4-scout-17b-16e-instruct',
        maverick: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      },
    },
  });
}