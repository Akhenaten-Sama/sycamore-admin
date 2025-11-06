const jwt = require('jsonwebtoken');

// Create a fresh JWT token with current timestamp
const payload = {
  userId: '68c2a20dff2ab52f764afd00',
  memberId: '68c2a20cff2ab52f764afcfe',
  email: 'olalekanefunkunle2@gmail.com',
  role: 'team_leader',
  permissions: ['read:own_profile', 'update:own_profile'],
  iat: Math.floor(Date.now() / 1000), // Current time
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days from now
};

const token = jwt.sign(payload, 'sycamore-church-secret-key');

console.log('🎫 Fresh JWT Token:');
console.log(token);
console.log('\n📋 Token Details:');
console.log('User ID:', payload.userId);
console.log('Member ID:', payload.memberId);
console.log('Email:', payload.email);
console.log('Expires:', new Date(payload.exp * 1000).toLocaleString());

// Test the token by decoding it
try {
  const decoded = jwt.verify(token, 'sycamore-church-secret-key');
  console.log('\n✅ Token Verification: SUCCESS');
} catch (error) {
  console.log('\n❌ Token Verification: FAILED');
}