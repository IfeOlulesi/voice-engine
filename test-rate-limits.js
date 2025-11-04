const { GroqProvider } = require('./lib/ai/groq-provider');

async function test() {
  const groq = new GroqProvider();
  
  try {
    const result = await groq.chatCompletion({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'Say hello' }],
      stream: false,
    });
    
    console.log('Data:', result.data.choices[0].message.content);
    console.log('Rate Limits:', JSON.stringify(result.rateLimits, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();