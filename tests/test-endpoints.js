// Simple test script to verify endpoints
// Run with: node test-endpoints.js
// Make sure to set up .env with proper credentials first

const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing PostVibe Phase 1 endpoints...\n');
  
  // Test repurpose endpoint (manual testing)
  console.log('1. Testing /api/repurpose endpoint...');
  try {
    const testText = "Just launched a new AI feature that saves developers 2 hours daily. The secret? Combining traditional algorithms with modern LLMs for better accuracy. Sometimes the best innovation comes from merging old and new approaches. What's your experience with hybrid solutions? #AI #TechInnovation";
    
    const response = await fetch(`${baseUrl}/api/repurpose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-firebase-token-here' // Replace with actual token
      },
      body: JSON.stringify({ text: testText })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Repurpose endpoint working!');
      console.log('Generated variants:');
      console.log('- X Thread:', data.data.variants.x.thread);
      console.log('- Instagram Carousel:', data.data.variants.ig.carousel);
      console.log('- Facebook Post:', data.data.variants.fb.post);
      console.log('- Facebook Poll:', data.data.variants.fb.poll);
    } else {
      console.log('❌ Repurpose endpoint failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Error testing repurpose endpoint:', error.message);
  }
  
  console.log('\n2. Testing /api/pull-linkedin endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/pull-linkedin`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer your-firebase-token-here' // Replace with actual token
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Pull LinkedIn endpoint working!');
      console.log('Post ID:', data.data.postId);
      console.log('Status:', data.data.status);
      console.log('Scheduled times:', data.data.scheduledAt);
    } else {
      console.log('❌ Pull LinkedIn endpoint failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Error testing pull-linkedin endpoint:', error.message);
  }
  
  console.log('\n📋 Setup Instructions:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Fill in your MongoDB, OpenAI, and Firebase credentials');
  console.log('3. Replace "your-firebase-token-here" with actual Firebase ID token');
  console.log('4. Run: npm run dev');
  console.log('5. Run this test script: node test-endpoints.js');
};

// Only run if this file is executed directly
if (require.main === module) {
  testEndpoints();
}

module.exports = { testEndpoints };