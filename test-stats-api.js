const jwt = require('jsonwebtoken');

async function testStatsAPI() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMyYTIwZGZmMmFiNTJmNzY0YWZkMDAiLCJtZW1iZXJJZCI6IjY4YzJhMjBjZmYyYWI1MmY3NjRhZmNmZSIsImVtYWlsIjoib2xhbGVrYW5lZnVua3VubGUyQGdtYWlsLmNvbSIsInJvbGUiOiJ0ZWFtX2xlYWRlciIsInBlcm1pc3Npb25zIjpbInJlYWQ6b3duX3Byb2ZpbGUiLCJ1cGRhdGU6b3duX3Byb2ZpbGUiXSwiaWF0IjoxNzYyMzkwNjk1LCJleHAiOjE3NjI5OTU0OTV9.lsiXSUv-tc6Y4qJ5Ymj0xfp3RpQWKsAowqLUsFCf0Dg';
  
  console.log('🧪 Testing Fixed Stats API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/mobile/donations?type=stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response Status:', response.status);
    const data = await response.text();
    console.log('Raw Response:', data);
    
    if (response.ok) {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ Parsed Response:', JSON.stringify(parsed, null, 2));
        
        if (parsed.success && parsed.data.totalGiving > 0) {
          console.log('🎉 SUCCESS! Stats now showing real data:', {
            totalGiving: parsed.data.totalGiving,
            totalDonations: parsed.data.totalDonations,
            yearlyGiving: parsed.data.yearlyGiving
          });
        } else {
          console.log('❌ Still showing zeros...');
        }
      } catch (e) {
        console.log('❌ Failed to parse JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
if (typeof fetch !== 'undefined') {
  testStatsAPI();
} else {
  console.log('Need to run with node-fetch or in browser');
}