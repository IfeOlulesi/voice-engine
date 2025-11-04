// Test script to demonstrate LinkedIn integration usage
// This file shows how to use the LinkedIn API endpoints

console.log('LinkedIn Integration Test Guide');
console.log('=====================================');
console.log('');

console.log('1. OAuth Flow:');
console.log('   - Visit: /api/auth/linkedin/authorize');
console.log('   - This will redirect to LinkedIn for authorization');
console.log('   - After authorization, you\'ll be redirected to: /api/auth/linkedin/callback');
console.log('   - The callback will return an access token');
console.log('');

console.log('2. Fetch Recent Posts:');
console.log('   GET /api/linkedin/posts?access_token=YOUR_TOKEN&limit=10');
console.log('   Headers: Authorization: Bearer YOUR_TOKEN');
console.log('');

console.log('3. Pull and Repurpose Latest Post:');
console.log('   GET /api/pull-linkedin?access_token=YOUR_TOKEN');
console.log('   Headers: Authorization: Bearer YOUR_TOKEN');
console.log('');

console.log('Environment Variables Required:');
console.log('- LINKEDIN_CLIENT_ID: Your LinkedIn app client ID');
console.log('- LINKEDIN_CLIENT_SECRET: Your LinkedIn app client secret');
console.log('');

console.log('LinkedIn API Scopes Used:');
console.log('- r_liteprofile: Access to basic profile info');
console.log('- r_emailaddress: Access to email address');
console.log('- w_member_social: Post content on behalf of user');
console.log('- r_member_social: Read user\'s posts and social activity');
console.log('');

console.log('Note: Make sure your LinkedIn app is configured with the correct redirect URI:');
console.log('http://localhost:3000/api/auth/linkedin/callback (for local development)');
console.log('https://yourdomain.com/api/auth/linkedin/callback (for production)');