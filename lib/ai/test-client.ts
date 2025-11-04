import { createAIClient, type AIProcessRequest } from './index';

async function testAIIntegration() {
  console.log('Testing AI Integration...\n');

  const client = createAIClient();

  // Test 1: Text-only processing
  console.log('🧪 Test 1: Text Processing');
  try {
    const textInput = {
      text: 'The weather is beautiful today.',
      prompt: 'Rewrite this sentence to be more engaging and descriptive.',
      context: { style: 'creative' }
    };

    const textResult = await client.process(textInput);
    console.log('✅ Text Result:', textResult.content);
    console.log('📊 Rate Limits:', {
      requests: `${textResult.rateLimits.remainingRequests}/${textResult.rateLimits.limitRequests}`,
      tokens: `${textResult.rateLimits.remainingTokens}/${textResult.rateLimits.limitTokens}`
    });
    console.log('⚡ Model:', textResult.metadata.model);
    console.log('⏱️  Processing Time:', textResult.metadata.processingTime + 'ms\n');
  } catch (error) {
    console.error('❌ Text test failed:', error);
  }

  // Test 2: Image processing (if images are available)
  console.log('🧪 Test 2: Image Processing');
  try {
    const imageInput = {
      images: [{
        url: 'https://via.placeholder.com/300x200/0066CC/FFFFFF?text=Sample+Image'
      }],
      prompt: 'Describe what you see in this image and suggest improvements.'
    };

    const imageResult = await client.process(imageInput);
    console.log('✅ Image Result:', imageResult.content);
    console.log('📊 Rate Limits:', {
      requests: `${imageResult.rateLimits.remainingRequests}/${imageResult.rateLimits.limitRequests}`,
      tokens: `${imageResult.rateLimits.remainingTokens}/${imageResult.rateLimits.limitTokens}`
    });
    console.log('⚡ Model:', imageResult.metadata.model);
    console.log('⏱️  Processing Time:', imageResult.metadata.processingTime + 'ms\n');
  } catch (error) {
    console.error('❌ Image test failed:', error);
  }

  // Test 3: Multimodal processing
  console.log('🧪 Test 3: Multimodal Processing');
  try {
    const multimodalInput = {
      text: 'This is a product we are launching next month.',
      images: [{
        url: 'https://via.placeholder.com/300x200/FF6600/FFFFFF?text=Product+Image'
      }],
      prompt: 'Create a compelling marketing description for this product based on the image and context provided.'
    };

    const multimodalResult = await client.process(multimodalInput);
    console.log('✅ Multimodal Result:', multimodalResult.content);
    console.log('📊 Rate Limits:', {
      requests: `${multimodalResult.rateLimits.remainingRequests}/${multimodalResult.rateLimits.limitRequests}`,
      tokens: `${multimodalResult.rateLimits.remainingTokens}/${multimodalResult.rateLimits.limitTokens}`
    });
    console.log('⚡ Model:', multimodalResult.metadata.model);
    console.log('⏱️  Processing Time:', multimodalResult.metadata.processingTime + 'ms\n');
  } catch (error) {
    console.error('❌ Multimodal test failed:', error);
  }

  console.log('🎉 Testing completed!');
}

// Example API request format
export const exampleRequests = {
  textOnly: {
    type: 'text',
    content: {
      text: 'The weather is beautiful today.',
      prompt: 'Rewrite this sentence to be more engaging.',
    }
  } as AIProcessRequest,

  imageOnly: {
    type: 'image',
    content: {
      images: [{ url: 'https://example.com/image.jpg' }],
      prompt: 'Describe this image in detail.',
    }
  } as AIProcessRequest,

  multimodal: {
    type: 'multimodal',
    content: {
      text: 'Product launch context',
      images: [{ url: 'https://example.com/product.jpg' }],
      prompt: 'Create a marketing description.',
    },
    options: {
      stream: false,
      temperature: 0.7,
    }
  } as AIProcessRequest,

  streaming: {
    type: 'text',
    content: {
      prompt: 'Write a short story about AI.',
    },
    options: {
      stream: true,
    }
  } as AIProcessRequest,
};

if (require.main === module) {
  testAIIntegration();
}