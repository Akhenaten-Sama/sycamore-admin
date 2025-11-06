const jwt = require('jsonwebtoken');

// Test different JWT scenarios
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test token creation for the user we found
const testMemberId = '68c2a20dff2ab52f764afd00'; // The actual member ID from database
const testEmail = 'olalekanefunkunle2@gmail.com';

console.log('🧪 Testing JWT Token Creation/Verification');
console.log('==========================================');

// Create a test token like the system would
const testToken = jwt.sign(
  { 
    memberId: testMemberId,
    email: testEmail,
    iat: Math.floor(Date.now() / 1000)
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('📝 Created test token for user:', testEmail);
console.log('🔑 Token preview:', testToken.substring(0, 50) + '...');

// Verify the token
try {
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('✅ Token verification successful');
  console.log('📊 Decoded token contents:', decoded);
  console.log('👤 Member ID in token:', decoded.memberId);
  console.log('📧 Email in token:', decoded.email);
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}

console.log('\n🔍 Expected Database Query:');
console.log(`db.givings.find({ memberId: ObjectId("${testMemberId}") })`);

console.log('\n💡 This script shows what a valid JWT should contain');
console.log('🔧 Copy the member ID and verify it matches your donations');