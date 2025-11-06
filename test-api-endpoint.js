// Test the actual mobile donations API endpoint
async function testMobileDonationsAPI() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMyYTIwZGZmMmFiNTJmNzY0YWZkMDAiLCJtZW1iZXJJZCI6IjY4YzJhMjBjZmYyYWI1MmY3NjRhZmNmZSIsImVtYWlsIjoib2xhbGVrYW5lZnVua3VubGUyQGdtYWlsLmNvbSIsInJvbGUiOiJ0ZWFtX2xlYWRlciIsInBlcm1pc3Npb25zIjpbInJlYWQ6b3duX3Byb2ZpbGUiLCJ1cGRhdGU6b3duX3Byb2ZpbGUiXSwiaWF0IjoxNzYyMzkwNjk1LCJleHAiOjE3NjI5OTU0OTV9.lsiXSUv-tc6Y4qJ5Ymj0xfp3RpQWKsAowqLUsFCf0Dg';
  
  console.log('🧪 Testing Mobile Donations API...');
  
  try {
    // Test stats endpoint
    console.log('\n📊 Testing STATS endpoint...');
    const statsResponse = await fetch('http://localhost:3000/api/mobile/donations?type=stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Stats Response Status:', statsResponse.status);
    const statsData = await statsResponse.text();
    console.log('Stats Response Data:', statsData);
    
    if (statsResponse.ok) {
      try {
        const parsedStats = JSON.parse(statsData);
        console.log('✅ Parsed Stats:', JSON.stringify(parsedStats, null, 2));
      } catch (e) {
        console.log('❌ Failed to parse stats JSON');
      }
    }
    
    // Test history endpoint
    console.log('\n📋 Testing HISTORY endpoint...');
    const historyResponse = await fetch('http://localhost:3000/api/mobile/donations?type=history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('History Response Status:', historyResponse.status);
    const historyData = await historyResponse.text();
    console.log('History Response Data:', historyData);
    
    if (historyResponse.ok) {
      try {
        const parsedHistory = JSON.parse(historyData);
        console.log('✅ Parsed History:', JSON.stringify(parsedHistory, null, 2));
      } catch (e) {
        console.log('❌ Failed to parse history JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

// Test using Node.js fetch (if available) or show the test script
if (typeof fetch !== 'undefined') {
  testMobileDonationsAPI();
} else {
  console.log('📝 Test script ready - run in browser console or with fetch polyfill');
  console.log('Token to use:', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMyYTIwZGZmMmFiNTJmNzY0YWZkMDAiLCJtZW1iZXJJZCI6IjY4YzJhMjBjZmYyYWI1MmY3NjRhZmNmZSIsImVtYWlsIjoib2xhbGVrYW5lZnVua3VubGUyQGdtYWlsLmNvbSIsInJvbGUiOiJ0ZWFtX2xlYWRlciIsInBlcm1pc3Npb25zIjpbInJlYWQ6b3duX3Byb2ZpbGUiLCJ1cGRhdGU6b3duX3Byb2ZpbGUiXSwiaWF0IjoxNzYyMzkwNjk1LCJleHAiOjE3NjI5OTU0OTV9.lsiXSUv-tc6Y4qJ5Ymj0xfp3RpQWKsAowqLUsFCf0Dg');
}